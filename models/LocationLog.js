const mongoose = require('mongoose');

const locationLogSchema = new mongoose.Schema(
  {
    // MR whose location is being tracked
    mrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide MR ID'],
    },
    // Location coordinates
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Please provide coordinates'],
      },
    },
    // Address (reverse geocoded)
    address: {
      type: String,
      trim: true,
    },
    // City
    city: {
      type: String,
      trim: true,
    },
    // State
    state: {
      type: String,
      trim: true,
    },
    // Pincode
    pincode: {
      type: String,
      trim: true,
    },
    // Accuracy of GPS reading (in meters)
    accuracy: {
      type: Number,
      min: [0, 'Accuracy cannot be negative'],
    },
    // Speed (in m/s)
    speed: {
      type: Number,
      min: [0, 'Speed cannot be negative'],
    },
    // Heading/direction (in degrees, 0-360)
    heading: {
      type: Number,
      min: [0, 'Heading must be between 0 and 360'],
      max: [360, 'Heading must be between 0 and 360'],
    },
    // Altitude (in meters)
    altitude: {
      type: Number,
    },
    // Battery level of device (0-100)
    batteryLevel: {
      type: Number,
      min: [0, 'Battery level must be between 0 and 100'],
      max: [100, 'Battery level must be between 0 and 100'],
    },
    // Device information
    deviceInfo: {
      platform: {
        type: String, // 'Android', 'iOS', 'Web'
        trim: true,
      },
      model: {
        type: String,
        trim: true,
      },
      osVersion: {
        type: String,
        trim: true,
      },
    },
    // Timestamp when location was captured
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    // Activity type (if available from device)
    activity: {
      type: String,
      enum: ['still', 'walking', 'running', 'on_foot', 'on_bicycle', 'in_vehicle', 'unknown'],
      default: 'unknown',
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for location queries
locationLogSchema.index({ location: '2dsphere' });
locationLogSchema.index({ mrId: 1, timestamp: -1 });
locationLogSchema.index({ timestamp: -1 });

// Compound index for efficient MR location history queries
locationLogSchema.index({ mrId: 1, createdAt: -1 });

module.exports = mongoose.model('LocationLog', locationLogSchema);
