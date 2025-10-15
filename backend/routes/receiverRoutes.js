const express = require("express");
const { requestFood, getRequests } = require("../controllers/receiverController.js");
const { protect } = require("../middlewares/authMiddleware.js");

const router = express.Router();

// Receiver requests food (must be logged in)
router.post("/request", protect, requestFood);

// Get all requests (optional: could restrict to logged-in receiver only)
router.get("/", protect, getRequests);

module.exports = router;
