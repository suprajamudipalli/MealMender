// Load environment variables FIRST before any other imports
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
// Configure CORS for local development and future production
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser tools
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any localhost with any port (useful during dev)
    if (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json()); // To accept JSON data in the body

// API Routes
app.get('/', (req, res) => {
  res.send('MealMender API is running...');
});
// Health check endpoint for frontend connectivity tests
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// Define the port
const PORT = process.env.PORT || 5000;

// Create HTTP server and initialize Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // In production, restrict this to your frontend URL
  }
});

initializeSocket(io);

// Start the server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Start expiry tracking service
  expiryTrackingService.start();
});