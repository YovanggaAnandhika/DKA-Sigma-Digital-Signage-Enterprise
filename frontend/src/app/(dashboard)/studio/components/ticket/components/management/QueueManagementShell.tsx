'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Database, History, RefreshCw } from 'lucide-react';

function TabLoadingSkeleton({ label }: { label: string }) {
  return (
    <div
      className="card-elevated"
      style={{
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        color: 'var(--text-muted)',
      }}
    >
      <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '0.875rem' }}>{label}</span>
    </div>
  );
}

const TabDataTab = dynamic(() => import('./TabDataTab'), {
  ssr: false,
  loading: () => <TabLoadingSkeleton label="Memuat data antrian..." />,
});

const TabRiwayatTab = dynamic(() => import('./TabRiwayatTab'), {
  ssr: false,
  loading: () => <TabLoadingSkeleton label="Memuat riwayat antrian..." />,
});

interface QueueManagementShellProps {
  activeTab: 'data' | 'riwayat';
}

export default function QueueManagementShell({ activeTab }: QueueManagementShellProps) {
  const tabs = [
    {
      id: 'data',
      label: 'Data',
      href: '/studio/components/ticket/data',
      icon: Database,
    },
    {
      id: 'riwayat',
      label: 'Riwayat',
      href: '/studio/components/ticket/riwayat',
      icon: History,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      <nav className="dashboard-tabs" aria-label="Navigasi manajemen antrean">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="dashboard-tab"
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={19} strokeWidth={2.2} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ width: '100%' }}>
        {activeTab === 'data' && <TabDataTab />}
        {activeTab === 'riwayat' && <TabRiwayatTab />}
      </div>
    </div>
  );
}
