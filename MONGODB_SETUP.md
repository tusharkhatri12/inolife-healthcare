# MongoDB setup – data persistence

All data from the **MR app** and **admin dashboard** is stored in MongoDB. The backend must have a valid MongoDB connection or nothing will be saved.

## 1. Backend must connect before accepting requests

The server now **waits for MongoDB to connect** before starting the HTTP server. If `MONGODB_URI` is missing or wrong, the server will exit at startup with a clear error.

## 2. Set `MONGODB_URI` everywhere you run the backend

### Local development

In the project root (where `server.js` is), create or edit `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/inolife-healthcare
```

Start MongoDB locally, then start the server.

### Production (e.g. Render + Atlas)

1. **MongoDB Atlas**
   - Create a cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
   - Create a database user (username + password).
   - In **Network Access**, allow your Render server IP (or `0.0.0.0` for “allow from anywhere”).
   - Get the connection string (e.g. **Connect → Drivers → Node.js**). It looks like:
     `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/DBNAME?retryWrites=true&w=majority`

2. **Render (or your host)**
   - In the **Environment** / **Environment variables** section for your backend service, add:
   - **Key:** `MONGODB_URI`
   - **Value:** your Atlas connection string (replace `USER`, `PASSWORD`, and `DBNAME` with your values).

3. Redeploy the backend so it starts with the new variable.

## 3. Verify that data is saved

- **Health check:** Open `https://your-backend-url/api/health`. You should see `"database": "connected"` and `"databaseOk": true`. If you see `disconnected`, the server is not connected to MongoDB and data will not be saved.
- After creating a visit/doctor/sale from the MR app or admin dashboard, check the same data in MongoDB (e.g. Atlas **Collections**) or via a GET request to the same API.

## 4. MR app and admin dashboard

Both use the same backend API (e.g. `https://inolife-backend.onrender.com/api`). They do not connect to MongoDB directly. As long as:

- The backend is running,
- `MONGODB_URI` is set correctly on the backend,
- And the server has started (so you see “MongoDB connected” in logs),

all creates/updates from the MR app and admin dashboard are persisted in MongoDB.
