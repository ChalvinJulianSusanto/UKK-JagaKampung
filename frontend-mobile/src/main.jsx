import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './styles/index.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '77872697185-pufpqcvkfi4db4dvq2o9hvkgcvb78tjj.apps.googleusercontent.com';

// Disable Google One Tap to prevent "Login sebagai..." prompt
const handleScriptLoad = () => {
  if (window.google?.accounts?.id) {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      auto_select: false,
    });
    // Disable auto-select and One Tap
    window.google.accounts.id.disableAutoSelect();
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider
      clientId={GOOGLE_CLIENT_ID}
      onScriptLoadSuccess={handleScriptLoad}
      onScriptLoadError={() => console.error('Google script load error')}
    >
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
