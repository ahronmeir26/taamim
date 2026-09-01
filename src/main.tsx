import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { VerificationGate } from './components/VerificationGate';
import './styles.css';

const VERIFIED_STORAGE_KEY = 'taamim-verified';

function Root() {
  const [verified, setVerified] = useState(() => sessionStorage.getItem(VERIFIED_STORAGE_KEY) === 'yes');

  if (!verified) {
    return (
      <VerificationGate
        onVerified={() => {
          sessionStorage.setItem(VERIFIED_STORAGE_KEY, 'yes');
          setVerified(true);
        }}
      />
    );
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
