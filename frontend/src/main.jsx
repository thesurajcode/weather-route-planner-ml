import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// ✅ IMPORT THE PROVIDER
// Make sure this path is correct based on your folder structure
import { AppProvider } from './context/AppContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ✅ WRAP THE APP IN THE PROVIDER */}
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
);