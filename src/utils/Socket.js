const socket = require("socket.io");
const crypto = require("crypto");
const Chat = require("../models/chat");

/**
 * Generate a secure room name from two user IDs
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {string} - Secure room name hash
 */
const generateSecureRoomName = (userId1, userId2) => {
  const sortedIds = [userId1, userId2].sort().join("-");

  const hash = crypto.createHash("sha256").update(sortedIds).digest("hex");

  return hash.substring(0, 16);
};

const initialzeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  const activeConnections = new Map();
  const userRooms = new Map(); // Track user rooms for real-time updates

  io.on("connection", (socket) => {
    console.log(`New socket connection: ${socket.id}`);

    // Handle joining user room for real-time updates
    socket.on("joinUserRoom", (data) => {
      try {
        const { userId } = data;
        if (!userId) {
          console.error("Invalid data for joinUserRoom:", data);
          return;
        }

        const userRoom = `user_${userId}`;
        socket.join(userRoom);
        userRooms.set(socket.id, { userId, userRoom });

        console.log(`User ${userId} joined user room: ${userRoom}`);
      } catch (error) {
        console.error("Error in joinUserRoom handler:", error);
      }
    });

    // Handle unseen count updates
    socket.on("unseenCountUpdate", (data) => {
      try {
        const { userId, chatPartnerId } = data;
        if (!userId) return;

        // Emit to the user's room for real-time updates
        const userRoom = `user_${userId}`;
        socket.to(userRoom).emit("unseenCountUpdate", { userId });

        console.log(`Unseen count update emitted for user ${userId}`);
      } catch (error) {
        console.error("Error in unseenCountUpdate handler:", error);
      }
    });
    socket.on("joinChat", async (data) => {
      try {
        const { firstName, loggedInUserId, userId } = data || {};

        if (!loggedInUserId || !userId) {
          console.error("Invalid data for joinChat:", data);
          socket.emit("joinError", {
            error: "Missing required user IDs",
            timestamp: new Date().toISOString(),
          });
          return;
        }

        const roomName = generateSecureRoomName(loggedInUserId, userId);

        activeConnections.set(socket.id, {
          firstName,
          userId: loggedInUserId,
          roomName: roomName,
        });

        socket.join(roomName);
        console.log(
          `${firstName || "User"} (${loggedInUserId}) joined room: ${roomName}`
        );

        try {
          const existingChat = await Chat.findOne({
            participants: { $all: [loggedInUserId, userId] },
          });

          if (!existingChat) {
            console.log(
              `No existing chat found for ${loggedInUserId} and ${userId}, will create on first message`
            );
          } else {
            console.log(
              `Found existing chat with ${existingChat.messages.length} messages`
            );
          }
        } catch (dbError) {
          console.error("Error checking for existing chat:", dbError);
        }

        socket.to(roomName).emit("userJoined", {
          userId: loggedInUserId,
          firstName: firstName || "User",
          timestamp: new Date().toISOString(),
        });

        socket.emit("joinedChat", {
          roomName,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error in joinChat handler:", error);
        socket.emit("joinError", {
          error: "Failed to join chat room",
          timestamp: new Date().toISOString(),
        });
      }
    });

    socket.on("sendMessage", async (data) => {
      try {
        const { senderFirstName, senderId, receiverId, content } = data;

        if (!senderId || !receiverId || !content) {
          console.error("Invalid data for sendMessage:", data);
          return;
        }

        console.log(
          `Message received from ${senderId} to ${receiverId}: "${content}"`
        );

        const roomName = generateSecureRoomName(senderId, receiverId);
        console.log(`Broadcasting to room: ${roomName}`);

        console.log(
          `Active connections: ${Array.from(activeConnections.keys()).length}`
        );

        let chat = await Chat.findOne({
          participants: { $all: [senderId, receiverId] },
        });

        if (!chat) {
          console.log(`Creating new chat for ${senderId} and ${receiverId}`);
          chat = new Chat({
            participants: [senderId, receiverId],
            messages: [],
          });
        }

        chat.messages.push({
          senderId,
          text: content,
          createdAt: new Date(),
        });

        await chat.save();

        socket.to(roomName).emit("receiveMessage", {
          senderFirstName,
          senderId,
          content,
          timestamp: new Date().toISOString(),
        });

        // Emit real-time updates for unseen counts and chat lists
        const receiverRoom = `user_${receiverId}`;
        socket.to(receiverRoom).emit("receiveMessage", {
          senderFirstName,
          senderId,
          content,
          timestamp: new Date().toISOString(),
        });
        socket
          .to(receiverRoom)
          .emit("unseenCountUpdate", { userId: receiverId });

        console.log(`Message sent to room ${roomName}: "${content}"`);
      } catch (err) {
        console.error("Error processing message:", err);

        try {
          socket.emit("messageError", {
            error: "Failed to process message",
            originalMessage: data,
            timestamp: new Date().toISOString(),
          });
        } catch (notificationError) {
          console.error("Failed to notify sender of error:", notificationError);
        }
      }
    });

    socket.on("disconnect", () => {
      try {
        const connectionInfo = activeConnections.get(socket.id);
        const userRoomInfo = userRooms.get(socket.id);

        if (connectionInfo) {
          const { userId, roomName, firstName } = connectionInfo;

          try {
            socket.to(roomName).emit("userLeft", {
              userId: userId,
              firstName: firstName || "User",
              timestamp: new Date().toISOString(),
            });
          } catch (notifyError) {
            console.error(
              "Error notifying room of user departure:",
              notifyError
            );
          }

          activeConnections.delete(socket.id);

          console.log(
            `User ${
              firstName || "Unknown"
            } (${userId}) disconnected from room: ${roomName}`
          );
        }

        if (userRoomInfo) {
          const { userId, userRoom } = userRoomInfo;
          userRooms.delete(socket.id);
          console.log(`User ${userId} left user room: ${userRoom}`);
        }

        if (!connectionInfo && !userRoomInfo) {
          console.log("Socket disconnected (unknown user)");
        }

        console.log(
          `Remaining active connections: ${activeConnections.size}, user rooms: ${userRooms.size}`
        );
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    });
  });

  return io;
};

module.exports = initialzeSocket;
