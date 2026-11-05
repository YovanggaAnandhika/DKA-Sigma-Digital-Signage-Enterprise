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
        className="iot-tabs"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className="iot-tab"
            >
              <Icon size={19} strokeWidth={2.2} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
