import { CssBaseline, Container, ThemeProvider, createTheme, Box } from '@mui/material';
import TimeAllocationSlider from './components/TimeAllocationSlider';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Container sx={{ flex: 1, py: 4 }}>
          {/* Your main content can go here */}
        </Container>
        <TimeAllocationSlider />
      </Box>
    </ThemeProvider>
  );
}

export default App;
