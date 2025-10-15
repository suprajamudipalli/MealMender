const express = require("express");
const User = require("../models/user.js");
const { protect } = require("../middlewares/authMiddleware.js");

const router = express.Router();

// Get logged-in user's profile
router.get("/me", protect, async (req, res) => {
  try {
    console.log("Profile Route: Fetching profile for user:", req.user.username);
    console.log("Profile Route: User data:", req.user);
    res.json(req.user); // req.user comes from middleware
  } catch (err) {
    console.error("Profile Route: Error fetching profile:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update profile
router.put("/me", protect, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      req.body,
      { new: true }
    ).select("-password"); // hide password
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
