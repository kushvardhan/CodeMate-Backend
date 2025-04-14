const express = require("express");
const router = express.Router();
const {userAuth} = require("../middleware/auth"); 
const ConnectionRequest = require("../models/connectionRequest");

router.post('/send/:status/:toUserId',userAuth,async(req,res)=>{
    try{    
        const fromUserId = req.user._id;
        const toUserId = req.params.toUserId;
        const status = req.params.status;

        if(status !== "ignored" && status !== "interested"){
            res.status(500).json({ message: "Invalid status." });
        }

        const connectionRequest = new ConnectionRequest({
            fromUserId,
            toUserId,
            status
        });

        if(!connectionRequest){
            return res.status(400).json({ message: "Request not sent." });
        }

        const data = await connectionRequest.save();
        res.status(200).json({ message: "Request sent successfully.", data:data });

    }catch(err){
        res.status(500).json({ message: "Internal server error."+err.message });
    }
})


module.exports = router;