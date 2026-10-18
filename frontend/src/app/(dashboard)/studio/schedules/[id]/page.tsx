'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Schedule, Device, DisplayGroup } from '@/lib/services';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Layers,
  Monitor,
  Folder,
  Trash2,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CalendarDays
} from 'lucide-react';

export default function ViewSchedulePage() {
  const params = useParams() as { id: string };
  const router = useRouter();

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [assignedDevices, setAssignedDevices] = useState<Device[]>([]);
  const [assignedGroups, setAssignedGroups] = useState<DisplayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      const [sched, devRes, grpRes] = await Promise.all([
        api.getSchedule(params.id),
        api.getDevices({ limit: 1000 }),
        api.getDisplayGroups({ limit: 1000 }),
      ]);
      setSchedule(sched);

      const allDevices = devRes.data || [];
      const devMatches = allDevices.filter(
        (d: any) => d.scheduleId === params.id || d.schedule_id === params.id
      );
      setAssignedDevices(devMatches);

      const allGroups = grpRes.data || [];
      const grpMatches = allGroups.filter(
        (g: any) => g.scheduleId === params.id || g.schedule_id === params.id
      );
      setAssignedGroups(grpMatches);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat jadwal tayang');
      router.push('/studio/schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleData();
  }, [params.id]);

  const handleDelete = async () => {
    if (!schedule) return;
    if (!confirm(`Hapus jadwal tayang "${schedule.name}"?`)) return;

    try {
      setDeleting(true);
      await api.deleteSchedule(schedule.id);
      router.push('/studio/schedules');
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus jadwal');
      setDeleting(false);
    }
  };

  const dayNames = [
    { num: 1, label: 'Senin' },
    { num: 2, label: 'Selasa' },
    { num: 3, label: 'Rabu' },
    { num: 4, label: 'Kamis' },
    { num: 5, label: 'Jumat' },
    { num: 6, label: 'Sabtu' },
    { num: 7, label: 'Minggu' },
  ];

  if (loading || !schedule) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat detail jadwal tayang...</span>
      </div>
    );
  }

  const primaryEvent = schedule.eventsList && schedule.eventsList.length > 0 ? schedule.eventsList[0] : null;
  const activeDays = primaryEvent?.daysOfWeek
    ? primaryEvent.daysOfWeek.split(',').map((d) => Number(d.trim()))
    : [1, 2, 3, 4, 5, 6, 7];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/studio/schedules" className="btn btn-outline" style={{ padding: '8px' }} title="Kembali ke Penjadwalan">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
                {schedule.name}
              </h1>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  color: 'var(--primary-400)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
              >
                Prioritas: {primaryEvent?.priority ?? 0}
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
              {schedule.description || 'Jadwal tayang konten digital signage'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={fetchScheduleData} className="btn btn-outline" style={{ padding: '8px 12px' }} title="Muat Ulang">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleDelete}
            className="btn btn-outline"
            style={{ padding: '8px 14px', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '6px' }}
            disabled={deleting}
            title="Hapus Jadwal"
          >
            <Trash2 size={15} />
            <span>Hapus Jadwal</span>
          </button>
        </div>
      </div>

      {/* Main Full-Width Card: Detail Konten & Waktu Tayang */}
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
                  href={`/studio/layouts/data/${primaryEvent.layoutId}`}
                  className="btn btn-outline"
                  style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}
                >
                  <span>Preview</span>
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

      {/* Perangkat & Layar Target (Full Width) */}
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
