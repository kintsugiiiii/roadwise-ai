import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import StandaloneWorkbenchApp from './StandaloneWorkbenchApp';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StandaloneWorkbenchApp />
  </StrictMode>,
);
