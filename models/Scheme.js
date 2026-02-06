const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema(
  {
    stockistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stockist',
      required: [true, 'Please provide stockist'],
    },
    schemeType: {
      type: String,
      enum: ['Discount', 'FreeQty', 'Credit', 'Other'],
      required: [true, 'Please provide scheme type'],
    },
    description: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide start date'],
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
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

schemeSchema.index({ stockistId: 1 });
schemeSchema.index({ startDate: 1, endDate: 1 });
schemeSchema.index({ isActive: 1 });

module.exports = mongoose.model('Scheme', schemeSchema);
