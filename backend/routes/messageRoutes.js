const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const Message = require('../models/message');
const Request = require('../models/request');

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { requestId, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Verify user is part of this request
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const isParticipant = 
      request.donor.toString() === req.user.id.toString() ||
      request.recipient.toString() === req.user.id.toString();

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to send messages in this chat' });
    }

    const message = new Message({
      requestId: requestId,
      sender: req.user.id,
      content: content.trim()
    });

    await message.save();
    
    // Populate sender info
    await message.populate('sender', 'firstName lastName');

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/messages/:requestId
// @desc    Get all messages for a request
// @access  Private
router.get('/:requestId', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify user is part of this request
    const isParticipant = 
      request.donor.toString() === req.user.id.toString() ||
      request.recipient.toString() === req.user.id.toString();

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }

    const messages = await Message.find({ requestId: req.params.requestId })
      .populate('sender', 'firstName lastName')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
