import React from 'react';
import ReactDOM from 'react-dom/client';
import Home from './pages/Home'; // We use Home as the container now
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("❌ Critical Error: Could not find 'root' element in index.html");
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Home />
    </React.StrictMode>,
  );
}