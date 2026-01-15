import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AuthCallback from "./components/AuthCallback";

const pathname = window.location.pathname;
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {pathname.startsWith("/auth/callback") ? <AuthCallback /> : <App />}
  </React.StrictMode>
);