import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import './index.css'
import App from './App.jsx'

const md3Theme = createTheme({
  palette: {
    primary: { main: '#6750A4', contrastText: '#FFFFFF' },
    secondary: { main: '#625B71', contrastText: '#FFFFFF' },
    background: { default: '#FEF7FF', paper: '#F3EDF7' },
    error: { main: '#B3261E' }
  },
  typography: {
    fontFamily: '"Roboto Flex", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '3.5rem', fontWeight: 400, lineHeight: 1.2 },
    h3: { fontSize: '2rem', fontWeight: 400, lineHeight: 1.2 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: {
    borderRadius: 16, // MD3 Large shape for cards/surfaces
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: '9999px', padding: '10px 24px' }, // Fully rounded for MD3
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation3: { boxShadow: 'none', backgroundColor: '#F3EDF7' }, // Surface Container
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '4px', // MD3 extra small
          }
        }
      }
    }
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={md3Theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
