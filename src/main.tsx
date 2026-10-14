import { useMobileKeyboard } from './hooks/useMobileKeyboard'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'

function MobileApp() {
  useMobileKeyboard();
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <MobileApp />
    </GlobalErrorBoundary>
  </StrictMode>,
)
