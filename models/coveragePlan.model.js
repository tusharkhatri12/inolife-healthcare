const mongoose = require('mongoose');

const coveragePlanSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor is required'],
    },
    mrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'MR is required'],
    },
    month: {
      type: Number,
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
      required: [true, 'Month is required'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    monthlyTarget: {
      type: Number,
      min: [1, 'Monthly target must be at least 1'],
      required: [true, 'Monthly target is required'],
    },
    status: {
      type: String,
      enum: ['Active', 'Paused'],
      default: 'Active',
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

coveragePlanSchema.index({ doctorId: 1, mrId: 1, month: 1, year: 1 }, { unique: true });
coveragePlanSchema.index({ mrId: 1, month: 1, year: 1 });
coveragePlanSchema.index({ doctorId: 1, month: 1, year: 1 });

module.exports = mongoose.model('CoveragePlan', coveragePlanSchema);
