import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../socket';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  const fetchTasks = async () => {
    const { data } = await api.get('/tasks');
    setTasks(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();

    const socket = getSocket();
    if (socket) {
      socket.on('task:created', (task) => {
        setTasks((prev) => [task, ...prev]);
      });

      socket.on('task:updated', (updatedTask) => {
        setTasks((prev) =>
          prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('task:created');
        socket.off('task:updated');
      }
    };
  }, []);

  const handleDelete = async (id) => {
    await api.delete(`/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t._id !== id));
  };

  return (
    <div className="container">
      <nav>
        <h2>AI Task Platform</h2>
        <div>
          <span style={{ marginRight: 12 }}>Hi, {user?.name}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </nav>

      {/* 👇 Yahi change hai */}
      <TaskForm onCreated={() => { }} />

      <h3>Your Tasks</h3>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <TaskList tasks={tasks} onDelete={handleDelete} />
      )}
    </div>
  );
}