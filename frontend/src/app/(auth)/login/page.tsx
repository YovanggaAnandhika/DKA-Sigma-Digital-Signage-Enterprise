'use client';

import React, { useState } from 'react';
import { Monitor } from 'lucide-react';
import LoginLeftPanel from './components/LoginLeftPanel';
import LoginForm from './components/LoginForm';

export default function LoginPage() {
  const [isExiting, setIsExiting] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
        backgroundColor: '#fff',
      }}
    >
      {/* ══ LEFT PANEL (65%) ══ */}
      <LoginLeftPanel />

      {/* ══ RIGHT PANEL (35%) ══ */}
      <LoginForm setIsExiting={setIsExiting} />

      {/* ══ EXIT OVERLAY ══ */}
      {isExiting && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', width: '96px', height: '96px', borderRadius: '50%', border: '4px solid transparent', borderTopColor: '#1d4ed8', borderRightColor: '#34d399', borderBottomColor: '#60a5fa', borderLeftColor: '#c084fc', animation: 'spin 1s linear infinite' }} />
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Monitor size={28} color="#1d4ed8" />
            </div>
          </div>
          <p style={{ marginTop: '28px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', color: '#1d4ed8', textTransform: 'uppercase' }}>
            Memuat Dashboard
          </p>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
          `}</style>
        </div>
      )}
    </div>
  );
}
