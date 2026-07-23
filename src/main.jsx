import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { AptProvider } from './context/AptContext.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AptProvider>
        <App />
      </AptProvider>
    </AuthProvider>
  </React.StrictMode>,
)
