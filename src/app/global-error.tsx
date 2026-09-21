'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global layout error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'sans-serif', background: '#fafaf9', color: '#1c1917', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '420px', width: '90%', background: '#ffffff', border: '1px solid #e7e5e4', borderRadius: '24px', padding: '32px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 8px 0' }}>System Reload Required</h2>
          <p style={{ fontSize: '13px', color: '#78716c', margin: '0 0 24px 0', lineHeight: 1.5 }}>
            A transient network or update error occurred. Please click below to reload the application.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{ padding: '10px 20px', borderRadius: '12px', background: '#e59819', color: '#ffffff', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{ padding: '10px 20px', borderRadius: '12px', background: '#f5f5f4', color: '#1c1917', border: '1px solid #e7e5e4', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
