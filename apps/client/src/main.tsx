import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { App } from './App.js';
import { ThemeProvider } from './design-system/ThemeProvider.js';
import { AppProvider } from './context/AppContext.js';
import { ToastProvider } from './components/Toast.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AppProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AppProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);

/* Register service worker for offline support
   Disable in E2E to avoid cached API responses breaking deterministic tests. */
if ('serviceWorker' in navigator && !(window as any).__LEARNFLOW_E2E__) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[LearnFlow] Service worker registration failed', err);
    });
  });
}
