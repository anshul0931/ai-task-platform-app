// Simple, language-agnostic Redis-list based queue (LPUSH producer / BRPOP consumer)
// so the Node backend (producer) and the Python worker (consumer) share one
// plain data structure instead of relying on a Node-only client library format.
const redis = require('../config/redis');

const QUEUE_NAME = process.env.QUEUE_NAME || 'ai-tasks';

const addTaskToQueue = async (taskId, operation, inputText) => {
  const job = {
    taskId: taskId.toString(),
    operation,
    inputText,
    attempts: 0,
    maxAttempts: 3,
    enqueuedAt: new Date().toISOString(),
  };
  await redis.lpush(QUEUE_NAME, JSON.stringify(job));
};

module.exports = { addTaskToQueue, QUEUE_NAME };
