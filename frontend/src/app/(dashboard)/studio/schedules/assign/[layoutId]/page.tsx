'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, Check, Clock3, Layers, Monitor, Users, X } from 'lucide-react';
import { api, Device, DisplayGroup, Layout } from '@/lib/services';
import type { Schedule } from '@/lib/services/studio/schedule.types';

const weekDays = [
  { value: 1, label: 'Senin', short: 'Sen' },
  { value: 2, label: 'Selasa', short: 'Sel' },
  { value: 3, label: 'Rabu', short: 'Rab' },
  { value: 4, label: 'Kamis', short: 'Kam' },
  { value: 5, label: 'Jumat', short: 'Jum' },
  { value: 6, label: 'Sabtu', short: 'Sab' },
  { value: 7, label: 'Minggu', short: 'Min' },
];

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function weekdayForDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const weekday = new Date(year, month - 1, day).getDay();
  return weekday === 0 ? 7 : weekday;
}

export default function AssignSchedulePage() {
  const params = useParams() as { layoutId: string };
  const router = useRouter();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [groups, setGroups] = useState<DisplayGroup[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scheduleName, setScheduleName] = useState('');
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [dateMode, setDateMode] = useState<'range' | 'unlimited'>('range');
  const [startDate, setStartDate] = useState(() => localDateString(new Date()));
  const [endDate, setEndDate] = useState(() => localDateString(new Date()));
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');
  const [recurring, setRecurring] = useState(true);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [layoutData, deviceData, groupData, scheduleData] = await Promise.all([
        api.getLayout(params.layoutId),
        api.getDevices({ limit: 1000 }),
        api.getDisplayGroups({ limit: 1000 }),
        api.getSchedules({ limit: 1000 }),
      ]);
      setLayout(layoutData);
      setScheduleName((current) => current || `Rundown: ${layoutData.name}`);
      setDevices(deviceData.data);
      setGroups(groupData.data);
      setSchedules(scheduleData.data);
    } catch (loadError) {
      console.error('Failed to load rundown assignment data:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data rundown.');
    } finally {
      setLoading(false);
    }
  }, [params.layoutId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedScheduleIds = useMemo(() => {
    const groupsById = new Map(groups.map((group) => [group.id, group]));
    const deviceScheduleIds = devices
      .filter((device) => deviceIds.includes(device.id))
      .map((device) => {
        const group = groupsById.get(device.displayGroupId);
        return device.scheduleId || group?.scheduleId || group?.schedule_id || '';
      });
    const groupScheduleIds = groups
      .filter((group) => groupIds.includes(group.id))
      .map((group) => group.scheduleId || group.schedule_id || '');
    return [...new Set([...deviceScheduleIds, ...groupScheduleIds].filter(Boolean))];
  }, [devices, groups, deviceIds, groupIds]);
  const currentSchedule = schedules.find((schedule) => schedule.id === selectedScheduleIds[0]);

  const toggle = (id: string, values: string[], setValues: (next: string[]) => void) => {
    setValues(values.includes(id) ? values.filter((value) => value !== id) : [...values, id]);
  };

  const toggleDay = (day: number) => {
    setDays((current) => current.includes(day)
      ? current.length > 1 ? current.filter((value) => value !== day) : current
      : [...current, day].sort((a, b) => a - b));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!deviceIds.length && !groupIds.length) {
      setError('Pilih setidaknya satu player atau kelompok player.');
      return;
    }
    if (dateMode === 'range' && endDate < startDate) {
      setError('Tanggal akhir harus sama dengan atau sesudah tanggal mulai.');
      return;
    }
    if (selectedScheduleIds.length > 1) {
      setError('Target yang dipilih sudah terhubung ke rundown berbeda. Pilih target dengan rundown yang sama atau pisahkan penugasannya.');
      return;
    }

    try {
      setSaving(true);
      await api.pushLayoutToSchedule({
        layoutId: params.layoutId,
        scheduleId: selectedScheduleIds[0],
        scheduleName: currentSchedule?.name || scheduleName.trim() || `Rundown: ${layout?.name || 'Layout'}`,
        startTime: `${startTime}:00`,
        endTime: `${endTime}:00`,
        startDate,
        endDate: dateMode === 'unlimited' ? undefined : (recurring ? endDate : startDate),
        daysOfWeek: (recurring ? days : [weekdayForDate(startDate)]).join(','),
        deviceIds,
        displayGroupIds: groupIds,
      });
      router.push('/studio/schedules');
    } catch (saveError) {
      console.error('Failed to save rundown assignment:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan rundown.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="card-elevated" style={{ padding: 28, color: 'var(--text-secondary)' }}>Memuat data rundown...</div>;
  }

  if (!layout) {
    return (
      <div className="card-elevated" style={{ padding: 28 }}>
        <p style={{ color: 'var(--accent-rose)' }}>{error || 'Layout tidak ditemukan.'}</p>
        <Link href="/studio/layouts/data" className="btn btn-outline">Kembali ke Layout</Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Link
          href="/studio/layouts/data"
          className="btn btn-outline"
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
          aria-label="Kembali ke layout"
          title="Kembali ke Layout"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 800 }}>Buat Rundown Operasional</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Atur penayangan <strong style={{ color: 'var(--text-secondary)' }}>{layout.name}</strong> ke player atau kelompok player.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 20, alignItems: 'start', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="card-elevated" style={{ padding: 20 }}>
            <h2 style={{ margin: '0 0 14px', color: 'var(--text-primary)', fontSize: '1rem' }}>Jadwal dan periode</h2>
            <label style={{ display: 'block', marginBottom: 14, color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
              Nama rundown
              <input className="form-input" value={currentSchedule?.name || scheduleName} onChange={(e) => setScheduleName(e.target.value)} required maxLength={150} disabled={selectedScheduleIds.length === 1} style={{ display: 'block', marginTop: 6 }} />
              {selectedScheduleIds.length === 1 && <span style={{ display: 'block', marginTop: 5, color: 'var(--text-muted)', fontSize: '0.72rem' }}>Event akan ditambahkan ke rundown yang sudah ada.</span>}
            </label>

            {/* Selector: Rentang Tanggal vs Unlimited */}
            <div style={{ marginBottom: 14 }}>
              <span style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                Masa Berlaku Penayangan
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setDateMode('range')}
                  className="btn btn-outline"
                  style={{
                    padding: '7px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderColor: dateMode === 'range' ? 'var(--primary-500)' : 'var(--border-subtle)',
                    backgroundColor: dateMode === 'range' ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                    color: dateMode === 'range' ? 'var(--primary-400)' : 'var(--text-secondary)',
                  }}
                >
                  Tetapkan Mulai & Selesai
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode('unlimited')}
                  className="btn btn-outline"
                  style={{
                    padding: '7px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderColor: dateMode === 'unlimited' ? 'var(--primary-500)' : 'var(--border-subtle)',
                    backgroundColor: dateMode === 'unlimited' ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                    color: dateMode === 'unlimited' ? 'var(--primary-400)' : 'var(--text-secondary)',
                  }}
                >
                  Tanpa Batas Akhir (Unlimited)
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                {dateMode === 'unlimited' ? 'Mulai dari tanggal' : 'Dari tanggal'}
                <input type="date" className="form-input" value={startDate} onChange={(e) => {
                  const nextStartDate = e.target.value;
                  setStartDate(nextStartDate);
                  if (dateMode === 'range' && recurring && endDate < nextStartDate) setEndDate(nextStartDate);
                  if (dateMode === 'range' && !recurring) setEndDate(e.target.value);
                }} required style={{ display: 'block', marginTop: 6 }} />
              </label>

              {dateMode === 'range' ? (
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                  Sampai tanggal
                  <input type="date" className="form-input" value={recurring ? endDate : startDate} min={startDate} disabled={!recurring} onChange={(e) => setEndDate(e.target.value)} required style={{ display: 'block', marginTop: 6 }} />
                </label>
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                  Sampai tanggal
                  <div
                    style={{
                      marginTop: 6,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px dashed rgba(59, 130, 246, 0.35)',
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      color: 'var(--primary-400)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                    }}
                  >
                    Selamanya (Unlimited / Tanpa Batas Akhir)
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                Jam mulai
                <input type="time" className="form-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} required style={{ display: 'block', marginTop: 6 }} />
              </label>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                Jam selesai
                <input type="time" className="form-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} required style={{ display: 'block', marginTop: 6 }} />
              </label>
            </div>

            <label style={{ display: 'flex', gap: 9, alignItems: 'center', marginTop: 16, color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
              <input type="checkbox" checked={recurring} onChange={(e) => {
                setRecurring(e.target.checked);
                if (!e.target.checked && dateMode === 'range') setEndDate(startDate);
              }} />
              Ulangi pada hari tertentu setiap minggu
            </label>
            {recurring && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
                {weekDays.map((day) => {
                  const active = days.includes(day.value);
                  return (
                    <button key={day.value} type="button" onClick={() => toggleDay(day.value)} aria-pressed={active} className="btn btn-outline" style={{
                      padding: '7px 12px',
                      color: active ? 'var(--primary-400)' : 'var(--text-secondary)',
                      borderColor: active ? 'var(--primary-500)' : 'var(--border-subtle)',
                      background: active ? 'rgba(59,130,246,.12)' : undefined,
                    }}>
                      {active && <Check size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />}{day.short}
                    </button>
                  );
                })}
              </div>
            )}
            <p style={{ margin: '10px 0 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              Waktu mengikuti zona waktu lokal player. {dateMode === 'unlimited' ? 'Jadwal akan terus aktif selamanya mengikuti hari dan jam yang dipilih.' : 'Jadwal berulang hanya dibuat pada hari terpilih di dalam rentang tanggal.'}
            </p>
          </section>

          <section className="card-elevated" style={{ padding: 20 }}>
            <h2 style={{ margin: '0 0 12px', color: 'var(--text-primary)', fontSize: '1rem' }}>Target player</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 700 }}>
              <Monitor size={16} /> Player individual
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
              {devices.map((device) => (
                <label key={device.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: 10, border: '1px solid var(--border-subtle)', borderRadius: 9, color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                  <input type="checkbox" checked={deviceIds.includes(device.id)} onChange={() => toggle(device.id, deviceIds, setDeviceIds)} />
                  <span>{device.name}</span>
                  <span style={{ marginLeft: 'auto', color: device.isOnline ? 'var(--accent-emerald)' : 'var(--text-muted)', fontSize: '0.7rem' }}>{device.isOnline ? 'Online' : 'Offline'}</span>
                </label>
              ))}
              {!devices.length && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Belum ada player terdaftar.</span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 7, margin: '18px 0 8px', color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 700 }}>
              <Users size={16} /> Kelompok player (Display Group)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
              {groups.map((group) => (
                <label key={group.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: 10, border: '1px solid var(--border-subtle)', borderRadius: 9, color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                  <input type="checkbox" checked={groupIds.includes(group.id)} onChange={() => toggle(group.id, groupIds, setGroupIds)} />
                  <span>{group.name}</span>
                </label>
              ))}
              {!groups.length && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Belum ada kelompok player.</span>}
            </div>
          </section>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="card-elevated" style={{ padding: 20 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px', color: 'var(--text-primary)', fontSize: '1rem' }}>
              <CalendarDays size={17} /> Ringkasan penugasan
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {devices.filter((device) => deviceIds.includes(device.id)).map((device) => (
                <span key={device.id} style={{ padding: '5px 8px', borderRadius: 999, background: 'rgba(59,130,246,.12)', color: 'var(--primary-400)', fontSize: '0.72rem' }}>
                  <Monitor size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />{device.name}
                </span>
              ))}
              {groups.filter((group) => groupIds.includes(group.id)).map((group) => (
                <span key={group.id} style={{ padding: '5px 8px', borderRadius: 999, background: 'rgba(16,185,129,.12)', color: 'var(--accent-emerald)', fontSize: '0.72rem' }}>
                  <Users size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />{group.name}
                </span>
              ))}
              {!deviceIds.length && !groupIds.length && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Belum ada target dipilih.</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              <Clock3 size={15} /> {startTime}–{endTime}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '8px 0 0' }}>
              {dateMode === 'unlimited'
                ? `Mulai ${startDate} (Tanpa Batas Akhir / Unlimited)`
                : `${startDate} sampai ${recurring ? endDate : startDate}`}
              {recurring ? ` · ${days.map((value) => weekDays[value - 1].short).join(', ')}` : ' · Satu kali'}
            </p>
            {selectedScheduleIds.length === 1 && (
              <p style={{ color: 'var(--accent-emerald)', fontSize: '0.76rem', margin: '12px 0 0' }}>
                Event akan ditambahkan ke rundown {currentSchedule?.name || 'yang sudah terpasang'} agar jadwal target tetap terjaga.
              </p>
            )}
            {selectedScheduleIds.length > 1 && (
              <p style={{ color: 'var(--accent-rose)', fontSize: '0.76rem', margin: '12px 0 0' }}>
                Target terpilih memakai rundown berbeda. Pisahkan penugasan agar jadwal yang sudah ada tidak tertimpa.
              </p>
            )}
          </section>

          {error && (
            <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 9, color: 'var(--accent-rose)', background: 'rgba(244,63,94,.1)', fontSize: '0.82rem' }}>
              <X size={16} style={{ flexShrink: 0 }} />{error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
            <Link href="/studio/schedules" className="btn btn-outline">Batal</Link>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Layers size={15} />{saving ? 'Menyimpan...' : 'Simpan ke Rundown'}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}
