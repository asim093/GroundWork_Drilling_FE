import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { ToastContainer } from 'react-toastify';
import '@mantine/core/styles.css';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import { theme } from './theme.js';
import { AuthProvider } from './context/AuthContext.jsx';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
      <ToastContainer position="bottom-right" newestOnTop />
    </MantineProvider>
  </StrictMode>
);
