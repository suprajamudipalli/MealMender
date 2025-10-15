const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  lat: { type: Number },
  lon: { type: Number },
}, { _id: false });

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  foodName: {
    type: String,
    required: [true, 'Please provide a name for the food item.'],
  },
  quantity: {
    type: String,
    required: [true, 'Please specify the quantity (e.g., "10 meals", "5 kg").'],
  },
  quality: {
    type: String,
    enum: ['Fresh', 'Good', 'Near Expiry'],
    required: true,
  },
  type: {
    type: String,
    enum: ['Veg', 'Non-Veg', 'Both'],
    required: true,
  },
  expiry: {
    type: Date,
    required: [true, 'Please provide an expiry or best-before date.'],
  },
  pickupLocation: locationSchema,
  notes: {
    type: String,
  },
  status: {
    type: String,
    enum: ['available', 'claimed', 'delivered'],
    default: 'available',
  },
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);