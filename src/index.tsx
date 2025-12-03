import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser');
    // `worker.start()` returns a Promise that resolves
    // once the Service Worker is up and running.
    return worker.start({
       // Suppress warnings about unhandled requests
      onUnhandledRequest: 'bypass',
    });
  }
  return Promise.resolve();
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

enableMocking().then(() => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
});