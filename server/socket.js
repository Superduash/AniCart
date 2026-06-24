const { Server } = require('socket.io');
const config = require('./config');

let io;

const initSocket = (server) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://anicartweb.netlify.app',
    config.CLIENT_URL,
  ].filter((url) => url && url !== 'undefined');

  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin) || /\.onrender\.com$/.test(origin)) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Allow clients to join a room specific to their user ID to receive targeted events
    socket.on('join_user_room', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = {
  initSocket,
  getIo,
};
