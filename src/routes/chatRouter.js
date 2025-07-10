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
    // Step 1: Find chats where user is a participant
    const chats = await Chat.find({ participants: userId })
      .populate("participants", "firstName lastName photoUrl") // For other user info
      .populate("messages.senderId", "firstName lastName photoUrl"); // For sender info inside each message

    const unseenCounts = chats.map(chat => {
      const otherUser = chat.participants.find(p => p._id.toString() !== userId);

      // Step 2: Filter only unseen messages not sent by the current user
      const unseenMessages = chat.messages.filter(msg =>
        msg.senderId._id.toString() !== userId &&
        (!msg.seen || msg.seen.get(userId) === false)
      );

      return {
        chatId: chat._id,
        userId: otherUser._id,
        userInfo: {
          name: `${otherUser.firstName} ${otherUser.lastName || ""}`.trim(),
          photoUrl: otherUser.photoUrl || "",
        },
        unseenCount: unseenMessages.length,
        unseenMessages: unseenMessages.map(msg => ({
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
    });

    res.json({ data: unseenCounts });
  } catch (error) {
    console.error("Error fetching unseen messages:", error);
    res.status(500).json({ message: "Server error while fetching unseen counts" });
  }
});


module.exports = router;