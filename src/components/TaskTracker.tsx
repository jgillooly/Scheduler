import React, { useState, useRef, useEffect } from 'react';
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

interface TaskTrackerProps {
  tasks: Task[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (task: Task) => void;
  onUpdateTimeBlock: (id: string, updates: { start: number; end: number }) => void;
  onDeleteTimeBlock: (id: string) => void;
  onAddTimeBlock: (taskId: string, start: number, end: number) => void;
  timeBlocks: Array<{
    start: number;
    end: number;
    category: string;
    color: string;
  }>;
}

const TaskTracker: React.FC<TaskTrackerProps> = ({
  tasks,
  onUpdateTask,
  onDeleteTask,
  onAddTask,
  onUpdateTimeBlock,
  onDeleteTimeBlock,
  onAddTimeBlock,
  timeBlocks,
}) => {
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 400, height: 600 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === headerRef.current || headerRef.current?.contains(e.target as Node)) {
      e.preventDefault(); // Prevent text selection
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault(); // Prevent text selection
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep window within viewport bounds
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - size.height;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    } else if (isResizing) {
      e.preventDefault(); // Prevent text selection
      const newWidth = Math.max(300, resizeStart.width + (e.clientX - resizeStart.x));
      const newHeight = Math.max(400, resizeStart.height + (e.clientY - resizeStart.y));
      setSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging || isResizing) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      handleMouseUp(e);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStart]);

  // Handle resizing
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  const handleAddTask = () => {
    if (newTaskName.trim() && newTaskCategory) {
      const task: Task = {
        id: Date.now().toString(),
        text: newTaskName.trim(),
        completed: false,
        category: newTaskCategory
      };
      onAddTask(task);
      setNewTaskName('');
      setNewTaskCategory('');
      setIsAddTaskDialogOpen(false);
    }
  };

  const handleToggleTask = (taskId: string) => {
    onUpdateTask(taskId, { completed: !tasks.find(task => task.id === taskId)?.completed });
  };

  const handleDeleteTask = (taskId: string) => {
    onDeleteTask(taskId);
  };

  return (
    <Paper
      ref={containerRef}
      elevation={3}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        overflow: 'hidden',
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        backdropFilter: 'blur(10px)',
        color: 'white',
        borderRadius: '8px',
      }}
    >
      <Box
        ref={headerRef}
        sx={{
          padding: '12px',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          cursor: 'move',
          userSelect: 'none',
        }}
      >
        <Typography variant="h6" sx={{ color: 'white', m: 0 }}>Task Tracker</Typography>
      </Box>

      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
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
      </Box>

      <Box
        ref={resizeHandleRef}
        sx={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: '20px',
          height: '20px',
          cursor: 'nwse-resize',
        }}
        onMouseDown={handleResizeStart}
      >
        <Box
          sx={{
            position: 'absolute',
            right: '4px',
            bottom: '4px',
            width: '8px',
            height: '8px',
            borderRight: '2px solid rgba(255, 255, 255, 0.3)',
            borderBottom: '2px solid rgba(255, 255, 255, 0.3)',
          }}
        />
      </Box>

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
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
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
              value={newTaskCategory}
              onChange={(e) => setNewTaskCategory(e.target.value)}
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
            disabled={!newTaskName.trim() || !newTaskCategory}
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