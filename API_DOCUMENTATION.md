# API Documentation - INOLIFE HEALTHCARE CRM

Base URL: `http://localhost:3000/api`

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### Register User
- **POST** `/auth/register`
- **Access**: Public
- **Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "MR",
  "employeeId": "MR001",
  "territory": "Mumbai",
  "managerId": "manager_id_here" // Optional, for MR role
}
```

### Login
- **POST** `/auth/login`
- **Access**: Public
- **Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response**: Returns JWT token

### Get Current User
- **GET** `/auth/me`
- **Access**: Private

---

## User Endpoints

### Get All Users
- **GET** `/users`
- **Access**: Private (Owner, Manager, MR)
- **Query Params**:
  - `role`: Filter by role (Owner, Manager, MR)
  - `managerId`: Filter MRs by manager
  - `isActive`: Filter by active status (true/false)
- **Note**: MRs see only themselves, Managers see themselves + their MRs

### Get User by ID
- **GET** `/users/:id`
- **Access**: Private

### Update User
- **PUT** `/users/:id`
- **Access**: Private
- **Note**: MRs can only update themselves (limited fields)

### Delete User (Soft Delete)
- **DELETE** `/users/:id`
- **Access**: Private (Owner, Manager)

---

## Doctor Endpoints

### Get All Doctors
- **GET** `/doctors`
- **Access**: Private
- **Query Params**:
  - `assignedMR`: Filter by assigned MR
  - `city`: Filter by city
  - `state`: Filter by state
  - `category`: Filter by category (A, B, C)
  - `isActive`: Filter by active status
- **Note**: MRs see only their assigned doctors

### Get Doctor by ID
- **GET** `/doctors/:id`
- **Access**: Private

### Create Doctor
- **POST** `/doctors`
- **Access**: Private (Owner, Manager, MR)
- **Body**:
```json
{
  "name": "Dr. Jane Smith",
  "specialization": "Cardiology",
  "qualification": "MBBS, MD",
  "registrationNumber": "REG123456",
  "phone": "9876543210",
  "email": "doctor@example.com",
  "clinicName": "City Hospital",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "location": {
    "type": "Point",
    "coordinates": [72.8777, 19.0760]
  },
  "category": "A",
  "assignedMR": "mr_id_here"
}
```

### Update Doctor
- **PUT** `/doctors/:id`
- **Access**: Private

### Delete Doctor (Soft Delete)
- **DELETE** `/doctors/:id`
- **Access**: Private (Owner, Manager)

---

## Product Endpoints

### Get All Products
- **GET** `/products`
- **Access**: Private
- **Query Params**:
  - `category`: Filter by category
  - `type`: Filter by type (Tablet, Capsule, Syrup, etc.)
  - `isActive`: Filter by active status
  - `search`: Search by name or code

### Get Product by ID
- **GET** `/products/:id`
- **Access**: Private

### Create Product
- **POST** `/products`
- **Access**: Private (Owner, Manager)
- **Body**:
```json
{
  "name": "Paracetamol 500mg",
  "code": "PRD001",
  "category": "Analgesic",
  "type": "Tablet",
  "packSize": "10x10",
  "mrp": 50.00,
  "sku": "SKU001",
  "hsnCode": "30049099",
  "description": "Pain reliever",
  "composition": "Paracetamol 500mg"
}
```

### Update Product
- **PUT** `/products/:id`
- **Access**: Private (Owner, Manager)

### Delete Product (Soft Delete)
- **DELETE** `/products/:id`
- **Access**: Private (Owner, Manager)

---

## Visit Endpoints

### Get All Visits
- **GET** `/visits`
- **Access**: Private
- **Query Params**:
  - `mrId`: Filter by MR
  - `doctorId`: Filter by doctor
  - `startDate`: Start date (YYYY-MM-DD)
  - `endDate`: End date (YYYY-MM-DD)
  - `status`: Filter by status (Completed, Cancelled, Rescheduled)
- **Note**: MRs see only their visits, Managers see their MRs' visits

### Get Visit by ID
- **GET** `/visits/:id`
- **Access**: Private

### Create Visit
- **POST** `/visits`
- **Access**: Private
- **Body**:
```json
{
  "doctorId": "doctor_id_here",
  "visitDate": "2024-01-15",
  "visitTime": "2024-01-15T10:00:00Z",
  "purpose": "Product Presentation",
  "productsDiscussed": [
    {
      "productId": "product_id_here",
      "quantity": 10,
      "notes": "Discussed benefits"
    }
  ],
  "samplesGiven": [
    {
      "productId": "product_id_here",
      "quantity": 5
    }
  ],
  "orders": [
    {
      "productId": "product_id_here",
      "quantity": 20,
      "unitPrice": 45.00
    }
  ],
  "notes": "Visit notes here",
  "doctorFeedback": "Positive response",
  "nextFollowUpDate": "2024-01-22",
  "duration": 30,
  "location": {
    "type": "Point",
    "coordinates": [72.8777, 19.0760]
  }
}
```

### Update Visit
- **PUT** `/visits/:id`
- **Access**: Private

### Delete Visit
- **DELETE** `/visits/:id`
- **Access**: Private

---

## Location Log Endpoints

### Get All Location Logs
- **GET** `/location-logs`
- **Access**: Private
- **Query Params**:
  - `mrId`: Filter by MR
  - `startDate`: Start date
  - `endDate`: End date
  - `limit`: Limit results (default: 1000)
- **Note**: MRs see only their logs, Managers see their MRs' logs

### Get Location Log by ID
- **GET** `/location-logs/:id`
- **Access**: Private

### Create Location Log
- **POST** `/location-logs`
- **Access**: Private
- **Body**:
```json
{
  "location": {
    "type": "Point",
    "coordinates": [72.8777, 19.0760]
  },
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "accuracy": 10,
  "speed": 0,
  "heading": 0,
  "altitude": 0,
  "batteryLevel": 85,
  "deviceInfo": {
    "platform": "Android",
    "model": "Samsung Galaxy",
    "osVersion": "12"
  },
  "activity": "walking"
}
```

### Get Current Location
- **GET** `/location-logs/current/:mrId?`
- **Access**: Private
- **Note**: Returns most recent location for MR (defaults to current user)

---

## Import Endpoints

### Import MARG ERP CSV
- **POST** `/import/marg-erp`
- **Access**: Private (Owner, Manager)
- **Content-Type**: `multipart/form-data`
- **Body**: CSV file (field name: `file`)
- **Expected CSV Format**:
```csv
Date,MR_Code,Doctor_Code,Product_Code,Quantity,Amount
2024-01-15,MR001,DR001,PRD001,10,5000
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Role-Based Access

### Owner
- Full access to all endpoints
- Can manage all users, doctors, products
- Can view all visits and location logs

### Manager
- Can manage MRs assigned to them
- Can view visits and location logs of their MRs
- Can create/update doctors and products
- Cannot change user roles

### MR (Medical Representative)
- Can only view/update their own data
- Can create visits for assigned doctors
- Can log their location
- Can view assigned doctors and products
- Cannot delete or modify other users' data
