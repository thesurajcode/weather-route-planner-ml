import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// ✅ Import the Provider we just created
import { AppProvider } from './context/AppContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ✅ Wrap the App so every component can access the 'brain' */}
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);