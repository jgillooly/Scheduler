import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: string;
}

interface TimeBlock {
  start: number;
  end: number;
  category: string;
  color: string;
}

interface TaskTrackerProps {
  timeBlocks: TimeBlock[];
}

const TaskTracker: React.FC<TaskTrackerProps> = ({ timeBlocks }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ text: '', category: '' });

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

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2,
        width: '33%',
        position: 'fixed',
        top: 0,
        left: 0,
        height: 'calc(100vh - 200px)',
        borderRadius: 0,
        borderRight: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1,
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        backdropFilter: 'blur(10px)',
        color: 'white',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: 'white' }}>Tasks</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddTaskDialogOpen(true)}
          sx={{
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0',
            }
          }}
        >
          Add Task
        </Button>
      </Box>

      <List sx={{ 
        flex: 1, 
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
          },
        },
      }}>
        {tasks.map((task) => (
          <React.Fragment key={task.id}>
            <ListItem>
              <Checkbox
                edge="start"
                checked={task.completed}
                onChange={() => handleToggleTask(task.id)}
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-checked': {
                    color: '#1976d2',
                  },
                }}
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
                  color: task.completed ? 'rgba(255, 255, 255, 0.5)' : 'white',
                  '& .MuiListItemText-secondary': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  }
                }}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleDeleteTask(task.id)}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
          </React.Fragment>
        ))}
      </List>

      {/* Add Task Dialog */}
      <Dialog 
        open={isAddTaskDialogOpen} 
        onClose={() => setIsAddTaskDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1e1e1e',
            color: 'white',
          }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>Add New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Description"
            fullWidth
            variant="outlined"
            value={newTask.text}
            onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1976d2',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          />
          <FormControl
            fullWidth
            margin="dense"
            variant="outlined"
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1976d2',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiSelect-icon': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          >
            <InputLabel id="category-select-label">Category</InputLabel>
            <Select
              labelId="category-select-label"
              value={newTask.category}
              onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
              label="Category"
            >
              <MenuItem value="">
                <em>Select a category</em>
              </MenuItem>
              {timeBlocks.map((block) => (
                <MenuItem 
                  key={block.category} 
                  value={block.category}
                  sx={{
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(25, 118, 210, 0.2)',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.3)',
                      },
                    },
                  }}
                >
                  {block.category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setIsAddTaskDialogOpen(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddTask}
            variant="contained"
            disabled={!newTask.text.trim() || !newTask.category}
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0',
              }
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TaskTracker; 