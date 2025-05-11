const express = require("express");
const router = express.Router(); 
const { userAuth } = require("../middleware/auth");
const User = require("../models/user");
const Chat = require('../models/chat');

router.get('/getChat/:userId',userAuth,async(req,res)=>{
    try{
        const {userId} = req.params;
        const loggedUser = req.user._id;

        if( !loggedUser || !userId){
            return res.status(400).json({ message: "Missing required user IDs" });
        }

        const chat = await Chat.findOne({
            participants: { $all: [loggedUser, userId] },
          }).populate({
            path: 'messages.senderId',
            select: 'firstName lastName photoUrl',
          }) ;

          if (!chat) {
            chat = new Chat({
              participants: [loggedUser, userId],
              messages: [],
            }).populate({
            path: 'messages.senderId',
            select: 'firstName lastName photoUrl',
          }) ;

            await chat.save();
          }

          res.status(200).json(chat.messages);

    }catch(err){
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;