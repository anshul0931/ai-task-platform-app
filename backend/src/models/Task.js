const mongoose = require('mongoose');

const logEntrySchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    message: { type: String, required: true },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    inputText: { type: String, required: true },
    operation: {
      type: String,
      enum: ['uppercase', 'lowercase', 'reverse-string', 'word-count'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'success', 'failed'],
      default: 'pending',
      index: true,
    },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    logs: { type: [logEntrySchema], default: [] },
    error: { type: String, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound index: fast "my tasks by status, most recent first" queries —
// the dashboard's primary access pattern.
taskSchema.index({ user: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
