'use client';

import React from 'react';
import { Radio } from 'lucide-react';

export default function DashboardServiceStatus() {
  return (
    <div className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Radio size={18} style={{ color: 'var(--accent-emerald)' }} />
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Layanan Streaming & Telemetri
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Envoy gRPC-Web Ingress
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              Port 8080 • HTTP/1.1 & HTTP/2 Bridging
            </span>
          </div>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: 'var(--accent-emerald)',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            TERHUBUNG
          </span>
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Rust Tonic gRPC Service
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              Port 50051 • Hardware, Studio, IAM Modules
            </span>
          </div>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: 'var(--accent-emerald)',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            AKTIF
          </span>
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              PostgreSQL Database Pool
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              Port 54321 • SQLx Migrations & RBAC Seeder
            </span>
          </div>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: 'var(--accent-emerald)',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            TERSEDIA
          </span>
        </div>
      </div>
    </div>
  );
}
