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
  Alert,
  Snackbar,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Settings as SettingsIcon } from '@mui/icons-material';

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

interface TimeAllocationSliderProps {
  timeBlocks: TimeBlock[];
  onTimeBlocksChange: (blocks: TimeBlock[]) => void;
}

const TimeAllocationSlider: React.FC<TimeAllocationSliderProps> = ({ timeBlocks, onTimeBlocksChange }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>({ start: 0, end: 24 });
  const [tempTimeRange, setTempTimeRange] = useState<TimeRange>({ start: 0, end: 24 });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#000000' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draggingHandle, setDraggingHandle] = useState<number | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragStartTime, setDragStartTime] = useState<number>(0);

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = Math.floor(hour % 12) || 12;
    const minutes = Math.round((hour % 1) * 60);
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${displayHour}:${formattedMinutes} ${period}`;
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

    // Filter out blocks that are completely outside the new range
    const newTimeBlocks = timeBlocks.filter(block => {
      // Keep blocks that overlap with the new range
      return !(block.end <= newRange.start || block.start >= newRange.end);
    }).map(block => {
      // Adjust the block's start and end times to fit within the new range
      return {
        ...block,
        start: Math.max(newRange.start, block.start),
        end: Math.min(newRange.end, block.end)
      };
    });

    // Remove blocks that are too small (less than 30 minutes)
    const filteredBlocks = newTimeBlocks.filter(block => block.end - block.start >= 0.5);

    // If we removed blocks, show a message
    if (filteredBlocks.length < timeBlocks.length) {
      setErrorMessage('Some time blocks were removed as they were outside or too small for the new time range');
    }

    // If no blocks remain, create a default block
    if (filteredBlocks.length === 0) {
      filteredBlocks.push({
        start: newRange.start,
        end: newRange.end,
        category: 'Default',
        color: '#2196f3'
      });
    } else {
      // Ensure the first block starts at the new range start
      filteredBlocks[0] = {
        ...filteredBlocks[0],
        start: newRange.start
      };

      // Ensure the last block ends at the new range end
      filteredBlocks[filteredBlocks.length - 1] = {
        ...filteredBlocks[filteredBlocks.length - 1],
        end: newRange.end
      };
    }

    onTimeBlocksChange(filteredBlocks);
    setTimeRange(newRange);
    setIsSettingsDialogOpen(false);
  };

  const handleMouseDown = (index: number, event: React.MouseEvent) => {
    setDraggingHandle(index);
    setDragStartX(event.clientX);
    setDragStartTime(timeBlocks[index].end);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (draggingHandle === null) return;

    const container = event.currentTarget.getBoundingClientRect();
    const totalWidth = container.width;
    const pixelsPerHour = totalWidth / (timeRange.end - timeRange.start);
    
    const deltaX = event.clientX - dragStartX;
    const deltaHours = deltaX / pixelsPerHour;
    const newTime = Math.max(0, Math.min(24, dragStartTime + deltaHours));
    
    // Round to nearest 30 minutes
    const roundedTime = Math.round(newTime * 2) / 2;

    // Ensure minimum block duration of 30 minutes
    const prevBlock = timeBlocks[draggingHandle];
    const nextBlock = timeBlocks[draggingHandle + 1];
    
    if (roundedTime - prevBlock.start < 0.5 || nextBlock.end - roundedTime < 0.5) {
      return;
    }

    const newTimeBlocks = [...timeBlocks];
    newTimeBlocks[draggingHandle] = {
      ...prevBlock,
      end: roundedTime
    };
    newTimeBlocks[draggingHandle + 1] = {
      ...nextBlock,
      start: roundedTime
    };

    onTimeBlocksChange(newTimeBlocks);
  };

  const handleMouseUp = () => {
    setDraggingHandle(null);
  };

  const handleAcceptTimeRange = () => {
    handleTimeRangeChange(tempTimeRange);
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
      onTimeBlocksChange([...timeBlocks, newBlock]);
      setNewCategory({ name: '', color: '#000000' });
      setIsAddDialogOpen(false);
    }
  };

  const handleRemoveCategory = (index: number) => {
    if (timeBlocks.length <= 1) {
      setErrorMessage('Cannot remove the last category');
      return;
    }

    const newTimeBlocks = [...timeBlocks];
    const removedBlock = newTimeBlocks[index];
    
    // If this is the first block, extend the next block to the start
    if (index === 0) {
      newTimeBlocks[1] = {
        ...newTimeBlocks[1],
        start: timeRange.start
      };
    }
    // If this is the last block, extend the previous block to the end
    else if (index === timeBlocks.length - 1) {
      newTimeBlocks[index - 1] = {
        ...newTimeBlocks[index - 1],
        end: timeRange.end
      };
    }
    // If this is a middle block, distribute its time to adjacent blocks
    else {
      const timeToDistribute = removedBlock.end - removedBlock.start;
      const halfTime = timeToDistribute / 2;
      
      newTimeBlocks[index - 1] = {
        ...newTimeBlocks[index - 1],
        end: newTimeBlocks[index - 1].end + halfTime
      };
      newTimeBlocks[index + 1] = {
        ...newTimeBlocks[index + 1],
        start: newTimeBlocks[index + 1].start - halfTime
      };
    }

    // Remove the block
    newTimeBlocks.splice(index, 1);
    onTimeBlocksChange(newTimeBlocks);
  };

  // Calculate time markers based on the time range
  const timeMarkers: number[] = [];
  const range = timeRange.end - timeRange.start;
  const interval = Math.ceil(range / 4); // Show 4 markers
  for (let i = timeRange.start; i <= timeRange.end; i += interval) {
    timeMarkers.push(i);
  }
  if (!timeMarkers.includes(timeRange.end)) {
    timeMarkers.push(timeRange.end);
  }

  // Helper function to check if a time aligns with markers
  const isTimeAlignedWithMarker = (time: number) => {
    return timeMarkers.some(marker => Math.abs(marker - time) < 0.01);
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        maxWidth: 1200, 
        mx: 'auto', 
        mt: 'auto',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: '16px 16px 0 0',
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        backdropFilter: 'blur(10px)',
        color: 'white',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: 'white' }}>
          Daily Time Allocation
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setIsSettingsDialogOpen(true)}
            sx={{ 
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Settings
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddDialogOpen(true)}
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0',
              }
            }}
          >
            Add Category
          </Button>
        </Box>
      </Box>

      <Box 
        sx={{ 
          position: 'relative', 
          mb: 4,
          userSelect: 'none',
          cursor: draggingHandle !== null ? 'col-resize' : 'default'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Time markers */}
        <Box sx={{ position: 'relative', height: 24, mb: 1 }}>
          {timeMarkers.map((time, index) => (
            <Box
              key={index}
              sx={{
                position: 'absolute',
                left: `${((time - timeRange.start) / (timeRange.end - timeRange.start)) * 100}%`,
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '1px',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  mb: 0.5,
                }}
              >
                {formatTime(time)}
              </Typography>
              <Box
                sx={{
                  width: '1px',
                  height: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                }}
              />
            </Box>
          ))}
        </Box>

        {/* Time blocks */}
        <Box sx={{ position: 'relative', height: 40 }}>
          {timeBlocks.map((block, index) => (
            <React.Fragment key={index}>
              <Box
                sx={{
                  position: 'absolute',
                  left: `${((block.start - timeRange.start) / (timeRange.end - timeRange.start)) * 100}%`,
                  width: `${((block.end - block.start) / (timeRange.end - timeRange.start)) * 100}%`,
                  height: 40,
                  backgroundColor: block.color,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'white',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    px: 1,
                    pointerEvents: 'none',
                    maxWidth: 'calc(100% - 16px)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {block.category}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveCategory(index)}
                  sx={{
                    position: 'absolute',
                    right: 4,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'white',
                    opacity: 0.7,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    padding: '2px',
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
              
              {/* Handle between blocks */}
              {index < timeBlocks.length - 1 && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: `${((block.end - timeRange.start) / (timeRange.end - timeRange.start)) * 100}%`,
                    top: 0,
                    width: '24px',
                    height: '100%',
                    cursor: 'col-resize',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'translateX(-50%)',
                    '&:hover::before': {
                      content: '""',
                      position: 'absolute',
                      width: '4px',
                      height: '100%',
                      backgroundColor: 'white',
                      opacity: 0.9,
                      borderRadius: '2px',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      width: '4px',
                      height: '100%',
                      backgroundColor: draggingHandle === index ? 'white' : 'rgba(255, 255, 255, 0.7)',
                      opacity: draggingHandle === index ? 1 : 0.7,
                      borderRadius: '2px',
                    },
                    '&:hover::after': {
                      content: '""',
                      position: 'absolute',
                      width: '20px',
                      height: '32px',
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      borderRadius: '10px',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      width: '16px',
                      height: '28px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                    },
                  }}
                  onMouseDown={(e) => handleMouseDown(index, e)}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      top: -24,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      opacity: draggingHandle === index ? 1 : 0.7,
                      transition: 'opacity 0.2s',
                      pointerEvents: 'none',
                      zIndex: 1,
                      display: isTimeAlignedWithMarker(block.end) ? 'none' : 'block',
                    }}
                  >
                    {formatTime(block.end)}
                  </Typography>
                </Box>
              )}
            </React.Fragment>
          ))}
        </Box>
      </Box>

      {/* Add Category Dialog */}
      <Dialog 
        open={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1e1e1e',
            color: 'white',
          }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>Add New Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            variant="outlined"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
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
          <TextField
            margin="dense"
            label="Color"
            type="color"
            fullWidth
            variant="outlined"
            value={newCategory.color}
            onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
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
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setIsAddDialogOpen(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddCategory}
            variant="contained"
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

      {/* Settings Dialog */}
      <Dialog 
        open={isSettingsDialogOpen} 
        onClose={() => setIsSettingsDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1e1e1e',
            color: 'white',
          }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>Time Range Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ color: 'white', mb: 1 }}>Start Time</Typography>
            <TextField
              type="number"
              value={tempTimeRange.start}
              onChange={(e) => setTempTimeRange({ ...tempTimeRange, start: Number(e.target.value) })}
              inputProps={{ min: 0, max: 23, step: 1 }}
              sx={{
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
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ color: 'white', mb: 1 }}>End Time</Typography>
            <TextField
              type="number"
              value={tempTimeRange.end}
              onChange={(e) => setTempTimeRange({ ...tempTimeRange, end: Number(e.target.value) })}
              inputProps={{ min: 1, max: 24, step: 1 }}
              sx={{
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setIsSettingsDialogOpen(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAcceptTimeRange}
            variant="contained"
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0',
              }
            }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
      >
        <Alert 
          onClose={() => setErrorMessage(null)} 
          severity="error"
          sx={{ 
            width: '100%',
            backgroundColor: '#d32f2f',
            color: 'white',
            '& .MuiAlert-icon': {
              color: 'white',
            },
          }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default TimeAllocationSlider; 