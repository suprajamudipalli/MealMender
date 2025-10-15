const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  foodName: { type: String, required: true }, // Let's add a name for the donation
  quantity: { type: String, required: true },
  quality: { type: String, required: true },
  type: { type: String, required: true },
  expiry: { type: Date, required: true },
  pickupLocation: {
    address: String,
    lat: Number,
    lon: Number,
  },
  notes: { type: String },
  status: { type: String, default: 'available' }, // e.g., available, claimed, delivered, expired
  
  // Expiry tracking fields for food waste prevention
  expiryNotificationSent: { type: Boolean, default: false }, // Track if donor was notified about expiring food
  expiryWarningTime: { type: Date }, // When the expiry warning was sent
  markedAsExpired: { type: Boolean, default: false }, // Whether food has been marked as expired
  urgencyLevel: { type: String, enum: ['safe', 'warning', 'urgent', 'expired'], default: 'safe' }, // Current urgency level
}, {
  timestamps: true,
});

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;