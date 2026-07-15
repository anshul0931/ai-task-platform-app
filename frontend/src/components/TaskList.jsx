import TaskItem from './TaskItem';

export default function TaskList({ tasks, onDelete }) {
  if (!tasks.length) return <p>No tasks yet. Create one above.</p>;
  return (
    <div>
      {tasks.map((task) => (
        <TaskItem key={task._id} task={task} onDelete={onDelete} />
      ))}
    </div>
  );
}
