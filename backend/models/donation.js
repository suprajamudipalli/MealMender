const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  foodName: { type: String, required: true },
  quantity: { type: String, required: true }, // Original quantity (e.g., "40 servings")
  originalQuantity: { type: Number }, // Numeric value for calculations
  remainingQuantity: { type: Number }, // Track remaining servings
  quantityUnit: { type: String, default: 'servings' }, // Unit (servings, kg, pieces, etc.)
  quality: { type: String, required: true },
  type: { type: String, required: true },
  expiry: { type: Date, required: true },
  pickupLocation: {
    address: String,
    lat: Number,
    lon: Number,
  },
  notes: { type: String },
  status: { type: String, default: 'available' }, // available, partially_claimed, fully_claimed, expired
  
  // Expiry tracking fields for food waste prevention
  expiryNotificationSent: { type: Boolean, default: false },
  expiryWarningTime: { type: Date },
  markedAsExpired: { type: Boolean, default: false },
  urgencyLevel: { type: String, enum: ['safe', 'warning', 'urgent', 'expired'], default: 'safe' },
}, {
  timestamps: true,
});

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;