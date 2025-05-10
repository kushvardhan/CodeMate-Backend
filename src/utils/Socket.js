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
    socket.on("joinChat", (data) => {
      const { firstName, loggedInUserId, userId } = data;

      if (!loggedInUserId || !userId) {
        console.error("Invalid data for joinChat:", data);
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
      console.log(`${firstName} ${loggedInUserId} joined room: ${roomName}`);

      // Notify the room that a user has joined
      socket.to(roomName).emit("userJoined", {
        userId: loggedInUserId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("sendMessage", async(data) => {
      try{

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

        const chat = await Chat.findOne({
          participants: { $all: [senderId, receiverId] },
        });
        if(!chat){
          chat = new Chat({
            participants: [senderId, receiverId],
            messages: [],
          });
        }

        chat.messages.push({
          senderId,
          text: content,
        })

        await chat.save();


      socket.to(roomName).emit("receiveMessage", {
        senderFirstName,
        senderId,
        content,
        timestamp: new Date().toISOString(),
      });
      console.log(`Message sent to room ${roomName}: "${content}"`);

      }catch(err){
        console.error("Error broadcasting message:", err);
      }

    });

    socket.on("disconnect", () => {
      const connectionInfo = activeConnections.get(socket.id);

      if (connectionInfo) {
        const { userId, roomName } = connectionInfo;

        // Notify the room that a user has left
        socket.to(roomName).emit("userLeft", {
          userId: userId,
          timestamp: new Date().toISOString(),
        });

        // Remove the connection from our map
        activeConnections.delete(socket.id);

        console.log(`User ${userId} disconnected from room: ${roomName}`);
      } else {
        console.log("User disconnected (unknown user)");
      }
    });
  });
};

module.exports = initialzeSocket;
