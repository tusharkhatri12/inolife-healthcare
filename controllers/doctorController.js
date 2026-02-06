const Doctor = require('../models/Doctor');

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Private
exports.getDoctors = async (req, res, next) => {
  try {
    const { assignedMR, city, state, category, isActive, isApproved } = req.query;
    const query = {};

    // MRs can only see their assigned doctors
    if (req.user.role === 'MR') {
      query.assignedMR = req.user.id;
    } else if (assignedMR) {
      query.assignedMR = assignedMR;
    }

    // Filter by city
    if (city) {
      query.city = new RegExp(city, 'i');
    }

    // Filter by state
    if (state) {
      query.state = new RegExp(state, 'i');
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Filter by approval (Owner/Manager only - for Pending Approvals list)
    if (isApproved !== undefined && (req.user.role === 'Owner' || req.user.role === 'Manager')) {
      query.isApproved = isApproved === 'true';
    }

    const doctors = await Doctor.find(query).populate('assignedMR', 'name email phone employeeId');

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: {
        doctors,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Private
exports.getDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('assignedMR', 'name email phone employeeId');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // MRs can only see their assigned doctors
    if (req.user.role === 'MR' && doctor.assignedMR?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this doctor',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        doctor,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create doctor
// @route   POST /api/doctors
// @access  Private (Owner, Manager, MR)
exports.createDoctor = async (req, res, next) => {
  try {
    if (req.user.role === 'MR') {
      // MR can add doctor from Visit page only: minimal fields, unapproved
      const { name, specialization, clinicName, area, city, phone } = req.body;
      if (!name || !specialization) {
        return res.status(400).json({
          success: false,
          message: 'Doctor name and specialization are required',
        });
      }
      const doctor = await Doctor.create({
        name: name.trim(),
        specialization: specialization.trim(),
        clinicName: clinicName ? clinicName.trim() : '',
        area: area ? area.trim() : '',
        city: (city || '').trim() || 'To be updated',
        phone: phone ? phone.trim() : '',
        address: req.body.address ? req.body.address.trim() : 'To be updated',
        state: req.body.state ? req.body.state.trim() : '',
        pincode: req.body.pincode ? req.body.pincode.trim() : '',
        assignedMR: req.user.id,
        isApproved: false,
        isActive: true,
      });
      const populated = await Doctor.findById(doctor._id).populate('assignedMR', 'name email employeeId');
      return res.status(201).json({
        success: true,
        data: { doctor: populated },
      });
    }

    // Owner/Manager: full create
    const doctor = await Doctor.create(req.body);

    res.status(201).json({
      success: true,
      data: {
        doctor,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor
// @route   PUT /api/doctors/:id
// @access  Private
exports.updateDoctor = async (req, res, next) => {
  try {
    let doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // MRs can only update their assigned doctors (limited fields)
    if (req.user.role === 'MR') {
      if (doctor.assignedMR?.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this doctor',
        });
      }
      // MRs can't change assignedMR
      delete req.body.assignedMR;
    }

    doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('assignedMR', 'name email phone employeeId');

    res.status(200).json({
      success: true,
      data: {
        doctor,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete doctor
// @route   DELETE /api/doctors/:id
// @access  Private (Owner, Manager)
exports.deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // Only Owner and Manager can delete
    if (req.user.role === 'MR') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete doctors',
      });
    }

    // Soft delete
    doctor.isActive = false;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Doctor deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};
