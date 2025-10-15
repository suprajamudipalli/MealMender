const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const Donation = require('../models/donation');
const Request = require('../models/request');

// @route   POST /api/donations
// @desc    Create a new donation
// @access  Private
router.post('/', protect, async (req, res) => {
  const { foodName, quantity, quality, type, expiry, pickupLocation, notes } = req.body;

  try {
    const donation = new Donation({
      donor: req.user.id,
      foodName,
      quantity,
      quality,
      type,
      expiry,
      pickupLocation,
      notes,
    });

    const createdDonation = await donation.save();
    res.status(201).json(createdDonation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/donations
// @desc    Get all available donations
// @access  Public (or Private if only logged-in users can see)
router.get('/', async (req, res) => {
  const pageSize = 12; // Number of items per page
  const page = Number(req.query.pageNumber) || 1;

  try {
    const count = await Donation.countDocuments({ status: 'available' });
    // Find donations that are not yet claimed/delivered
    const donations = await Donation.find({ status: 'available' })
      .populate('donor', 'username firstName lastName') // Get donor's name
      .sort({ createdAt: -1 }) // Show newest first
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    // Update urgency levels dynamically before sending
    const now = new Date();
    donations.forEach(donation => {
      const hoursUntilExpiry = (new Date(donation.expiry) - now) / (1000 * 60 * 60);
      if (hoursUntilExpiry < 0) {
        donation.urgencyLevel = 'expired';
      } else if (hoursUntilExpiry <= 2) {
        donation.urgencyLevel = 'urgent';
      } else if (hoursUntilExpiry <= 5) {
        donation.urgencyLevel = 'warning';
      } else {
        donation.urgencyLevel = 'safe';
      }
    });

    // Sort by urgency: urgent first, then warning, then safe
    const urgencyOrder = { 'urgent': 0, 'warning': 1, 'safe': 2, 'expired': 3 };
    donations.sort((a, b) => urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel]);

    res.json({ donations, page, pages: Math.ceil(count / pageSize) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/donations/my-donations
// @desc    Get all donations made by the logged-in user
// @access  Private
router.get('/my-donations', protect, async (req, res) => {
  try {
    // Find all donations where the donor field matches the logged-in user's ID
    const donations = await Donation.find({ donor: req.user.id }).sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    console.error('Error fetching user donations:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/donations/:id
// @desc    Get a single donation by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).populate('donor', 'username firstName');

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    res.json(donation);
  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/donations/:id
// @desc    Update a donation
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Check if the user is the owner of the donation
    if (donation.donor.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Prevent editing if the donation is already claimed
    if (donation.status !== 'available') {
      return res.status(400).json({ message: `Cannot edit a donation that is already ${donation.status}` });
    }

    const updatedDonation = await Donation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedDonation);
  } catch (error) {
    console.error('Error updating donation:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/donations/:id
// @desc    Delete a donation
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Check if the user is the owner
    if (donation.donor.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Prevent deleting if the donation is already claimed or delivered
    if (donation.status !== 'available') {
      return res.status(400).json({ message: `Cannot delete a donation that is already ${donation.status}.` });
    }

    await Request.deleteMany({ donation: donation._id });
    await donation.deleteOne();
    res.json({ message: 'Donation removed successfully' });
  } catch (error) {
    console.error('Error deleting donation:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


module.exports = router;