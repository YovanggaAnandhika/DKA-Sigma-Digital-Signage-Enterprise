'use client';

import React, { useState } from 'react';
import LoginLeftPanel from './components/LoginLeftPanel';
import LoginForm from './components/LoginForm';
import DashboardLoadingOverlay from '@/components/DashboardLoadingOverlay';

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
      {isExiting && <DashboardLoadingOverlay />}
    </div>
  );
}
