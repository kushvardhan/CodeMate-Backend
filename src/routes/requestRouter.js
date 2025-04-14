const express = require("express");
const router = express.Router();
const { userAuth } = require("../middleware/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const mongoose = require("mongoose");

router.post("/send/:status/:toUserId", userAuth, async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const toUserId = req.params.toUserId;
    const status = req.params.status;

    if (!mongoose.Types.ObjectId.isValid(toUserId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    const allowedStatus = ["ignored", "interested"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Only 'ignored' and 'interested' are allowed.",
      });
    }

    const toUser = await User.findById(toUserId);
    if (!toUser) return res.status(404).json({ message: "User not found." });

    const existingConnectionRequest = await ConnectionRequest.findOne({
      $or: [
        {
          fromUserId,
          toUserId,
        },
        {
          fromUserId: toUserId,
          toUserId: fromUserId,
        },
      ],
    });
    if (existingConnectionRequest) {
      return res.status(400).json({ message: "Request already sent." });
    }

    const connectionRequest = new ConnectionRequest({
      fromUserId,
      toUserId,
      status,
    });

    if (!connectionRequest) {
      return res.status(400).json({ message: "Request not sent." });
    }

    const data = await connectionRequest.save();
    res.status(200).json({
      message: req.user.firstName + " " + status + " " + toUser.firstName,
      data: data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/review/:status/:requestId", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const requestId = req.params.requestId;
    const status = req.params.status;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID format." });
    }

    const allowedStatus = ["accepted", "rejected"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Only accepted and rejected are allowed.",
      });
    }

    const connectionRequest = await ConnectionRequest.findOne({
      _id: requestId,
      toUserId: loggedInUser._id,
      status: "interested",
    });
    if (!connectionRequest) {
      return res
        .status(404)
        .json({
          message:
            "Connection Request not found.",
        });
    }

    connectionRequest.status = status;
    const data = await connectionRequest.save();
    res
      .status(200)
      .json({ message: "Connection Request " + status, data: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
