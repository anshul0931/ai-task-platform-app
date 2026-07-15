import { useState } from 'react';
import api from '../api/axios';

export default function TaskForm({ onCreated }) {
  const [title, setTitle] = useState('');
  const [operation, setOperation] = useState('uppercase');
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/tasks', { title, operation, inputText });
      onCreated?.(data.data);
      setTitle('');
      setInputText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h3>New AI Task</h3>
      <form onSubmit={handleSubmit}>
        <label>Task Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label>Operation Type</label>
        <select value={operation} onChange={(e) => setOperation(e.target.value)}>
          <option value="uppercase">Uppercase</option>
          <option value="lowercase">Lowercase</option>
          <option value="reverse-string">Reverse String</option>
          <option value="word-count">Word Count</option>
        </select>

        <label>Input Text</label>
        <textarea rows={5} value={inputText} onChange={(e) => setInputText(e.target.value)} required />

        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Run Task'}
        </button>
      </form>
    </div>
  );
}
