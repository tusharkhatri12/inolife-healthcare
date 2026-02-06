const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide doctor name'],
      trim: true,
    },
    specialization: {
      type: String,
      required: [true, 'Please provide specialization'],
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
    },
    registrationNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    // Clinic/Hospital details
    clinicName: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    // Area/Locality (optional, for MR-added doctors)
    area: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Please provide city'],
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    // Location coordinates for mapping
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    // Assigned MR
    assignedMR: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Doctor category/classification
    category: {
      type: String,
      enum: ['A', 'B', 'C'], // A = High priority, B = Medium, C = Low
      default: 'B',
    },
    // Visit frequency preference
    preferredVisitDay: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    preferredVisitTime: {
      type: String, // e.g., "10:00 AM - 12:00 PM"
      trim: true,
    },
    // Additional notes
    notes: {
      type: String,
      trim: true,
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    // MR-created doctors are unapproved until admin reviews
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for location-based queries
doctorSchema.index({ location: '2dsphere' });
doctorSchema.index({ assignedMR: 1 });
doctorSchema.index({ isApproved: 1 });
doctorSchema.index({ city: 1, state: 1 });
doctorSchema.index({ category: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
