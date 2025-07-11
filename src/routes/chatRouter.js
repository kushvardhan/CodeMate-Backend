const express = require("express");
const router = express.Router(); 
const { userAuth } = require("../middleware/auth");
const User = require("../models/user");
const Chat = require('../models/chat');

router.get('/getChat/:userId', userAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const loggedUser = req.user._id;

        if (!loggedUser || !userId) {
            return res.status(400).json({ message: "Missing required user IDs" });
        }

        let chat = await Chat.findOne({
            participants: { $all: [loggedUser, userId] },
        }).populate({
            path: 'messages.senderId',
            select: 'firstName lastName photoUrl',
        });

        if (!chat) {
            chat = new Chat({
                participants: [loggedUser, userId],
                messages: [],
            });

            await chat.save();

            // Re-fetch the chat to populate messages.senderId
            chat = await Chat.findById(chat._id).populate({
                path: 'messages.senderId',
                select: 'firstName lastName photoUrl',
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

    const unseenCounts = chats.map(chat => {
      const otherUser = chat.participants.find(p => p._id.toString() !== userId);

      const unseenMessages = chat.messages.filter(msg =>
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
        allMessages: chat.messages.map(m => ({
          _id: m._id,
          text: m.text,
          senderId: m.senderId._id,
          seen: m.seen,
          createdAt: m.createdAt
        })),
        unseenCount: unseenMessages.length,
        unseenMessages: unseenMessages.map(msg => ({
          _id: msg._id,
          text: msg.text,
          createdAt: msg.createdAt,
          sender: {
            _id: msg.senderId._id,
            name: `${msg.senderId.firstName} ${msg.senderId.lastName || ""}`,
            photoUrl: msg.senderId.photoUrl || "",
          }
        })),
      };

      allData.push(data);

      return {
        chatId: data.chatId,
        userId: data.userId,
        userInfo: data.userInfo,
        unseenCount: data.unseenCount,
        unseenMessages: data.unseenMessages
      };
    }).filter(chat => chat.unseenCount > 0);

    console.log("\n============== DEBUG LOG ==============");
    console.log("UserID:", userId);
    console.log("All Chat Data with All Messages:\n", JSON.stringify(allData, null, 2));
    console.log("Final Filtered unseenCounts:\n", JSON.stringify(unseenCounts, null, 2));
    console.log("=======================================\n");

    res.status(200).json({ data: unseenCounts });
  } catch (err) {
    console.error("Error in unseen-counts route:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


module.exports = router;