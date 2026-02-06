/**
 * Helper utility functions
 */

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

const toRad = (degrees) => {
  return (degrees * Math.PI) / 180;
};

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Generate employee ID
 */
const generateEmployeeId = async (role) => {
  const User = require('../models/User');
  const prefix = role === 'MR' ? 'MR' : role === 'Manager' ? 'MGR' : 'OWN';
  
  // Find the last employee with this prefix
  const lastEmployee = await User.findOne({
    employeeId: new RegExp(`^${prefix}`),
  })
    .sort({ employeeId: -1 })
    .select('employeeId');

  let nextNumber = 1;
  if (lastEmployee && lastEmployee.employeeId) {
    const lastNumber = parseInt(lastEmployee.employeeId.replace(prefix, ''));
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
};

/**
 * Validate phone number (Indian format)
 */
const validateIndianPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Validate pincode (Indian format)
 */
const validateIndianPincode = (pincode) => {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};

module.exports = {
  calculateDistance,
  formatDate,
  generateEmployeeId,
  validateIndianPhone,
  validateIndianPincode,
};
