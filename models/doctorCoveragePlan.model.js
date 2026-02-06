const mongoose = require('mongoose');

const doctorCoveragePlanSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor is required'],
    },
    assignedMR: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned MR is required'],
    },
    // Stored as "YYYY-MM"
    month: {
      type: String,
      required: [true, 'Month is required'],
      trim: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format'],
    },
    plannedVisits: {
      type: Number,
      required: [true, 'Planned visits are required'],
      min: [0, 'Planned visits cannot be negative'],
    },
    actualVisits: {
      type: Number,
      default: 0,
      min: [0, 'Actual visits cannot be negative'],
    },
    compliancePercentage: {
      type: Number,
      min: [0, 'Compliance cannot be negative'],
      max: [100, 'Compliance cannot exceed 100'],
    },
    status: {
      type: String,
      enum: ['ON_TRACK', 'AT_RISK', 'MISSED'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helper to recalculate compliance and status
function recalculateFields(doc) {
  if (doc.plannedVisits && doc.plannedVisits > 0) {
    const compliance = (doc.actualVisits / doc.plannedVisits) * 100;
    doc.compliancePercentage = Number(compliance.toFixed(2));
  } else {
    doc.compliancePercentage = 0;
  }

  // >80% = ON_TRACK, 50–80% = AT_RISK, <50% = MISSED
  if (doc.compliancePercentage > 80) {
    doc.status = 'ON_TRACK';
  } else if (doc.compliancePercentage >= 50) {
    doc.status = 'AT_RISK';
  } else {
    doc.status = 'MISSED';
  }
}

doctorCoveragePlanSchema.pre('save', function (next) {
  recalculateFields(this);
  next();
});

doctorCoveragePlanSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() || {};

  // When using MongoDB update operators, the actual fields are usually under $set
  const fields = update.$set || update;

  // We can only reliably recalc if planned/actual are present in the update,
  // otherwise leave it as-is and let callers use save() when they change numbers.
  if (fields.plannedVisits !== undefined || fields.actualVisits !== undefined) {
    // Load the current document to compute based on latest values
    this.model
      .findOne(this.getQuery())
      .then((doc) => {
        if (!doc) return next();

        if (fields.plannedVisits !== undefined) {
          doc.plannedVisits = fields.plannedVisits;
        }
        if (fields.actualVisits !== undefined) {
          doc.actualVisits = fields.actualVisits;
        }

        recalculateFields(doc);

        // Push computed values back onto the update
        if (!update.$set) update.$set = {};
        update.$set.compliancePercentage = doc.compliancePercentage;
        update.$set.status = doc.status;

        this.setUpdate(update);
        next();
      })
      .catch((err) => next(err));
  } else {
    next();
  }
});

// One plan per doctor per month
doctorCoveragePlanSchema.index({ doctorId: 1, month: 1 }, { unique: true });

// Helpful indexes
doctorCoveragePlanSchema.index({ assignedMR: 1, month: 1 });
doctorCoveragePlanSchema.index({ status: 1, month: 1 });

module.exports = mongoose.model('DoctorCoveragePlan', doctorCoveragePlanSchema);

