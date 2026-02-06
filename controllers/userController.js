const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Owner, Manager)
exports.getUsers = async (req, res, next) => {
  try {
    const { role, managerId, isActive } = req.query;
    const query = {};

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by manager (for MRs)
    if (managerId) {
      query.managerId = managerId;
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // MRs can only see themselves
    if (req.user.role === 'MR') {
      query._id = req.user.id;
    }

    // Managers can see themselves and their MRs
    if (req.user.role === 'Manager') {
      query.$or = [
        { _id: req.user.id },
        { managerId: req.user.id },
      ];
    }

    const users = await User.find(query).select('-password').populate('managerId', 'name email phone');

    res.status(200).json({
      success: true,
      count: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('managerId', 'name email phone');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // MRs can only see themselves
    if (req.user.role === 'MR' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource',
      });
    }

    // Managers can see themselves and their MRs
    if (req.user.role === 'Manager' && req.user.id !== req.params.id && user.managerId?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // MRs can only update themselves (limited fields)
    if (req.user.role === 'MR' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user',
      });
    }

    // Managers can update themselves and their MRs
    if (req.user.role === 'Manager' && req.user.id !== req.params.id) {
      if (user.managerId?.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this user',
        });
      }
      // Managers can't change role or managerId of MRs
      delete req.body.role;
      delete req.body.managerId;
    }

    // Only Owner can change role
    if (req.user.role !== 'Owner' && req.body.role) {
      delete req.body.role;
    }

    // Don't allow password update through this route
    delete req.body.password;

    user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Owner, Manager)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Only Owner and Manager can delete
    if (req.user.role === 'MR') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete users',
      });
    }

    // Managers can only delete their MRs
    if (req.user.role === 'Manager' && user.managerId?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this user',
      });
    }

    // Soft delete - set isActive to false
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ===== MR Management (Owner/Manager only) =====

// @desc    Create MR user
// @route   POST /api/users/mr
// @access  Private (Owner, Manager)
exports.createMR = async (req, res, next) => {
  try {
    const { name, username, territory, password } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, username, and password are required',
      });
    }

    // Ensure username is unique
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An MR already exists with this username',
      });
    }

    const payload = {
      name: name.trim(),
      username: username.trim(),
      phone: username.trim(),
      territory: territory ? territory.trim() : '',
      password,
      role: 'MR',
      isActive: true,
    };

    // Managers can only assign MRs to themselves
    if (req.user.role === 'Manager') {
      payload.managerId = req.user.id;
    } else if (req.body.managerId) {
      payload.managerId = req.body.managerId;
    }

    const mr = await User.create(payload);

    const safeMr = await User.findById(mr._id).select('-password');

    res.status(201).json({
      success: true,
      data: {
        mr: safeMr,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List all MRs
// @route   GET /api/users/mr
// @access  Private (Owner, Manager)
exports.listMRs = async (req, res, next) => {
  try {
    const query = { role: 'MR' };

    if (req.user.role === 'Manager') {
      query.managerId = req.user.id;
    }

    const mrs = await User.find(query)
      .select('name username territory isActive managerId')
      .populate('managerId', 'name');

    res.status(200).json({
      success: true,
      count: mrs.length,
      data: {
        mrs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate MR (soft delete)
// @route   PATCH /api/users/mr/:id/deactivate
// @access  Private (Owner, Manager)
exports.deactivateMR = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role !== 'MR') {
      return res.status(404).json({
        success: false,
        message: 'MR not found',
      });
    }

    // Managers can only manage their own MRs
    if (req.user.role === 'Manager' && user.managerId?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to deactivate this MR',
      });
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'MR deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset MR password
// @route   POST /api/users/mr/:id/reset-password
// @access  Private (Owner, Manager)
exports.resetMRPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.params.id).select('+password');

    if (!user || user.role !== 'MR') {
      return res.status(404).json({
        success: false,
        message: 'MR not found',
      });
    }

    // Managers can only manage their own MRs
    if (req.user.role === 'Manager' && user.managerId?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reset password for this MR',
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};
