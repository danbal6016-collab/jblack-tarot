import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// [CRITICAL FIX] Attempt to override global fetch to enforce 'no-referrer' policy safely.
// This prevents 'API_KEY_HTTP_REFERRER_BLOCKED' errors.
// Wrapped in try-catch to avoid crashes in environments where window.fetch is read-only.
try {
  const originalFetch = window.fetch;
  // Use Object.defineProperty to attempt overriding if direct assignment fails
  Object.defineProperty(window, 'fetch', {
    value: async (input: RequestInfo | URL, init?: RequestInit) => {
      return originalFetch(input, {
        ...init,
        referrerPolicy: 'no-referrer',
      });
    },
    writable: true,
    configurable: true 
  });
} catch (e) {
  console.warn("Could not patch window.fetch to enforce no-referrer:", e);
  // Fallback: Rely on <meta name="referrer" content="no-referrer" /> in index.html
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);