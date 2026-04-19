import React from 'react';
import ReactDOM from 'react-dom/client';
import { initializeRuntime } from './app/runtime';
import App from './App';
import './styles.css?v=20260419b';
import './styles-website.css?v=20260417k';

initializeRuntime();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
