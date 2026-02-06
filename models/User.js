const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    // Username used for login (mobile number in most cases)
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      // Optional for MRs – login is via username (mobile). sparse: allow multiple users with no email
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['Owner', 'Manager', 'MR'],
      required: [true, 'Please provide a role'],
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true, // Allow null values but enforce uniqueness when present
      trim: true,
    },
    // For MR role - assigned territory/area
    territory: {
      type: String,
      trim: true,
    },
    // For MR role - assigned manager
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Profile fields
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
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
    // Timestamps
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Indexes (username, email, employeeId already have unique: true so Mongoose creates those indexes)
userSchema.index({ role: 1 });
userSchema.index({ managerId: 1 });

module.exports = mongoose.model('User', userSchema);
