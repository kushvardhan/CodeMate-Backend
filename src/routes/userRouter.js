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
      ]);

    if (connectionRequests.length === 0) {
      return res.status(404).json({ message: "No connections found." });
    }

    const connections = connectionRequests.map((request) => request.fromUserId);

    res.status(200).json({
      message: "Connections fetched successfully.",
      data: connections,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
