const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/message');

const initializeSocket = (io) => {
  // Middleware to authenticate socket connections using JWT
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided.'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found.'));
      }
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✔️  User connected: ${socket.user.username} (ID: ${socket.id})`);

    // Join a chat room based on the request ID
    socket.on('joinRoom', async (requestId) => {
      socket.join(requestId);
      console.log(`${socket.user.username} joined room: ${requestId}`);

      // Fetch and emit chat history for this room
      try {
        const messages = await Message.find({ requestId }).sort('createdAt').populate('sender', 'username');
        socket.emit('chatHistory', messages);
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    });

    // Listen for new messages
    socket.on('sendMessage', async ({ requestId, content }) => {
      if (!content || !requestId) return;

      try {
        const message = new Message({
          requestId,
          sender: socket.user._id,
          content,
        });
        await message.save();
        const populatedMessage = await message.populate('sender', 'username');

        // Broadcast the message to everyone in the room
        io.to(requestId).emit('receiveMessage', populatedMessage);
      } catch (error) {
        console.error('Error saving or broadcasting message:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.username}`);
    });
  });
};

module.exports = initializeSocket;