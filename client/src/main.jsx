import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthSessionProvider } from './hooks/SessionContext.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthSessionProvider>
      <App />
    </AuthSessionProvider>
  </StrictMode>,
);