import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { App } from './App.js';
import { ThemeProvider } from './design-system/ThemeProvider.js';
import { AppProvider } from './context/AppContext.js';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
