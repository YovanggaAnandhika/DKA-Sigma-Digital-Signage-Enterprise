'use client';

import React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Layers,
  ExternalLink,
  Clock,
  Calendar,
  Monitor,
  Folder,
  AlertCircle,
} from 'lucide-react';
import { useScheduleDetail } from '../context/ScheduleDetailContext';

export default function ScheduleOverviewTab() {
  const {
    primaryEvent,
    dayNames,
    activeDays,
    assignedDevices,
    assignedGroups,
  } = useScheduleDetail();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Main Card: Detail Konten & Waktu Tayang */}
      <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <CalendarDays size={20} style={{ color: 'var(--primary-400)' }} />
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Informasi Konten & Konfigurasi Tayang
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Layout Content */}
          <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Layout yang Ditayangkan
            </span>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: 'var(--primary-400)',
                  }}
                >
                  <Layers size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {primaryEvent?.layoutName || 'Layout Template'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    ID: {primaryEvent?.layoutId || '-'}
                  </div>
                </div>
              </div>

              {primaryEvent?.layoutId && (
                <Link
                  href={`/studio/layouts/data/${primaryEvent.layoutId}/edit`}
                  className="btn btn-outline"
                  style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}
                >
                  <span>Buka Editor Layout</span>
                  <ExternalLink size={12} />
                </Link>
              )}
            </div>
          </div>

          {/* Jam Tayang Aktif */}
          <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Jam Tayang Aktif
            </span>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-emerald)',
                }}
              >
                <Clock size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.125rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                  {primaryEvent?.startTime || '00:00:00'} — {primaryEvent?.endTime || '23:59:59'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Konten hanya diputar pada rentang jam lokal di atas
                </div>
              </div>
            </div>
          </div>

          {/* Periode Kalender */}
          <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Periode Tayang Kalender
            </span>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--accent-amber, #f59e0b)',
                }}
              >
                <Calendar size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  {primaryEvent?.startDate || primaryEvent?.endDate
                    ? `${primaryEvent.startDate || 'Mulai'} s/d ${primaryEvent.endDate || 'Selesai'}`
                    : 'Berlaku Selamanya'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {primaryEvent?.startDate ? 'Terjadwal dengan batas tanggal' : 'Tanpa batas tanggal (selalu aktif)'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hari Tayang Row */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Hari Tayang Aktif
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {dayNames.map((d) => {
              const isActive = activeDays.includes(d.num);
              return (
                <div
                  key={d.num}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: isActive ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                    backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface-elevated)',
                    color: isActive ? 'var(--primary-400)' : 'var(--text-muted)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.875rem',
                  }}
                >
                  {d.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Perangkat & Layar Target */}
      <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Monitor size={20} style={{ color: 'var(--primary-400)' }} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Perangkat & Layar yang Menerima Jadwal Ini
            </h2>
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {assignedDevices.length} Layar · {assignedGroups.length} Grup Layar
          </span>
        </div>

        {assignedDevices.length === 0 && assignedGroups.length === 0 ? (
          <div
            style={{
              padding: '24px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px dashed var(--border-subtle)',
              textAlign: 'center',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertCircle size={22} style={{ opacity: 0.6 }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              Tidak ada perangkat yang saat ini terikat ke jadwal ini.
            </span>
            <span style={{ fontSize: '0.75rem' }}>
              Untuk menayangkan layout pada perangkat baru, gunakan tombol "Push Jadwal" di menu Layouts.
            </span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {/* Display Groups */}
            {assignedGroups.map((g) => (
              <div
                key={g.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Folder size={18} style={{ color: 'var(--accent-amber, #f59e0b)' }} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {g.name}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Grup Layar</div>
                </div>
              </div>
            ))}

            {/* Individual Displays */}
            {assignedDevices.map((d) => (
              <div
                key={d.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Monitor size={18} style={{ color: 'var(--primary-400)' }} />
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {d.name}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    {d.screenWidth}×{d.screenHeight} px · {d.timezone || 'Asia/Jakarta'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
