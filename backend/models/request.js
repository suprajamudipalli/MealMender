const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema({
  donation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Donation",
    required: true,
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: { 
    type: String, 
    enum: ["Pending", "Approved", "Rejected", "Completed", "In Transit", "Delivered"], 
    default: "Pending" 
  },
  // Request details
  requestedQuantity: { type: String }, // How much food they want
  specialRequirements: { type: String }, // Dietary restrictions, preferences
  pickupTime: { type: Date }, // Preferred pickup time
  
  // Delivery details
  deliveryMethod: { 
    type: String, 
    enum: ["Pickup by Recipient", "Delivery by Donor", "Not Decided"], 
    default: "Not Decided" 
  },
  deliveryAddress: { type: String }, // If delivery
  recipientLocation: {
    type: { type: String, default: "Point" },
    coordinates: [Number] // [longitude, latitude]
  },
  
  // Tracking
  trackingStatus: {
    accepted: { type: Date },
    inTransit: { type: Date },
    delivered: { type: Date }
  },
  
  // Contact shared after approval
  contactShared: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Index for geospatial queries
RequestSchema.index({ recipientLocation: "2dsphere" });

module.exports = mongoose.model("Request", RequestSchema);
