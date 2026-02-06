const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    // MR who made the visit
    mrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide MR ID'],
    },
    // Doctor visited
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Please provide Doctor ID'],
    },
    // Visit date and time
    visitDate: {
      type: Date,
      required: [true, 'Please provide visit date'],
      default: Date.now,
    },
    // Visit time (actual time of visit)
    visitTime: {
      type: Date,
      default: Date.now,
    },
    // Visit purpose
    purpose: {
      type: String,
      enum: ['Product Presentation', 'Sample Distribution', 'Follow-up', 'Order Collection', 'Relationship Building', 'Other'],
      default: 'Product Presentation',
    },
    // Products discussed/presented
    productsDiscussed: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        quantity: {
          type: Number,
          default: 0,
        },
        notes: {
          type: String,
          trim: true,
        },
      },
    ],
    // Samples given
    samplesGiven: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        quantity: {
          type: Number,
          default: 0,
        },
      },
    ],
    // Orders collected (if any)
    orders: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1'],
        },
        unitPrice: {
          type: Number,
          min: [0, 'Unit price cannot be negative'],
        },
      },
    ],
    // Visit notes/remarks
    notes: {
      type: String,
      trim: true,
    },
    // Doctor's feedback
    doctorFeedback: {
      type: String,
      trim: true,
    },
    // Next follow-up date
    nextFollowUpDate: {
      type: Date,
    },
    // Visit status (high-level: Completed, Cancelled, Rescheduled)
    status: {
      type: String,
      enum: ['Completed', 'Cancelled', 'Rescheduled'],
      default: 'Completed',
    },
    // Outcome of the visit attempt: MET_DOCTOR = successful meeting; others = attempted but not met
    visitOutcome: {
      type: String,
      enum: ['MET_DOCTOR', 'DOCTOR_NOT_AVAILABLE', 'DOCTOR_DID_NOT_MEET', 'CLINIC_CLOSED', 'OTHER'],
      default: 'MET_DOCTOR',
    },
    // Required when visitOutcome !== MET_DOCTOR
    notMetReason: {
      type: String,
      trim: true,
    },
    // Optional remarks when not met (or any visit)
    attemptRemarks: {
      type: String,
      trim: true,
    },
    // Visit duration (in minutes)
    duration: {
      type: Number,
      min: [0, 'Duration cannot be negative'],
    },
    // Location where visit was made
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
    // Check-in/Check-out times
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
visitSchema.index({ mrId: 1, visitDate: -1 });
visitSchema.index({ doctorId: 1, visitDate: -1 });
visitSchema.index({ visitDate: -1 });
visitSchema.index({ location: '2dsphere' });
visitSchema.index({ status: 1 });
visitSchema.index({ visitOutcome: 1 });

module.exports = mongoose.model('Visit', visitSchema);
