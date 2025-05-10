const socket = require("socket.io");

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

      // Create a unique room name by sorting the IDs
      const roomName = [loggedInUserId, userId].sort().join("-");

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

    socket.on("sendMessage", (data) => {
      const { senderFirstName, senderId, receiverId, content } = data;

      if (!senderId || !receiverId || !content) {
        console.error("Invalid data for sendMessage:", data);
        return;
      }

      console.log(
        `Message received from ${senderId} to ${receiverId}: "${content}"`
      );

      // Create a unique room name by sorting the IDs
      const roomName = [senderId, receiverId].sort().join("-");

      // Log the room name and active connections
      console.log(`Broadcasting to room: ${roomName}`);
      console.log(
        `Active connections: ${Array.from(activeConnections.keys()).length}`
      );

      // Emit the message to everyone in the room except the sender
      socket.to(roomName).emit("receiveMessage", {
        senderFirstName,
        senderId,
        content,
        timestamp: new Date().toISOString(),
      });

      // Also log the message to the console for debugging
      console.log(`Message sent to room ${roomName}: "${content}"`);
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
