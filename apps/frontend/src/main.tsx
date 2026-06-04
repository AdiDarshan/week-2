import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { App } from './components/App';
import { AuthProvider } from './hooks/useAuth';
createRoot(document.querySelector<HTMLDivElement>('#app')!).render(
  <StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
  </StrictMode>
);
