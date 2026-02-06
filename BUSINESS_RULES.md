# Business Rules Implementation

This document outlines the pharma business rules implemented in the CRM system.

## Visit Management Rules

### 1. Prevent Duplicate Doctor Visits
- **Rule**: Same MR cannot visit the same doctor more than once per day
- **Implementation**: 
  - Checks for existing visits on the same day before creating/updating
  - Cancelled visits are excluded from duplicate check (can be recreated)
  - Returns HTTP 409 (Conflict) with existing visit ID if duplicate found
- **Location**: `controllers/visitController.js` - `createVisit()` and `updateVisit()`

### 2. Enforce Visit Time Validation
- **Rule**: Check-in time must be before check-out time
- **Implementation**:
  - Validates `checkInTime < checkOutTime` when both are provided
  - Returns HTTP 400 with error message if validation fails
- **Location**: `utils/validators.js` - `validateVisitTimes()`
- **Applied in**: `controllers/visitController.js` - `createVisit()` and `updateVisit()`

### 3. GPS Coordinates Validation
- **Rule**: All GPS coordinates must be within India's geographical boundaries
- **Valid Ranges**:
  - Latitude: 6.5° N to 37.1° N
  - Longitude: 68.7° E to 97.4° E
- **Implementation**:
  - Validates GeoJSON Point format: `{ type: 'Point', coordinates: [longitude, latitude] }`
  - Returns HTTP 400 with specific error if coordinates are outside India
- **Location**: `utils/validators.js` - `validateLocation()` and `validateIndianCoordinates()`
- **Applied in**: 
  - `controllers/visitController.js` - `createVisit()` and `updateVisit()`
  - `controllers/locationLogController.js` - `createLocationLog()`

### 4. Auto-Assign MR from JWT Token
- **Rule**: MR assignment must always come from authenticated JWT token, never from client input
- **Implementation**:
  - Removes `mrId` from request body if present
  - Always sets `mrId` from `req.user.id` (JWT token)
  - MRs can only create visits/logs for themselves
  - Owners/Managers can create for other MRs, but MR is still set from their own token (for audit trail)
- **Location**: 
  - `controllers/visitController.js` - `createVisit()`
  - `controllers/locationLogController.js` - `createLocationLog()`

### 5. Visit Date Validation
- **Rule**: Visit dates cannot be in the future or older than 90 days
- **Implementation**:
  - Validates visit date is not in future
  - Validates visit date is not older than 90 days (configurable)
  - Returns HTTP 400 with error message if validation fails
- **Location**: `utils/validators.js` - `validateVisitDate()`
- **Applied in**: `controllers/visitController.js` - `createVisit()` and `updateVisit()`

## Pagination & Filtering

### Visit List Pagination
- **Implementation**: Added pagination to `GET /api/visits`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10, max: 100)
- **Response Format**:
```json
{
  "success": true,
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "data": {
    "visits": [...]
  }
}
```
- **Location**: `utils/pagination.js` - `parsePagination()` and `formatPaginationResponse()`
- **Applied in**: `controllers/visitController.js` - `getVisits()`

### Enhanced Filtering
- **Date Range Filtering**: Improved date range queries with proper time boundaries (00:00:00 to 23:59:59)
- **Filters Available**:
  - `mrId`: Filter by Medical Representative
  - `doctorId`: Filter by Doctor
  - `startDate`: Start date (YYYY-MM-DD)
  - `endDate`: End date (YYYY-MM-DD)
  - `status`: Filter by visit status (Completed, Cancelled, Rescheduled)
  - `page`: Page number for pagination
  - `limit`: Items per page

## Validation Helpers

### Reusable Validation Functions (`utils/validators.js`)

1. **validateIndianCoordinates(longitude, latitude)**
   - Validates GPS coordinates are within India's boundaries
   - Returns: `{ isValid: boolean, errors: string[] }`

2. **validateLocation(location)**
   - Validates GeoJSON Point format and coordinates
   - Returns: `{ isValid: boolean, errors: string[] }`

3. **validateVisitTimes(checkInTime, checkOutTime)**
   - Validates check-in is before check-out
   - Returns: `{ isValid: boolean, errors: string[] }`

4. **validateVisitDate(visitDate, maxDaysOld)**
   - Validates visit date is not in future and not too old
   - Returns: `{ isValid: boolean, errors: string[] }`

5. **getDayRange(date)**
   - Returns start and end of day for a given date
   - Used for duplicate visit detection

## Security Enhancements

1. **MR Assignment Security**: Prevents client-side manipulation of MR assignment
2. **Role-Based Access**: MRs can only access their own data
3. **Input Validation**: All GPS coordinates validated before storage
4. **Date Validation**: Prevents invalid date entries

## Error Responses

### Duplicate Visit (409 Conflict)
```json
{
  "success": false,
  "message": "A visit to this doctor already exists for today...",
  "data": {
    "existingVisitId": "visit_id_here"
  }
}
```

### Validation Errors (400 Bad Request)
```json
{
  "success": false,
  "message": "Latitude 50.0 is outside India's range (6.5° N to 37.1° N)"
}
```

## Testing Recommendations

1. **Duplicate Visit Test**: Try creating two visits for same doctor on same day
2. **GPS Validation Test**: Try coordinates outside India (e.g., New York: -74.0, 40.7)
3. **Time Validation Test**: Try check-out before check-in
4. **Pagination Test**: Test with different page/limit values
5. **MR Assignment Test**: Try sending mrId in request body (should be ignored)

## Future Enhancements

- Add visit duration calculation from check-in/check-out times
- Add distance validation (visit location vs doctor location)
- Add visit frequency limits per doctor
- Add bulk visit import validation
- Add visit approval workflow for Managers
