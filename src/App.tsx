import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import TimeAllocationSlider from './components/TimeAllocationSlider';
import TaskTracker from './components/TaskTracker';
import LowPolyCity from './components/LowPolyCity';
import { useState } from 'react';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

interface TimeBlock {
  start: number;
  end: number;
  category: string;
  color: string;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: string;
}

function App() {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([
    { start: 0, end: 4, category: 'Sleep', color: '#2196f3' },
    { start: 4, end: 8, category: 'Work', color: '#4caf50' },
    { start: 8, end: 12, category: 'Exercise', color: '#ff9800' },
    { start: 12, end: 16, category: 'Leisure', color: '#9c27b0' },
    { start: 16, end: 24, category: 'Family Time', color: '#f44336' },
  ]);

  const [tasks, setTasks] = useState<Task[]>([]);

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleAddTask = (task: Task) => {
    setTasks([...tasks, task]);
  };

  const handleUpdateTimeBlock = (id: string, updates: { start: number; end: number }) => {
    setTimeBlocks(timeBlocks.map(block => 
      block.category === id ? { ...block, ...updates } : block
    ));
  };

  const handleDeleteTimeBlock = (id: string) => {
    setTimeBlocks(timeBlocks.filter(block => block.category !== id));
  };

  const handleAddTimeBlock = (taskId: string, start: number, end: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setTimeBlocks([...timeBlocks, {
        start,
        end,
        category: task.category,
        color: timeBlocks.find(b => b.category === task.category)?.color || '#2196f3'
      }]);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TaskTracker
        tasks={tasks}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onAddTask={handleAddTask}
        timeBlocks={timeBlocks}
      />
      <LowPolyCity timeBlocks={timeBlocks} />
      <TimeAllocationSlider timeBlocks={timeBlocks} onTimeBlocksChange={setTimeBlocks} />
    </ThemeProvider>
  );
}

export default App;
