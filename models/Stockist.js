const mongoose = require('mongoose');

const stockistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide stockist name'],
      trim: true,
    },
    area: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
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

stockistSchema.index({ isActive: 1 });
stockistSchema.index({ city: 1 });
stockistSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Stockist', stockistSchema);
