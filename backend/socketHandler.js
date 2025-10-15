const jwt = require('jsonwebtoken');
const User = require('./models/user');
const Message = require('./models/message');
const Request = require('./models/request');

const initializeSocket = (io) => {
  // Middleware to authenticate socket connections using JWT
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
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
      try {
        const request = await Request.findById(requestId);
        if (!request) {
          return socket.emit('error', { message: 'Chat room not found.' });
        }

        // **SECURITY CHECK**: Only allow the donor or recipient to join the room
        const isDonor = request.donor.toString() === socket.user._id.toString();
        const isRecipient = request.recipient.toString() === socket.user._id.toString();

        if (!isDonor && !isRecipient) {
          return socket.emit('error', { message: 'You are not authorized to join this chat.' });
        }

        socket.join(requestId);
        console.log(`${socket.user.username} joined room: ${requestId}`);

        // Fetch and emit chat history for this room
        const messages = await Message.find({ requestId }).sort('createdAt').populate('sender', 'username');
        socket.emit('chatHistory', messages);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Server error while joining room.' });
      }
    });

    // Listen for new messages
    socket.on('sendMessage', async ({ requestId, content }) => {
      if (!content || !requestId || !socket.rooms.has(requestId)) return;

      try {
        const message = new Message({ requestId, sender: socket.user._id, content });
        await message.save();
        const populatedMessage = await message.populate('sender', 'username firstName');

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