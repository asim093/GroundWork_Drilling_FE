import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { ToastContainer } from 'react-toastify';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import { theme } from './theme.js';
import { AuthProvider } from './context/AuthContext.jsx';
import { PageTitleProvider } from './context/PageTitleContext.jsx';
import App from './App.jsx';

// On mobile, opening the on-screen keyboard resizes the visual viewport without
// always firing a window "resize" event that popover/dropdown positioning logic
// listens for. Forward it so any open dropdown re-anchors instead of drifting.
if (typeof window !== 'undefined' && window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    window.dispatchEvent(new Event('resize'));
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider>
          <PageTitleProvider>
            <App />
          </PageTitleProvider>
        </AuthProvider>
      </BrowserRouter>
      <ToastContainer position="bottom-right" newestOnTop />
    </MantineProvider>
  </StrictMode>
);
