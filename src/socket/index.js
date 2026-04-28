/**
 * Socket.io Initialization
 */

const { Server } = require('socket.io');
const deliveryHandler = require('./delivery.handler');

const initSocket = (server, cors) => {
  const corsOrigin = cors?.origin ?? '*';
  const corsCredentials = Boolean(cors?.credentials);

  const origin =
    corsOrigin === '*'
      ? (originValue, callback) => callback(null, true)
      : corsOrigin;

  const io = new Server(server, {
    cors: {
      origin,
      methods: ['GET', 'POST'],
      credentials: corsOrigin === '*' ? false : corsCredentials,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Register handlers
    deliveryHandler(io, socket);

    // Print center: join room to receive assigned orders
    socket.on('join_print_center', (data) => {
      const { printCenterId } = data || {};
      if (printCenterId) {
        socket.join(`print_center_${printCenterId}`);
        console.log(`🖨️ Print center ${printCenterId} joined room`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initSocket;
