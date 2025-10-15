const Request = require("../models/request.js");

const requestFood = async (req, res) => {
  try {
    const request = new Request({
      receiver: req.user._id,  // logged-in user
      foodId: req.body.foodId
    });

    await request.save();
    res.json({ msg: "✅ Food request sent successfully", request });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const getRequests = async (req, res) => {
  try {
    const requests = await Request.find();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

module.exports = { requestFood, getRequests };
