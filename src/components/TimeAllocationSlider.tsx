import React, { useState } from 'react';
import { 
  Box, 
  Slider, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Settings as SettingsIcon,
  AddTask as AddTaskIcon
} from '@mui/icons-material';
import LowPolyCity from './LowPolyCity';

interface TimeBlock {
  start: number;
  end: number;
  category: string;
  color: string;
}

interface TimeRange {
  start: number;
  end: number;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: string;
}

const TimeAllocationSlider: React.FC = () => {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([
    { start: 0, end: 4, category: 'Sleep', color: '#2196f3' },
    { start: 4, end: 8, category: 'Work', color: '#4caf50' },
    { start: 8, end: 12, category: 'Exercise', color: '#ff9800' },
    { start: 12, end: 16, category: 'Leisure', color: '#9c27b0' },
    { start: 16, end: 24, category: 'Family Time', color: '#f44336' },
  ]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>({ start: 0, end: 24 });
  const [tempTimeRange, setTempTimeRange] = useState<TimeRange>({ start: 0, end: 24 });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#000000' });
  const [newTask, setNewTask] = useState({ text: '', category: '' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${period}`;
  };

  const handleTimeRangeChange = (newRange: TimeRange) => {
    // Validate the new range
    if (newRange.end <= newRange.start) {
      setErrorMessage('End time must be greater than start time');
      return;
    }

    if (newRange.end - newRange.start < 1) {
      setErrorMessage('Time range must be at least 1 hour');
      return;
    }

    // Adjust time blocks to fit within the new range
    const newTimeBlocks = timeBlocks.map(block => {
      const blockDuration = block.end - block.start;
      const newStart = Math.max(newRange.start, block.start);
      const newEnd = Math.min(newRange.end, block.end);
      
      // If block is completely outside new range, adjust it to start at the beginning
      if (newStart >= newRange.end || newEnd <= newRange.start) {
        return {
          ...block,
          start: newRange.start,
          end: Math.min(newRange.start + blockDuration, newRange.end)
        };
      }

      return {
        ...block,
        start: newStart,
        end: newEnd
      };
    });

    setTimeBlocks(newTimeBlocks);
    setTimeRange(newRange);
    setIsSettingsDialogOpen(false);
  };

  const handleOpenSettings = () => {
    setTempTimeRange(timeRange);
    setIsSettingsDialogOpen(true);
  };

  const handleAcceptTimeRange = () => {
    handleTimeRangeChange(tempTimeRange);
  };

  const handleBlockChange = (index: number, newValue: number[]) => {
    const [newStart, newEnd] = newValue;
    const newTimeBlocks = [...timeBlocks];
    
    // Ensure minimum block duration of 30 minutes
    if (newEnd - newStart < 0.5) {
      setErrorMessage('Time blocks must be at least 30 minutes long');
      return;
    }

    // Get adjacent blocks
    const prevBlock = index > 0 ? newTimeBlocks[index - 1] : null;
    const nextBlock = index < newTimeBlocks.length - 1 ? newTimeBlocks[index + 1] : null;

    // Calculate the total change in time
    const startDiff = newStart - timeBlocks[index].start;
    const endDiff = newEnd - timeBlocks[index].end;

    // Update the current block
    newTimeBlocks[index] = {
      ...newTimeBlocks[index],
      start: newStart,
      end: newEnd,
    };

    // Adjust previous block if moving start time
    if (prevBlock && startDiff !== 0) {
      newTimeBlocks[index - 1] = {
        ...prevBlock,
        end: newStart,
      };
    }

    // Adjust next block if moving end time
    if (nextBlock && endDiff !== 0) {
      newTimeBlocks[index + 1] = {
        ...nextBlock,
        start: newEnd,
      };
    }

    // Ensure blocks don't go beyond time range
    if (newTimeBlocks[index].end > timeRange.end) {
      newTimeBlocks[index] = {
        ...newTimeBlocks[index],
        end: timeRange.end,
      };
      if (nextBlock) {
        newTimeBlocks[index + 1] = {
          ...nextBlock,
          start: timeRange.end,
        };
      }
    }

    // Ensure blocks don't start before time range
    if (newTimeBlocks[index].start < timeRange.start) {
      newTimeBlocks[index] = {
        ...newTimeBlocks[index],
        start: timeRange.start,
      };
      if (prevBlock) {
        newTimeBlocks[index - 1] = {
          ...prevBlock,
          end: timeRange.start,
        };
      }
    }

    // Ensure minimum block duration for adjacent blocks
    if (prevBlock && newTimeBlocks[index - 1].end - newTimeBlocks[index - 1].start < 0.5) {
      setErrorMessage('Time blocks must be at least 30 minutes long');
      return;
    }
    if (nextBlock && newTimeBlocks[index + 1].end - newTimeBlocks[index + 1].start < 0.5) {
      setErrorMessage('Time blocks must be at least 30 minutes long');
      return;
    }

    setTimeBlocks(newTimeBlocks);
  };

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      const lastBlock = timeBlocks[timeBlocks.length - 1];
      const newBlock: TimeBlock = {
        start: lastBlock.end,
        end: timeRange.end,
        category: newCategory.name.trim(),
        color: newCategory.color,
      };
      setTimeBlocks([...timeBlocks, newBlock]);
      setNewCategory({ name: '', color: '#000000' });
      setIsAddDialogOpen(false);
    }
  };

  const handleRemoveCategory = (index: number) => {
    const newTimeBlocks = timeBlocks.filter((_, i) => i !== index);
    // Adjust the end time of the previous block to fill the gap
    if (index > 0 && index < timeBlocks.length) {
      newTimeBlocks[index - 1] = {
        ...newTimeBlocks[index - 1],
        end: timeBlocks[index].end,
      };
    }
    setTimeBlocks(newTimeBlocks);
    setSelectedBlock(null);
  };

  const handleAddTask = () => {
    if (newTask.text.trim() && newTask.category) {
      const task: Task = {
        id: Date.now().toString(),
        text: newTask.text.trim(),
        completed: false,
        category: newTask.category
      };
      setTasks([...tasks, task]);
      setNewTask({ text: '', category: '' });
      setIsAddTaskDialogOpen(false);
    }
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  // Calculate time markers based on the time range
  const timeMarkers = [];
  const range = timeRange.end - timeRange.start;
  const interval = Math.ceil(range / 4); // Show 4 markers
  for (let i = timeRange.start; i <= timeRange.end; i += interval) {
    timeMarkers.push(i);
  }
  if (!timeMarkers.includes(timeRange.end)) {
    timeMarkers.push(timeRange.end);
  }

  return (
    <>
      {/* Task Tracker */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2,
          width: '33%',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          borderRadius: 0,
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Tasks</Typography>
          <Button
            variant="contained"
            startIcon={<AddTaskIcon />}
            onClick={() => setIsAddTaskDialogOpen(true)}
          >
            Add Task
          </Button>
        </Box>

        <List sx={{ flex: 1, overflow: 'auto' }}>
          {tasks.map((task) => (
            <React.Fragment key={task.id}>
              <ListItem>
                <Checkbox
                  edge="start"
                  checked={task.completed}
                  onChange={() => handleToggleTask(task.id)}
                />
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: timeBlocks.find(block => block.category === task.category)?.color || '#ccc',
                    mr: 1
                  }}
                />
                <ListItemText
                  primary={task.text}
                  secondary={task.category}
                  sx={{
                    textDecoration: task.completed ? 'line-through' : 'none',
                    color: task.completed ? 'text.secondary' : 'text.primary'
                  }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* 3D City Background */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: '33%',
          right: 0,
          height: '100vh',
          zIndex: 0
        }}
      >
        <LowPolyCity timeBlocks={timeBlocks} />
      </Box>

      {/* Time Allocation Slider */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          maxWidth: 1200, 
          mx: 'auto', 
          mt: 'auto',
          position: 'fixed',
          bottom: 0,
          left: '33%',
          right: 0,
          borderRadius: '16px 16px 0 0',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 1
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Daily Time Allocation
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={handleOpenSettings}
            >
              Time Range
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsAddDialogOpen(true)}
            >
              Add Category
            </Button>
          </Box>
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          {timeBlocks.map((block, index) => (
            <Box 
              key={index} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                cursor: 'pointer',
                opacity: selectedBlock === null || selectedBlock === index ? 1 : 0.5,
                transition: 'opacity 0.2s',
              }}
              onClick={() => setSelectedBlock(index)}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: block.color,
                }}
              />
              <Typography variant="body2">
                {block.category} ({formatTime(block.start)} - {formatTime(block.end)})
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveCategory(index);
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
        </Box>

        {/* Main Slider */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Box sx={{ position: 'relative', height: 40 }}>
            {/* Time markers */}
            <Box sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              display: 'flex', 
              justifyContent: 'space-between',
              px: 1
            }}>
              {timeMarkers.map((hour) => (
                <Typography key={hour} variant="caption" color="text.secondary">
                  {formatTime(hour)}
                </Typography>
              ))}
            </Box>

            {/* Colored segments */}
            <Box sx={{ position: 'absolute', top: 20, left: 0, right: 0, height: 4 }}>
              {timeBlocks.map((block, index) => (
                <Box
                  key={index}
                  sx={{
                    position: 'absolute',
                    left: `${((block.start - timeRange.start) / (timeRange.end - timeRange.start)) * 100}%`,
                    width: `${((block.end - block.start) / (timeRange.end - timeRange.start)) * 100}%`,
                    height: '100%',
                    backgroundColor: block.color,
                    borderRadius: 2,
                    opacity: selectedBlock === null || selectedBlock === index ? 1 : 0.5,
                    transition: 'opacity 0.2s',
                  }}
                />
              ))}
            </Box>

            {/* Interactive slider */}
            {selectedBlock !== null && (
              <Slider
                value={[timeBlocks[selectedBlock].start, timeBlocks[selectedBlock].end]}
                onChange={(_, newValue) => handleBlockChange(selectedBlock, newValue as number[])}
                min={timeRange.start}
                max={timeRange.end}
                step={0.5}
                valueLabelDisplay="auto"
                valueLabelFormat={formatTime}
                sx={{
                  position: 'absolute',
                  top: 20,
                  left: 0,
                  right: 0,
                  '& .MuiSlider-track': {
                    backgroundColor: 'transparent',
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: 'transparent',
                  },
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                    backgroundColor: '#fff',
                    border: '2px solid currentColor',
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0 0 0 8px rgba(25, 118, 210, 0.16)',
                    },
                  },
                  '& .MuiSlider-mark': {
                    display: 'none',
                  },
                  '& .MuiSlider-markLabel': {
                    display: 'none',
                  },
                }}
              />
            )}
          </Box>
        </Box>

        {/* Add Category Dialog */}
        <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                autoFocus
                fullWidth
                label="Category Name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="color"
                label="Color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: newCategory.color,
                          border: '1px solid rgba(0, 0, 0, 0.23)',
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddCategory}
              variant="contained"
              disabled={!newCategory.name.trim()}
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>

        {/* Time Range Settings Dialog */}
        <Dialog open={isSettingsDialogOpen} onClose={() => setIsSettingsDialogOpen(false)}>
          <DialogTitle>Configure Time Range</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Start Time (hours)"
                    value={tempTimeRange.start}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0 && value < tempTimeRange.end) {
                        setTempTimeRange({ ...tempTimeRange, start: value });
                      }
                    }}
                    inputProps={{ step: 0.5, min: 0, max: 23.5 }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="End Time (hours)"
                    value={tempTimeRange.end}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value > tempTimeRange.start && value <= 24) {
                        setTempTimeRange({ ...tempTimeRange, end: value });
                      }
                    }}
                    inputProps={{ step: 0.5, min: 0.5, max: 24 }}
                  />
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsSettingsDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAcceptTimeRange}
              variant="contained"
              disabled={tempTimeRange.end <= tempTimeRange.start || tempTimeRange.end - tempTimeRange.start < 1}
            >
              Accept
            </Button>
          </DialogActions>
        </Dialog>

        {/* Error Message */}
        <Snackbar
          open={!!errorMessage}
          autoHideDuration={3000}
          onClose={() => setErrorMessage(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        </Snackbar>
      </Paper>

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskDialogOpen} onClose={() => setIsAddTaskDialogOpen(false)}>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="Task Description"
              value={newTask.text}
              onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Category"
              value={newTask.category}
              onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
              SelectProps={{
                native: true,
                inputProps: {
                  'aria-label': 'Select task category'
                }
              }}
            >
              <option value="">Select a category</option>
              {timeBlocks.map((block) => (
                <option key={block.category} value={block.category}>
                  {block.category}
                </option>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddTaskDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddTask}
            variant="contained"
            disabled={!newTask.text.trim() || !newTask.category}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TimeAllocationSlider; 