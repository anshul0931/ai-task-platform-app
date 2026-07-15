const express = require('express');
const {
  createTask,
  getTasks,
  getTaskById,
  deleteTask,
  updateTaskStatus,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const internalAuth = require('../middleware/internalAuth');

const router = express.Router();

router.route('/').post(protect, createTask).get(protect, getTasks);
router.route('/:id').get(protect, getTaskById).delete(protect, deleteTask);

// Called by the Python worker service, not by end users
router.patch('/:id/status', internalAuth, updateTaskStatus);

module.exports = router;
