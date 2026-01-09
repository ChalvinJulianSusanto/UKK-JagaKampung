import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

// Don't use GoogleOAuthProvider to avoid One Tap completely
// Google Sign-In will be handled manually in Login.jsx

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
