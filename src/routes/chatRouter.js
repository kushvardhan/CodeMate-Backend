const express = require("express");
const router = express.Router();
const { userAuth } = require("../middleware/auth");
const User = require("../models/user");
const Chat = require("../models/chat");
const ConnectionRequest = require("../models/connectionRequest");

router.get("/getChat/:userId", userAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedUser = req.user._id;

    if (!loggedUser || !userId) {
      return res.status(400).json({ message: "Missing required user IDs" });
    }

    let chat = await Chat.findOne({
      participants: { $all: [loggedUser, userId] },
    }).populate({
      path: "messages.senderId",
      select: "firstName lastName photoUrl",
    });

    if (!chat) {
      chat = new Chat({
        participants: [loggedUser, userId],
        messages: [],
      });

      await chat.save();

      // Re-fetch the chat to populate messages.senderId
      chat = await Chat.findById(chat._id).populate({
        path: "messages.senderId",
        select: "firstName lastName photoUrl",
      });
    }

    res.status(200).json(chat.messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/unseen-counts/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const chats = await Chat.find({ participants: userId })
      .populate("participants", "firstName lastName photoUrl")
      .populate("messages.senderId", "firstName lastName photoUrl");

    const allData = [];

    const unseenCounts = chats
      .map((chat) => {
        const otherUser = chat.participants.find(
          (p) => p._id.toString() !== userId
        );

        const unseenMessages = chat.messages.filter(
          (msg) =>
            msg.senderId._id.toString() !== userId &&
            (!msg.seen || msg.seen[userId] === false)
        );

        const data = {
          chatId: chat._id,
          userId: otherUser?._id,
          userInfo: {
            name: `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`,
            photoUrl: otherUser?.photoUrl || "",
          },
          allMessages: chat.messages.map((m) => ({
            _id: m._id,
            text: m.text,
            senderId: m.senderId._id,
            seen: m.seen,
            createdAt: m.createdAt,
          })),
          unseenCount: unseenMessages.length,
          unseenMessages: unseenMessages.map((msg) => ({
            _id: msg._id,
            text: msg.text,
            createdAt: msg.createdAt,
            sender: {
              _id: msg.senderId._id,
              name: `${msg.senderId.firstName} ${msg.senderId.lastName || ""}`,
              photoUrl: msg.senderId.photoUrl || "",
            },
          })),
        };

        allData.push(data);

        return {
          chatId: data.chatId,
          userId: data.userId,
          userInfo: data.userInfo,
          unseenCount: data.unseenCount,
          unseenMessages: data.unseenMessages,
        };
      })
      .filter((chat) => chat.unseenCount > 0);

    console.log("\n============== DEBUG LOG ==============");
    console.log("UserID:", userId);
    console.log(
      "All Chat Data with All Messages:\n",
      JSON.stringify(allData, null, 2)
    );
    console.log(
      "Final Filtered unseenCounts:\n",
      JSON.stringify(unseenCounts, null, 2)
    );
    console.log("=======================================\n");

    res.status(200).json({ data: unseenCounts });
  } catch (err) {
    console.error("Error in unseen-counts route:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get chat list with last messages and unseen counts
router.get("/chat-list", userAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Get all connections for the logged-in user
    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUserId, status: "accepted" },
        { toUserId: loggedInUserId, status: "accepted" },
      ],
    })
      .populate("fromUserId", "firstName lastName photoUrl")
      .populate("toUserId", "firstName lastName photoUrl");

    if (connectionRequests.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Extract connected users
    const connections = connectionRequests.map((request) => {
      if (request.fromUserId._id.toString() === loggedInUserId.toString()) {
        return request.toUserId;
      } else {
        return request.fromUserId;
      }
    });

    // Get chat data for each connection
    const chatListPromises = connections.map(async (connection) => {
      try {
        // Find chat between logged-in user and this connection
        const chat = await Chat.findOne({
          participants: { $all: [loggedInUserId, connection._id] },
        }).populate({
          path: "messages.senderId",
          select: "firstName lastName photoUrl",
        });

        let lastMessage = null;
        let unseenCount = 0;
        let lastMessageTime = connection.createdAt;

        if (chat && chat.messages.length > 0) {
          // Get the last message
          lastMessage = chat.messages[chat.messages.length - 1];
          lastMessageTime = lastMessage.createdAt;

          // Count unseen messages from this connection
          unseenCount = chat.messages.filter(
            (msg) =>
              msg.senderId._id.toString() !== loggedInUserId.toString() &&
              (!msg.seen || !msg.seen.get(loggedInUserId.toString()))
          ).length;
        }

        return {
          user: {
            _id: connection._id,
            firstName: connection.firstName,
            lastName: connection.lastName,
            photoUrl: connection.photoUrl,
          },
          lastMessage: lastMessage
            ? {
                _id: lastMessage._id,
                text: lastMessage.text,
                senderId: lastMessage.senderId._id,
                createdAt: lastMessage.createdAt,
              }
            : null,
          unseenCount,
          lastMessageTime,
        };
      } catch (error) {
        console.error(
          `Error processing chat for connection ${connection._id}:`,
          error
        );
        return {
          user: {
            _id: connection._id,
            firstName: connection.firstName,
            lastName: connection.lastName,
            photoUrl: connection.photoUrl,
          },
          lastMessage: null,
          unseenCount: 0,
          lastMessageTime: connection.createdAt,
        };
      }
    });

    const chatList = await Promise.all(chatListPromises);

    // Sort by last message time (most recent first)
    chatList.sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );

    res.status(200).json({ data: chatList });
  } catch (error) {
    console.error("Error fetching chat list:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Mark messages as seen
router.post("/mark-seen/:userId", userAuth, async (req, res) => {
  try {
    const { userId } = req.params; // The other user's ID
    const loggedInUserId = req.user._id;

    // Find the chat between these two users
    const chat = await Chat.findOne({
      participants: { $all: [loggedInUserId, userId] },
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Mark all messages from the other user as seen by the logged-in user
    let hasUpdates = false;
    chat.messages.forEach((message) => {
      // Only mark messages from the other user as seen
      if (message.senderId.toString() === userId.toString()) {
        if (!message.seen.get(loggedInUserId.toString())) {
          message.seen.set(loggedInUserId.toString(), true);
          hasUpdates = true;
        }
      }
    });

    if (hasUpdates) {
      await chat.save();
      console.log(
        `Marked messages as seen for user ${loggedInUserId} in chat with ${userId}`
      );
    }

    res.status(200).json({ message: "Messages marked as seen" });
  } catch (error) {
    console.error("Error marking messages as seen:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
