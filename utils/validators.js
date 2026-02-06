/**
 * Validation helpers for pharma CRM business rules
 */

/**
 * Validate GPS coordinates for India
 * India coordinates range:
 * Latitude: 6.5° N to 37.1° N
 * Longitude: 68.7° E to 97.4° E
 */
const validateIndianCoordinates = (longitude, latitude) => {
  const errors = [];

  // Validate latitude (6.5° N to 37.1° N)
  if (latitude < 6.5 || latitude > 37.1) {
    errors.push(`Latitude ${latitude} is outside India's range (6.5° N to 37.1° N)`);
  }

  // Validate longitude (68.7° E to 97.4° E)
  if (longitude < 68.7 || longitude > 97.4) {
    errors.push(`Longitude ${longitude} is outside India's range (68.7° E to 97.4° E)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate GPS coordinates from GeoJSON Point format
 * @param {Object} location - GeoJSON Point object { type: 'Point', coordinates: [longitude, latitude] }
 */
const validateLocation = (location) => {
  if (!location || !location.coordinates || !Array.isArray(location.coordinates)) {
    return {
      isValid: false,
      errors: ['Invalid location format. Expected GeoJSON Point with coordinates array'],
    };
  }

  if (location.coordinates.length !== 2) {
    return {
      isValid: false,
      errors: ['Coordinates must contain exactly 2 values [longitude, latitude]'],
    };
  }

  const [longitude, latitude] = location.coordinates;

  if (typeof longitude !== 'number' || typeof latitude !== 'number') {
    return {
      isValid: false,
      errors: ['Coordinates must be numbers'],
    };
  }

  return validateIndianCoordinates(longitude, latitude);
};

/**
 * Validate check-in time is before check-out time
 */
const validateVisitTimes = (checkInTime, checkOutTime) => {
  if (!checkInTime || !checkOutTime) {
    return {
      isValid: true, // Both optional, but if one exists, both should exist
      errors: [],
    };
  }

  const checkIn = new Date(checkInTime);
  const checkOut = new Date(checkOutTime);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return {
      isValid: false,
      errors: ['Invalid date format for check-in or check-out time'],
    };
  }

  if (checkIn >= checkOut) {
    return {
      isValid: false,
      errors: ['Check-in time must be before check-out time'],
    };
  }

  return {
    isValid: true,
    errors: [],
  };
};

/**
 * Check if visit date is within valid range (not in future, not too old)
 */
const validateVisitDate = (visitDate, maxDaysOld = 90) => {
  const date = new Date(visitDate);
  const now = new Date();
  const maxOldDate = new Date();
  maxOldDate.setDate(maxOldDate.getDate() - maxDaysOld);

  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      errors: ['Invalid visit date format'],
    };
  }

  if (date > now) {
    return {
      isValid: false,
      errors: ['Visit date cannot be in the future'],
    };
  }

  if (date < maxOldDate) {
    return {
      isValid: false,
      errors: [`Visit date cannot be older than ${maxDaysOld} days`],
    };
  }

  return {
    isValid: true,
    errors: [],
  };
};

/**
 * Get start and end of day for a given date
 */
const getDayRange = (date) => {
  const d = new Date(date);
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

module.exports = {
  validateIndianCoordinates,
  validateLocation,
  validateVisitTimes,
  validateVisitDate,
  getDayRange,
};
