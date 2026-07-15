import { useState } from 'react';

const STATUS_LABELS = {
  pending: 'Pending',
  running: 'Running',
  success: 'Success',
  failed: 'Failed',
};

export default function TaskItem({ task, onDelete }) {
  const [showLogs, setShowLogs] = useState(false);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{task.title}</strong>
        <span className={`badge ${task.status}`}>{STATUS_LABELS[task.status] || task.status}</span>
      </div>
      <p style={{ fontSize: 13, color: '#94a3b8' }}>Operation: {task.operation}</p>

      {task.status === 'success' && task.result && (
        <pre style={{ whiteSpace: 'pre-wrap', background: '#0f172a', padding: 10, borderRadius: 6 }}>
          {JSON.stringify(task.result, null, 2)}
        </pre>
      )}

      {task.status === 'failed' && task.error && (
        <p className="error-text">Error: {task.error}</p>
      )}

      <button onClick={() => setShowLogs((v) => !v)} style={{ background: '#334155', marginRight: 8 }}>
        {showLogs ? 'Hide Logs' : 'View Logs'}
      </button>
      <button onClick={() => onDelete(task._id)} style={{ background: '#dc2626' }}>
        Delete
      </button>

      {showLogs && (
        <div style={{ marginTop: 10, background: '#0f172a', padding: 10, borderRadius: 6, fontSize: 13 }}>
          {(task.logs || []).length === 0 && <p style={{ color: '#94a3b8' }}>No logs yet.</p>}
          {(task.logs || []).map((log, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <span style={{ color: '#64748b' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>{' '}
              — {log.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
