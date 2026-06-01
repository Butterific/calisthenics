import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme, CssBaseline, useMediaQuery } from '@mui/material'
import './index.css'
import App from './App.jsx'

function ThemedApp() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');

  const md3Theme = useMemo(() => {
    const mode = prefersDark ? 'dark' : 'light';
    const tokens = {
      bg: mode === 'dark' ? '#0f1116' : '#f7f6fb',
      surface: mode === 'dark' ? '#151821' : '#ffffff',
      surfaceAlt: mode === 'dark' ? '#1b202c' : '#f4f1f8',
      textMain: mode === 'dark' ? '#e5e7eb' : '#1f2937',
      textMuted: mode === 'dark' ? '#a1a1aa' : '#4b5563',
      border: mode === 'dark' ? 'rgba(148, 163, 184, 0.18)' : 'rgba(15, 23, 42, 0.12)',
      shadow: mode === 'dark'
        ? '0 18px 40px rgba(0, 0, 0, 0.45)'
        : '0 18px 40px rgba(15, 23, 42, 0.12)',
      accent: mode === 'dark' ? '#9d7bff' : '#6750A4',
    };

    return createTheme({
      palette: {
        mode,
        primary: { main: tokens.accent, contrastText: '#FFFFFF' },
        secondary: { main: mode === 'dark' ? '#7c85a3' : '#625B71', contrastText: '#FFFFFF' },
        background: { default: tokens.bg, paper: tokens.surface },
        text: { primary: tokens.textMain, secondary: tokens.textMuted },
        error: { main: '#B3261E' }
      },
      typography: {
        fontFamily: '"Roboto Flex", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
        h1: { fontSize: '3.5rem', fontWeight: 500, lineHeight: 1.1, letterSpacing: '-0.5px' },
        h3: { fontSize: '2.25rem', fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.3px' },
        h5: { fontWeight: 600, letterSpacing: '-0.2px' },
        h6: { fontWeight: 600, letterSpacing: '-0.2px' },
        subtitle1: { fontSize: '1.05rem', lineHeight: 1.7 },
        button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.2px' },
      },
      shape: {
        borderRadius: 18,
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: tokens.bg,
            }
          }
        },
        MuiButton: {
          styleOverrides: {
            root: { borderRadius: '9999px', padding: '10px 24px' },
            contained: { boxShadow: tokens.shadow },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              border: `1px solid ${tokens.border}`,
              boxShadow: tokens.shadow,
              backgroundColor: tokens.surface,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              border: `1px solid ${tokens.border}`,
              boxShadow: tokens.shadow,
              backgroundColor: tokens.surface,
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 12,
                backgroundColor: tokens.surfaceAlt,
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: tokens.border,
              },
              '& .MuiOutlinedInput-root.Mui-focused': {
                boxShadow: `0 0 0 3px ${mode === 'dark' ? 'rgba(157, 123, 255, 0.2)' : 'rgba(103, 80, 164, 0.16)'}`,
              },
            }
          }
        },
        MuiLinearProgress: {
          styleOverrides: {
            root: { height: 8, borderRadius: 9999 },
            bar: { borderRadius: 9999 },
          }
        }
      },
    });
  }, [prefersDark]);

  return (
    <ThemeProvider theme={md3Theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemedApp />
  </StrictMode>,
)
