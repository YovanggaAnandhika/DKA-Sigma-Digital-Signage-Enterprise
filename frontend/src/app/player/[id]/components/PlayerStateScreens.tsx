'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function PlayerLoadingScreen({ deviceId }: { deviceId: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0a0d14',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(59, 130, 246, 0.2)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Menghubungkan Player Display...</h2>
      <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>ID: {deviceId}</p>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function PlayerErrorScreen({ error }: { error: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0a0d14',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      <AlertTriangle size={36} color="#f43f5e" />
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f43f5e' }}>Koneksi Display Player Gagal</h2>
      <p style={{ maxWidth: '500px', color: '#94a3b8', fontSize: '0.875rem' }}>{error}</p>
      <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
        Pastikan perangkat sudah dipairing dan memiliki Layout atau Jadwal aktif di CMS.
      </p>
    </div>
  );
}
