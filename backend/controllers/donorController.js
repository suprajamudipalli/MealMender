const Donation = require("../models/donation.js");

const createDonation = async (req, res) => {
  try {
    const donation = new Donation({
      donor: req.user._id, // logged-in user from middleware
      foodName: req.body.foodName,
      quantity: req.body.quantity,
      quality: req.body.quality,
      location: req.body.location
    });

    await donation.save();
    res.json({ msg: "✅ Donation added successfully", donation });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const getDonations = async (req, res) => {
  try {
    const donations = await Donation.find();
    res.json(donations);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

module.exports = { createDonation, getDonations };
