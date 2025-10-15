const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const User = require('../models/user');
const Donation = require('../models/donation');
const Request = require('../models/request');

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    const totalDonations = await Donation.countDocuments();
    const donationsByStatus = await Donation.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      users: { total: totalUsers, newThisMonth: newUsersThisMonth },
      donations: { total: totalDonations, byStatus: donationsByStatus },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
  const pageSize = 10; // Number of items per page
  const page = Number(req.query.pageNumber) || 1;

  try {
    const count = await User.countDocuments({});
    const users = await User.find({})
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .select('-password');

    res.json({ users, page, pages: Math.ceil(count / pageSize) });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/admin/donations
// @desc    Get all donations
// @access  Private/Admin
router.get('/donations', protect, admin, async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  try {
    const count = await Donation.countDocuments({});
    const donations = await Donation.find({})
      .populate('donor', 'username')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));
      
    res.json({ donations, page, pages: Math.ceil(count / pageSize) });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private/Admin
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Optional: Add logic to handle user's donations/requests before deleting.
    // For now, we will just delete the user.

    await user.deleteOne();
    res.json({ message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/admin/donations/:id
// @desc    Delete a donation
// @access  Private/Admin
router.delete('/donations/:id', protect, admin, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Also delete any requests associated with this donation
    await Request.deleteMany({ donation: donation._id });

    await donation.deleteOne();

    res.json({ message: 'Donation and associated requests removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update a user's role
// @access  Private/Admin
router.put('/users/:id/role', protect, admin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified. Must be "admin" or "user".' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent an admin from demoting themselves if they are the last one
    if (user.role === 'admin' && role === 'user' && req.user.id.toString() === user._id.toString()) {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot demote the last admin.' });
      }
    }

    user.role = role;
    await user.save();
    res.json({ message: 'User role updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;