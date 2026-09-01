import { useState } from 'react';

type VerificationGateProps = {
  onVerified: () => void;
};

export function VerificationGate({ onVerified }: VerificationGateProps) {
  const [denied, setDenied] = useState(false);

  function handleNo() {
    setDenied(true);
  }

  function handleYes() {
    setDenied(false);
    onVerified();
  }

  return (
    <main className="app-shell verification-shell">
      <section className="composer verification" aria-labelledby="verification-heading">
        <p className="eyebrow">Verification</p>
        <h1 id="verification-heading">
          Was <span lang="he" dir="rtl">ירמיהו הנביא</span> born to two parents?
        </h1>

        {denied ? (
          <p className="verification__denied" role="alert">
            Access denied. You may answer the question again.
          </p>
        ) : (
          <p className="verification__hint">Answer to continue.</p>
        )}

        <div className="verification__actions">
          <button type="button" className="verification__button verification__button--yes" onClick={handleYes}>
            Yes
          </button>
          <button type="button" className="verification__button verification__button--no" onClick={handleNo}>
            No
          </button>
        </div>
      </section>
    </main>
  );
}
