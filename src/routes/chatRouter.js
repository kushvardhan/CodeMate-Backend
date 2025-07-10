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

// GET /chat/unseen-counts/:userId
router.get("/unseen-counts/:userId", async (req, res) => {
  const { userId } = req.params;

  const chats = await Chat.find({ participants: userId });

  const unseenCounts = chats.map(chat => {
    const otherUser = chat.participants.find(id => id.toString() !== userId);

    const unseen = chat.messages.filter(msg =>
      msg.senderId.toString() !== userId &&
      (!msg.seen || msg.seen.get(userId) === false)
    );
    console.log("unseen: ", unseen);
    return {
      chatId: chat._id,
      userId: otherUser,
      unseenCount: unseen.length
    };
  });

  res.json({ data: unseenCounts });
});



module.exports = router;