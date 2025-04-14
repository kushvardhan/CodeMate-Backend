const express = require("express");
const router = express.Router();
const { userAuth } = require("../middleware/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const mongoose = require("mongoose");

router.get("/request/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", [
      "firstName",
      "lastName",
      "photoUrl",
      "skills",
      "about",
      "gender",
      "age",
    ]);

    if (connectionRequests.length === 0) {
      return res.status(404).json({ message: "No connection requests found." });
    }

    res.status(200).json({
      message: "Connection Requests fetched successfully.",
      data: connectionRequests,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/request/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUser._id, status: "accepted" },
        { toUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", [
        "firstName",
        "lastName",
        "photoUrl",
        "skills",
        "about",
        "gender",
        "age",
      ]).populate("toUserId", [
        "firstName",
        "lastName",
        "photoUrl",
        "skills",
        "about",
        "gender",
        "age",
      ]);

    if (connectionRequests.length === 0) {
      return res.status(404).json({ message: "No connections found." });
    }

    const connections = connectionRequests.map((request) => {
        if(request.fromUserId._id.toString() === loggedInUser._id.toString()){
            return request.toUserId;
        }else{
            return request.fromUserId;
        }
    });

    res.status(200).json({
      message: "Connections fetched successfully.",
      data: connections,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/feed",userAuth,async(req,res)=>{
    try{
        const loggedInUser = req.user;

        const connectionRequest = await ConnectionRequest.find({
            $or: [
                { fromUserId: loggedInUser._id},
                { toUserId: loggedInUser._id},
            ],
        }).select('fromUserId toUserId');

        const hideUserFromFeed = new Set();
        connectionRequest.forEach((req)=>{
            hideUserFromFeed.add(req.fromUserId.toString());
            hideUserFromFeed.add(req.toUserId.toString());
        })
        console.log(hideUserFromFeed);

        const user = await User.find({
           $and : [{_id: { $nin: Array.from(hideUserFromFeed) },},
                   { _id: { $ne: loggedInUser._id } }
        ],
        }).select('firstName lastName photoUrl skills about gender age');

        res.json(user);

    }catch(err){
        res.status(500).json({ message: err.message });
    }
})

module.exports = router;
