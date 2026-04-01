import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import frontendLogger from './utils/frontendLogger';
import './styles/global.css';

window.onerror = (message, source, lineno, colno, error) => {
  frontendLogger.error('Error JavaScript no capturado', {
    message,
    source,
    lineno,
    colno,
    stack: error?.stack,
  });
};

window.addEventListener('unhandledrejection', (event) => {
  frontendLogger.error('Promesa rechazada sin catch', {
    reason: event.reason?.message || String(event.reason),
  });
});

frontendLogger.info('Aplicación iniciada', {
  loadTimeMs: Math.round(performance.now()),
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
