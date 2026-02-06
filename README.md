# INOLIFE HEALTHCARE - Pharma CRM + MR Tracking System

A scalable backend system for managing Medical Representatives, Doctors, Products, Visits, and Sales data.

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (with Mongoose ODM)
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Project Structure

```
├── config/
│   └── database.js          # MongoDB connection
├── models/
│   ├── User.js              # User schema (Owner/Manager/MR)
│   ├── Doctor.js            # Doctor schema
│   ├── Product.js           # Product schema
│   ├── Visit.js             # Visit schema
│   └── LocationLog.js       # Location tracking schema
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User CRUD routes
│   ├── doctors.js           # Doctor CRUD routes
│   ├── products.js          # Product CRUD routes
│   ├── visits.js            # Visit CRUD routes
│   └── locationLogs.js      # Location tracking routes
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── doctorController.js
│   ├── productController.js
│   ├── visitController.js
│   └── locationLogController.js
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   ├── errorHandler.js      # Global error handler
│   └── validator.js         # Request validation
├── utils/
│   ├── csvParser.js         # CSV import utility for MARG ERP
│   └── helpers.js           # Helper functions
├── server.js                # Main server file
└── package.json
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB connection string and JWT secret.

4. Start the server:
```bash
npm run dev  # Development mode with nodemon
# or
npm start    # Production mode
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users` - Get all users (with role filtering)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `POST /api/doctors` - Create doctor
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Visits
- `GET /api/visits` - Get all visits (with filtering)
- `GET /api/visits/:id` - Get visit by ID
- `POST /api/visits` - Create visit
- `PUT /api/visits/:id` - Update visit
- `DELETE /api/visits/:id` - Delete visit

### Location Logs
- `GET /api/location-logs` - Get location logs (with filtering)
- `POST /api/location-logs` - Create location log

## Roles

- **Owner** - Full system access
- **Manager** - Can manage MRs, view all data
- **MR** - Can create visits, log locations, view assigned doctors

## Future Enhancements

- CSV import from MARG ERP
- Mobile app integration
- Real-time location tracking
- Analytics and reporting
- Push notifications
