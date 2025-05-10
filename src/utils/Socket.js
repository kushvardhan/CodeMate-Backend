const socket = require("socket.io");

const initialzeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("joinChat", (data) => {
      const { loggedInUserId, userId } = data;
      console.log("User joined chat:", data);
      const roomName = [loggedInUserId, userId].sort().join("-");
      socket.join(roomName);
      console.log(`User ${loggedInUserId} joined room: ${roomName}`);
    });

    socket.on("sendMessage", (data) => {
      const { senderId, receiverId, content } = data;
      console.log("Message received:", data);

      const roomName = [senderId, receiverId].sort().join("-");

      // Emit the message to everyone in the room except the sender
      socket.to(roomName).emit("receiveMessage", {
        senderId,
        content,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};

module.exports = initialzeSocket;
