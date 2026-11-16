// Fuentes autoalojadas: sin peticiones a Google Fonts (no se comparte la IP del visitante con terceros).
import '@fontsource-variable/dm-sans/opsz.css';
import '@fontsource-variable/fraunces/opsz.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/app/providers';
import { router } from '@/app/router';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </AppProviders>
  </StrictMode>,
);
