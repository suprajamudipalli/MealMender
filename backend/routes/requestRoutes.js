const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const Request = require('../models/request');
const Donation = require('../models/donation');

// @route   POST /api/requests/claim/:donationId
// @desc    Create a request to claim a donation
// @access  Private
router.post('/claim/:donationId', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.donationId);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found.' });
    }

    if (donation.status !== 'available') {
      return res.status(400).json({ message: 'This donation is no longer available.' });
    }

    // Prevent donor from claiming their own donation
    if (donation.donor.toString() === req.user.id.toString()) {
      return res.status(400).json({ message: 'You cannot claim your own donation.' });
    }

    // Check if user has already requested this donation
    const existingRequest = await Request.findOne({ donation: donation._id, recipient: req.user.id });
    if (existingRequest) {
      return res.status(400).json({ message: 'You have already requested this donation.' });
    }

    const newRequest = new Request({
      donation: donation._id,
      recipient: req.user.id,
      donor: donation.donor,
      requestedQuantity: req.body.requestedQuantity,
      specialRequirements: req.body.specialRequirements,
      pickupTime: req.body.pickupTime,
      deliveryMethod: req.body.deliveryMethod || 'Not Decided',
      deliveryAddress: req.body.deliveryAddress,
      recipientLocation: req.body.recipientLocation,
    });

    await newRequest.save();
    res.status(201).json({ message: 'Request sent successfully!', request: newRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/requests/my-requests
// @desc    Get all requests made by the logged-in recipient
// @access  Private
router.get('/my-requests', protect, async (req, res) => {
  try {
    const requests = await Request.find({ recipient: req.user.id })
      .populate({
        path: 'donation',
        select: 'foodName quantity',
      })
      .populate({
        path: 'donor',
        select: 'username firstName',
      })
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching recipient requests:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/requests/for-me
// @desc    Get all requests for the logged-in donor's items
// @access  Private
router.get('/for-me', protect, async (req, res) => {
  try {
    const requests = await Request.find({ donor: req.user.id })
      .populate({
        path: 'donation',
        select: 'foodName',
      })
      .populate({
        path: 'recipient',
        select: 'username firstName',
      })
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching donor requests:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/requests/:id
// @desc    Get a single request by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('donation', 'foodName quantity pickupLocation')
      .populate('donor', 'firstName lastName email phone')
      .populate('recipient', 'firstName lastName email phone');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify user is part of this request
    const isParticipant = 
      request.donor._id.toString() === req.user.id.toString() ||
      request.recipient._id.toString() === req.user.id.toString();

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to view this request' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/requests/:id/status
// @desc    Update the status of a request (Approve/Reject/In Transit/Delivered)
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  const { status } = req.body;

  if (!['Approved', 'Rejected', 'Completed', 'In Transit', 'Delivered'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    // Security check: Ensure the user is part of this request
    const isDonor = request.donor.toString() === req.user.id.toString();
    const isRecipient = request.recipient.toString() === req.user.id.toString();

    if (!isDonor && !isRecipient) {
      return res.status(403).json({ message: 'User not authorized to update this request.' });
    }

    // Only donor can approve/reject
    if ((status === 'Approved' || status === 'Rejected') && !isDonor) {
      return res.status(403).json({ message: 'Only donor can approve or reject requests.' });
    }

    // If approved, mark the original donation as 'claimed' and reject other pending requests.
    if (status === 'Approved') {
      const donation = await Donation.findById(request.donation);
      if (!donation || donation.status !== 'available') {
        return res.status(400).json({ message: 'This donation is no longer available and cannot be approved.' });
      }
      
      await Donation.findByIdAndUpdate(request.donation, { status: 'claimed' });

      // Reject all other pending requests for this same donation
      await Request.updateMany(
        { donation: request.donation, status: 'Pending', _id: { $ne: request._id } },
        { status: 'Rejected' }
      );

      // Set tracking timestamp
      request.trackingStatus = { accepted: new Date() };
      request.contactShared = true;
    }

    // Update tracking status
    if (status === 'In Transit') {
      if (!request.trackingStatus) request.trackingStatus = {};
      request.trackingStatus.inTransit = new Date();
    }

    if (status === 'Delivered') {
      if (!request.trackingStatus) request.trackingStatus = {};
      request.trackingStatus.delivered = new Date();
      // Mark donation as delivered
      await Donation.findByIdAndUpdate(request.donation, { status: 'delivered' });
    }

    // If completed, mark the original donation as 'delivered'
    if (status === 'Completed') {
      await Donation.findByIdAndUpdate(request.donation, { status: 'delivered' });
    }

    request.status = status;
    await request.save();

    res.json(request);
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
});

module.exports = router;