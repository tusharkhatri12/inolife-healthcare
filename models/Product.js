const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide product name'],
      trim: true,
    },
    code: {
      type: String,
      unique: true,
      required: [true, 'Please provide product code'],
      trim: true,
      uppercase: true,
    },
    // Product category
    category: {
      type: String,
      trim: true,
    },
    // Product type
    type: {
      type: String,
      enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Other'],
      default: 'Tablet',
    },
    // Packaging details
    packSize: {
      type: String,
      trim: true, // e.g., "10x10", "1x1", "100ml"
    },
    // Pricing
    mrp: {
      type: Number,
      required: [true, 'Please provide MRP'],
      min: [0, 'MRP cannot be negative'],
    },
    // Stock keeping unit
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    // HSN code for GST
    hsnCode: {
      type: String,
      trim: true,
    },
    // Product description
    description: {
      type: String,
      trim: true,
    },
    // Composition/Ingredients
    composition: {
      type: String,
      trim: true,
    },
    // Manufacturer
    manufacturer: {
      type: String,
      default: 'INOLIFE HEALTHCARE',
      trim: true,
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
productSchema.index({ code: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
