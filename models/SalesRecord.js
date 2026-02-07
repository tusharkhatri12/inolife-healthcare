const mongoose = require('mongoose');

const salesRecordSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Please provide sales date'],
    },
    // YYYY-MM; mandatory for admin entries; MR entries auto-derived from date
    saleMonth: {
      type: String,
      trim: true,
    },
    // PRIMARY = Company → Stockist; SECONDARY = Stockist → Market (MR stockist sales)
    saleType: {
      type: String,
      enum: ['PRIMARY', 'SECONDARY'],
      default: 'SECONDARY',
    },
    mrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    stockistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stockist',
      required: [true, 'Please provide stockist'],
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [0, 'Quantity cannot be negative'],
        },
        free: {
          type: Number,
          default: 0,
          min: [0, 'Free cannot be negative'],
        },
        value: {
          type: Number,
          required: true,
          min: [0, 'Value cannot be negative'],
        },
      },
    ],
    totalValue: {
      type: Number,
      required: true,
      min: [0, 'Total value cannot be negative'],
    },
    source: {
      type: String,
      enum: ['MR_ENTRY', 'ADMIN_ENTRY'],
      required: true,
    },
    // Who created: ADMIN (dashboard) or MR (app)
    createdBy: {
      type: String,
      enum: ['ADMIN', 'MR'],
      default: 'MR',
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

salesRecordSchema.index({ date: -1 });
salesRecordSchema.index({ saleMonth: 1 });
salesRecordSchema.index({ saleType: 1, saleMonth: 1 });
salesRecordSchema.index({ mrId: 1, date: -1 });
salesRecordSchema.index({ doctorId: 1, date: -1 });
salesRecordSchema.index({ stockistId: 1, date: -1 });

module.exports = mongoose.model('SalesRecord', salesRecordSchema);
