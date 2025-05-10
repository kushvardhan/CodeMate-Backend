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
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  // Store active connections
  const activeConnections = new Map();

  io.on("connection", (socket) => {
    socket.on("joinChat", async (data) => {
      try {
        // Safely extract data with defaults
        const { firstName = "User", loggedInUserId, userId } = data || {};

        // Validate required fields
        if (!loggedInUserId || !userId) {
          console.error("Invalid data for joinChat:", data);
          socket.emit("joinError", {
            error: "Missing required user IDs",
            timestamp: new Date().toISOString(),
          });
          return;
        }

        // Create a secure room name using crypto
        const roomName = generateSecureRoomName(loggedInUserId, userId);

        // Store the user's connection info
        activeConnections.set(socket.id, {
          firstName,
          userId: loggedInUserId,
          roomName: roomName,
        });

        // Join the room
        socket.join(roomName);
        console.log(
          `${firstName || "User"} (${loggedInUserId}) joined room: ${roomName}`
        );

        // Check if there's an existing chat in the database
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
          // Non-critical error, continue with socket connection
        }

        // Notify the room that a user has joined
        socket.to(roomName).emit("userJoined", {
          userId: loggedInUserId,
          firstName: firstName || "User",
          timestamp: new Date().toISOString(),
        });

        // Confirm to the user that they've joined successfully
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

        // Find existing chat or create a new one
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

        // Add the new message
        chat.messages.push({
          senderId,
          text: content,
          createdAt: new Date(), // Add timestamp for the message
        });

        // Save the chat to database
        await chat.save();

        socket.to(roomName).emit("receiveMessage", {
          senderFirstName,
          senderId,
          content,
          timestamp: new Date().toISOString(),
        });
        console.log(`Message sent to room ${roomName}: "${content}"`);
      } catch (err) {
        console.error("Error processing message:", err);

        // Send error notification to the sender if possible
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

        if (connectionInfo) {
          const { userId, roomName, firstName } = connectionInfo;

          // Safely notify the room that a user has left
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

          // Remove the connection from our map
          activeConnections.delete(socket.id);

          console.log(
            `User ${
              firstName || "Unknown"
            } (${userId}) disconnected from room: ${roomName}`
          );

          // Log active connections after disconnect
          console.log(
            `Remaining active connections: ${activeConnections.size}`
          );
        } else {
          console.log("User disconnected (unknown user)");
        }
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    });
  });
};

module.exports = initialzeSocket;
