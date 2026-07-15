const express = require('express');
const mongoose = require('mongoose');
const redis = require('../config/redis');

const router = express.Router();

router.get('/', async (req, res) => {
  const mongoState = mongoose.connection.readyState === 1 ? 'up' : 'down';
  let redisState = 'down';
  try {
    const pong = await redis.ping();
    redisState = pong === 'PONG' ? 'up' : 'down';
  } catch (e) {
    // Ignore redis connection issue
  }

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    dependencies: { mongo: mongoState, redis: redisState },
  });
});

module.exports = router;
