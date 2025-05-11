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
      ])
      .populate("toUserId", [
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
      if (request.fromUserId._id.toString() === loggedInUser._id.toString()) {
        return request.toUserId;
      } else {
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

router.get("/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId toUserId");

    const hideUserFromFeed = new Set();
    connectionRequests.forEach((request) => {
      hideUserFromFeed.add(request.fromUserId.toString());
      hideUserFromFeed.add(request.toUserId.toString());
    });

    hideUserFromFeed.add(loggedInUser._id.toString());

    const users = await User.find({
      _id: { $nin: Array.from(hideUserFromFeed) },
    })
      .select([
        "firstName",
        "lastName",
        "photoUrl",
        "about",
        "skills",
        "age",
        "gender",
      ])
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments({
      _id: { $nin: Array.from(hideUserFromFeed) },
    });

    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      message: "Users fetched successfully.",
      data: users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route to fetch the authenticated user's details
router.get("/me", userAuth, async (req, res) => {
  try {
    const user = req.user; 
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const { password, ...userData } = user._doc;
    res.status(200).json({ user: userData });
  } catch (err) {
    console.error("Error fetching user details:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
