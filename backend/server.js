const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware - allow all localhost ports and local network IPs for development
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow all localhost origins in development
      if (origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }

      // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      const localNetworkPattern = /^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;
      if (localNetworkPattern.test(origin)) {
        return callback(null, true);
      }

      // Allow Vercel deployment domains (production)
      if (origin.includes('.vercel.app') || origin.includes('ukk-jaga-kampung')) {
        return callback(null, true);
      }

      // For production, you can add specific domains here
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 hours
  })
);



// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Location proxy route
const locationRoutes = require('./routes/locationRoutes');
app.use('/api/location', locationRoutes);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/schedules', require('./routes/scheduleRoutes'));
app.use('/api/attendances', require('./routes/attendanceRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'JagaKampung API is running...',
    version: '1.0.0',
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📱 Access from network: http://192.168.110.7:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
