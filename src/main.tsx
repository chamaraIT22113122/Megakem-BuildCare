import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import AdminDashboard from './Admin.tsx'
import './index.css'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { Toaster } from 'sonner'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#003366',
      light: '#4A90A4',
      dark: '#001a33',
      lighter: '#e6f2ff'
    } as any,
    secondary: {
      main: '#A4D233',
      light: '#c5e066',
      dark: '#7fa326',
      lighter: '#f5fce8'
    } as any,
    success: {
      main: '#10b981',
      lighter: '#d1fae5',
      light: '#34d399',
      dark: '#059669'
    } as any,
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontFamily: 'Outfit, Inter, sans-serif' },
    h2: { fontFamily: 'Outfit, Inter, sans-serif' },
    h3: { fontFamily: 'Outfit, Inter, sans-serif' },
    h4: { fontFamily: 'Outfit, Inter, sans-serif' },
    h5: { fontFamily: 'Outfit, Inter, sans-serif' },
    h6: { fontFamily: 'Outfit, Inter, sans-serif' },
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-center" richColors expand={false} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
