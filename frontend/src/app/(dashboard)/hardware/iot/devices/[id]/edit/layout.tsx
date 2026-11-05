'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { Activity, Settings2 } from 'lucide-react';

export default function IotDeviceEditLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams() as { id: string };
  const pathname = usePathname();
  const basePath = `/hardware/iot/devices/${id}/edit`;
  const tabs = [
    { href: basePath, label: 'Data', icon: Settings2 },
    { href: `${basePath}/telemetry`, label: 'Telemetri', icon: Activity },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <nav
        aria-label="Halaman perangkat IoT"
        className="card-elevated"
        style={{
          padding: '5px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          overflowX: 'auto',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '7px',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                backgroundColor: active ? 'var(--primary-600)' : 'transparent',
                color: active ? '#fff' : 'var(--text-secondary)',
                fontWeight: active ? 600 : 500,
                fontSize: '0.8125rem',
              }}
            >
              <Icon size={15} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
