const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (Owner can register, others need Owner approval)
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, employeeId, territory, managerId, username: bodyUsername } = req.body;

    // Owner/Manager often register with email only; use email as username for login if username not provided
    const username = bodyUsername && bodyUsername.trim() ? bodyUsername.trim() : (email && email.trim() ? email.trim().toLowerCase() : null);

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Email or username is required',
      });
    }

    // Check if user exists (by email or username)
    const orClauses = [{ username }];
    if (email && String(email).trim()) orClauses.push({ email: String(email).trim().toLowerCase() });
    const userExists = await User.findOne({ $or: orClauses });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username',
      });
    }

    // Build create payload: username required; email and phone required by schema (use email/username as fallback)
    const createPayload = {
      name,
      username,
      password,
      role,
      phone: (phone != null && String(phone).trim()) ? String(phone).trim() : username,
      employeeId,
      territory,
      managerId: managerId || undefined,
    };
    if (email && String(email).trim()) createPayload.email = String(email).trim().toLowerCase();

    const user = await User.create(createPayload);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          employeeId: user.employeeId,
          territory: user.territory,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const identifier = username || email;

    // Validate username/email & password
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password',
      });
    }

    // Check for user and include password field
    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administrator.',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          employeeId: user.employeeId,
          territory: user.territory,
          managerId: user.managerId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

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
