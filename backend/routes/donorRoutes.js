const express = require("express");
const { createDonation, getDonations } = require("../controllers/donorController.js");
const { protect } = require("../middlewares/authMiddleware.js");

const router = express.Router();

router.post("/create", protect, createDonation); // only logged in users can donate
router.get("/", getDonations);

module.exports = router;
