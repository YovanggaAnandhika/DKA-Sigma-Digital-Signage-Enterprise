'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, TableProperties, ShieldAlert, Layers, ArrowRight } from 'lucide-react';
import EmergencyBroadcastModal from '@/components/ui/EmergencyBroadcastModal';

interface SchedulesLayoutProps {
  children: React.ReactNode;
}

export default function SchedulesLayout({ children }: SchedulesLayoutProps) {
  const pathname = usePathname();
  const normalizedPath = pathname?.replace(/\/$/, '') || '';
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  // Tabs only show on the main root tab index pages
  const isRootTabPage = [
    '/studio/schedules',
    '/studio/schedules/calendar',
    '/studio/schedules/table',
  ].includes(normalizedPath);

  if (!isRootTabPage) {
    return <>{children}</>;
  }

  const tabs = [
    {
      id: 'calendar',
      label: 'Kalender Rundown',
      href: '/studio/schedules/calendar',
      icon: CalendarDays,
    },
    {
      id: 'table',
      label: 'Daftar Tabel Jadwal',
      href: '/studio/schedules/table',
      icon: TableProperties,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: '16px',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              color: 'var(--primary-400)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CalendarDays size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
              Rundown Operasional
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
              Kalender jadwal tayang player dan kelompok display.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setEmergencyOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--accent-rose)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 700,
              transition: 'all 0.2s ease',
            }}
            title="Siarkan Peringatan Darurat Langsung ke Display Player"
          >
            <ShieldAlert size={15} />
            <span>Siaran Darurat</span>
          </button>

          <Link
            href="/studio/layouts/data"
            className="btn btn-primary"
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Layers size={16} />
            <span>Pilih Layout untuk Ditayangkan</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <nav className="dashboard-tabs" aria-label="Navigasi rundown operasional">
        {tabs.map((tab) => {
          const isActive = normalizedPath === tab.href || (normalizedPath === '/studio/schedules' && tab.id === 'calendar');
          const Icon = tab.icon;

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

      {/* Tab Content */}
      {children}

      {/* Global Emergency Broadcast Modal for Schedules */}
      <EmergencyBroadcastModal
        isOpen={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
      />
    </div>
  );
}

