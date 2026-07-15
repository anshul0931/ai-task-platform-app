require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const initSocket = require('./socket');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const server = http.createServer(app);
  const allowedOrigins = (process.env.CLIENT_ORIGIN || '*')
    .split(',')
    .map((o) => o.trim());

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
      credentials: true,
    },
  });

  initSocket(io);
  app.set('io', io);

  server.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
};

start();
