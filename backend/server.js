// Load environment variables
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const initializeSocket = require('./socketHandler');
const expiryTrackingService = require('./services/expiryTrackingService');

// Initialize Express app
const app = express();

// Connect to Database
connectDB();

// Middlewares
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());

// API Routes
app.get('/', (req, res) => res.send('MealMender API is running...'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// Use Railway port
const PORT = process.env.PORT || 5000;

// Create HTTP server and Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
initializeSocket(io);

// Start server immediately
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Start services asynchronously (non-blocking)
(async () => {
  try {
    await expiryTrackingService.start();
    console.log('✅ Expiry tracking service started successfully');
  } catch(err) {
    console.error('❌ Expiry tracking service failed:', err);
  }

  // Email service removed - notifications disabled
  console.log('ℹ️  Email notifications disabled');
})();
