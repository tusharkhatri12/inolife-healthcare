const mongoose = require('mongoose');

const beatPlanSchema = new mongoose.Schema(
  {
    mrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'MR is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    plannedDoctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
      },
    ],
    deviationReason: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure at least one planned doctor
beatPlanSchema.pre('validate', function (next) {
  if (!this.plannedDoctors || this.plannedDoctors.length === 0) {
    this.invalidate('plannedDoctors', 'At least one doctor must be planned');
  }
  next();
});

// Unique index: one plan per MR per day
beatPlanSchema.index({ mrId: 1, date: 1 }, { unique: true });

// Indexes for efficient queries
beatPlanSchema.index({ mrId: 1, date: -1 });
beatPlanSchema.index({ date: -1 });

module.exports = mongoose.model('BeatPlan', beatPlanSchema);
