const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');
const { addTaskToQueue } = require('../queue/taskQueue');

// @desc    Create a new AI processing task (Title, Input Text, Operation Type)
// @route   POST /api/tasks
const createTask = asyncHandler(async (req, res) => {
  const { title, inputText, operation } = req.body;

  if (!title || !inputText || !operation) {
    res.status(400);
    throw new Error('Please provide title, inputText and operation');
  }

  const task = await Task.create({
    user: req.user._id,
    title,
    inputText,
    operation,
    status: 'pending',
    logs: [{ message: 'Task created and queued for processing' }],
  });

  await addTaskToQueue(task._id, task.operation, task.inputText);

  const io = req.app.get('io');
  io.to(req.user._id.toString()).emit('task:created', task);

  res.status(201).json({ success: true, data: task });
});

// @desc    Get all tasks for logged-in user
// @route   GET /api/tasks
const getTasks = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;

  const tasks = await Task.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Task.countDocuments(filter);

  res.json({ success: true, data: tasks, meta: { total, page: Number(page), limit: Number(limit) } });
});

// @desc    Get single task (includes logs + result)
// @route   GET /api/tasks/:id
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  res.json({ success: true, data: task });
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  res.json({ success: true, data: {} });
});

// @desc    Internal endpoint used by the Python worker to report
//          status transitions, execution logs, and final results.
// @route   PATCH /api/tasks/:id/status  (protected by internal API key)
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status, result, error, logMessage, startedAt, completedAt } = req.body;

  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  if (status) task.status = status;
  if (result !== undefined) task.result = result;
  if (error !== undefined) task.error = error;
  if (startedAt) task.startedAt = startedAt;
  if (completedAt) task.completedAt = completedAt;
  if (logMessage) task.logs.push({ message: logMessage });

  await task.save();

  const io = req.app.get('io');
  io.to(task.user.toString()).emit('task:updated', task);

  res.json({ success: true, data: task });
});

module.exports = { createTask, getTasks, getTaskById, deleteTask, updateTaskStatus };
