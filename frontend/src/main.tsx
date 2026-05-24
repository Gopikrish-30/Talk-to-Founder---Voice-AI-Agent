import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  // Fallback: log a clear warning instead of throwing a runtime error
  // if the 'root' element is missing in the host page.
  // This prevents crashes in environments that don't include the DOM (e.g., extensions).
  // In normal usage, index.html provides the `root` element.
  // eslint-disable-next-line no-console
  console.warn("Root element '#root' not found — skipping React mount.");
}
