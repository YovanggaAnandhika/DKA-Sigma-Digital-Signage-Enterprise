'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, Check, ChevronDown, Clock3, Layers, Monitor, Users, X } from 'lucide-react';
import { api, Device, DisplayGroup, Layout } from '@/lib/services';
import type { Schedule } from '@/lib/services/studio/schedule.types';

const ALL_DAYS = [
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

// Modern On/Off Slider Switch
function ModernSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      style={{
        width: 36,
        height: 20,
        borderRadius: 9999,
        backgroundColor: checked ? 'var(--primary-500)' : 'var(--border-subtle)',
        padding: 2,
        transition: 'background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        flexShrink: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: checked ? '0 0 10px rgba(59, 130, 246, 0.35)' : 'none',
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          transform: checked ? 'translateX(16px)' : 'translateX(0px)',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        }}
      />
    </div>
  );
}

function DayMultiSelectAutocomplete({
  selectedDays,
  onChange,
}: {
  selectedDays: number[];
  onChange: (days: number[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableDays = ALL_DAYS.filter((d) => !selectedDays.includes(d.value));
  const filteredDays = availableDays.filter((d) =>
    d.label.toLowerCase().includes(query.toLowerCase())
  );

  const addDay = (val: number) => {
    onChange([...selectedDays, val].sort((a, b) => a - b));
    setQuery('');
  };

  const removeDay = (val: number) => {
    if (selectedDays.length <= 1) return;
    onChange(selectedDays.filter((d) => d !== val));
  };

  const selectAll = () => {
    onChange([1, 2, 3, 4, 5, 6, 7]);
    setQuery('');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div
        className="form-input"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          minHeight: 42,
          cursor: 'text',
        }}
        onClick={() => setOpen(true)}
      >
        {selectedDays.map((val) => {
          const item = ALL_DAYS.find((d) => d.value === val);
          if (!item) return null;
          return (
            <span
              key={val}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 8px',
                borderRadius: 6,
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: 'var(--primary-400)',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              {item.label}
              {selectedDays.length > 1 && (
                <button
                  type="button"
                  aria-label={`Hapus ${item.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDay(val);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </span>
          );
        })}

        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={selectedDays.length === 0 ? 'Pilih hari tayang...' : selectedDays.length === 7 ? '' : 'Ketik untuk tambah hari...'}
          style={{
            flex: 1,
            minWidth: 120,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          {selectedDays.length < 7 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                selectAll();
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px 6px',
                cursor: 'pointer',
                color: 'var(--primary-400)',
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            >
              Semua Hari
            </button>
          )}
          <ChevronDown size={14} color="var(--text-muted)" />
        </div>
      </div>

      {open && availableDays.length > 0 && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 50,
            maxHeight: 200,
            overflowY: 'auto',
            padding: 4,
            borderRadius: 8,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 10px 24px -8px rgba(0,0,0,0.3)',
          }}
        >
          {filteredDays.length === 0 && (
            <div style={{ padding: '8px 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Tidak ada hari cocok
            </div>
          )}
          {filteredDays.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => addDay(d.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '7px 10px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                backgroundColor: 'transparent',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
  const [targetTab, setTargetTab] = useState<'group' | 'single'>('group');
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
      {/* Header */}
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
          <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.45rem', fontWeight: 800 }}>Buat Rundown Operasional</h1>
          <p style={{ margin: '3px 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Atur penayangan <strong style={{ color: 'var(--text-secondary)' }}>{layout.name}</strong> ke player atau kelompok player.
          </p>
        </div>
      </div>

      {/* 1 Single Unified Card */}
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <div
          className="card-elevated"
          style={{
            padding: '24px 28px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
          }}
        >
          {/* Section 1: Nama Rundown */}
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>
              Nama Rundown
              <input
                className="form-input"
                value={currentSchedule?.name || scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                required
                maxLength={150}
                disabled={selectedScheduleIds.length === 1}
                style={{ display: 'block', marginTop: 6 }}
              />
              {selectedScheduleIds.length === 1 && (
                <span style={{ display: 'block', marginTop: 5, color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  Event akan ditambahkan ke rundown yang sudah ada.
                </span>
              )}
            </label>
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-subtle)' }} />

          {/* Section 2: Masa Berlaku */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.92rem', fontWeight: 700 }}>
                Masa Berlaku
              </span>

              {/* Segmented Switch: Tetapkan Mulai & Selesai vs Tanpa Batas Akhir */}
              <div
                style={{
                  display: 'inline-flex',
                  padding: 3,
                  borderRadius: 10,
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setDateMode('range')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: 7,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: dateMode === 'range' ? 'var(--primary-500)' : 'transparent',
                    color: dateMode === 'range' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.16s ease',
                  }}
                >
                  Tetapkan Mulai & Selesai
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode('unlimited')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: 7,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: dateMode === 'unlimited' ? 'var(--primary-500)' : 'transparent',
                    color: dateMode === 'unlimited' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.16s ease',
                  }}
                >
                  Tanpa Batas Akhir
                </button>
              </div>
            </div>

            {/* Tanggal Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                {dateMode === 'unlimited' ? 'Mulai Dari Tanggal' : 'Dari Tanggal'}
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => {
                    const nextStartDate = e.target.value;
                    setStartDate(nextStartDate);
                    if (dateMode === 'range' && recurring && endDate < nextStartDate) setEndDate(nextStartDate);
                    if (dateMode === 'range' && !recurring) setEndDate(e.target.value);
                  }}
                  required
                  style={{ display: 'block', marginTop: 6 }}
                />
              </label>

              {dateMode === 'range' ? (
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                  Sampai Tanggal
                  <input
                    type="date"
                    className="form-input"
                    value={recurring ? endDate : startDate}
                    min={startDate}
                    disabled={!recurring}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    style={{ display: 'block', marginTop: 6 }}
                  />
                </label>
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                  Sampai Tanggal
                  <div
                    style={{
                      marginTop: 6,
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px dashed rgba(59, 130, 246, 0.35)',
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      color: 'var(--primary-400)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    Selamanya
                  </div>
                </div>
              )}
            </div>

            {/* Jam Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                Jam Mulai
                <input
                  type="time"
                  className="form-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  style={{ display: 'block', marginTop: 6 }}
                />
              </label>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                Jam Selesai
                <input
                  type="time"
                  className="form-input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  style={{ display: 'block', marginTop: 6 }}
                />
              </label>
            </div>

            {/* Repeat Weekly with Modern On/Off Switch */}
            <div style={{ marginTop: 4 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: recurring ? 10 : 0,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  const nextVal = !recurring;
                  setRecurring(nextVal);
                  if (!nextVal && dateMode === 'range') setEndDate(startDate);
                }}
              >
                <ModernSwitch
                  checked={recurring}
                  onChange={(nextVal) => {
                    setRecurring(nextVal);
                    if (!nextVal && dateMode === 'range') setEndDate(startDate);
                  }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Ulangi setiap minggu
                </span>
              </div>

              {recurring && (
                <DayMultiSelectAutocomplete
                  selectedDays={days}
                  onChange={setDays}
                />
              )}
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-subtle)' }} />

          {/* Section 3: Target Player */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.92rem', fontWeight: 700 }}>
                Target Player
              </span>

              {/* Tabs: Kelompok vs Single */}
              <div
                style={{
                  display: 'inline-flex',
                  padding: 3,
                  borderRadius: 10,
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setTargetTab('group')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: 7,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: targetTab === 'group' ? 'var(--primary-500)' : 'transparent',
                    color: targetTab === 'group' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.16s ease',
                  }}
                >
                  <Users size={14} />
                  <span>Kelompok</span>
                  {groupIds.length > 0 && (
                    <span style={{ padding: '0 6px', borderRadius: 999, fontSize: '0.68rem', backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff' }}>
                      {groupIds.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTargetTab('single')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: 7,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: targetTab === 'single' ? 'var(--primary-500)' : 'transparent',
                    color: targetTab === 'single' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.16s ease',
                  }}
                >
                  <Monitor size={14} />
                  <span>Single</span>
                  {deviceIds.length > 0 && (
                    <span style={{ padding: '0 6px', borderRadius: 999, fontSize: '0.68rem', backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff' }}>
                      {deviceIds.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Tab Kelompok Cards with Modern Switch */}
            {targetTab === 'group' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                {groups.map((group) => {
                  const checked = groupIds.includes(group.id);
                  return (
                    <div
                      key={group.id}
                      onClick={() => toggle(group.id, groupIds, setGroupIds)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        border: `1px solid ${checked ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                        borderRadius: 10,
                        backgroundColor: checked ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.16s ease',
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: checked ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface-elevated)',
                          color: checked ? 'var(--primary-400)' : 'var(--text-muted)',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Users size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 650, fontSize: '0.84rem', color: checked ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {group.name}
                        </div>
                      </div>
                      <ModernSwitch
                        checked={checked}
                        onChange={() => toggle(group.id, groupIds, setGroupIds)}
                      />
                    </div>
                  );
                })}
                {!groups.length && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Belum ada kelompok player.</span>}
              </div>
            )}

            {/* Tab Single Cards with Modern Switch */}
            {targetTab === 'single' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                {devices.map((device) => {
                  const checked = deviceIds.includes(device.id);
                  return (
                    <div
                      key={device.id}
                      onClick={() => toggle(device.id, deviceIds, setDeviceIds)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        border: `1px solid ${checked ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                        borderRadius: 10,
                        backgroundColor: checked ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.16s ease',
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: checked ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface-elevated)',
                          color: checked ? 'var(--primary-400)' : 'var(--text-muted)',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Monitor size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 650, fontSize: '0.84rem', color: checked ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {device.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: device.isOnline ? 'var(--accent-emerald)' : 'var(--text-muted)', marginTop: 2 }}>
                          {device.isOnline ? 'Online' : 'Offline'}
                        </div>
                      </div>
                      <ModernSwitch
                        checked={checked}
                        onChange={() => toggle(device.id, deviceIds, setDeviceIds)}
                      />
                    </div>
                  );
                })}
                {!devices.length && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Belum ada player terdaftar.</span>}
              </div>
            )}
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-subtle)' }} />

          {/* Section 4: Ringkasan Penugasan & Aksi Bawah */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            {/* Live Summary Chips */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Clock3 size={15} style={{ color: 'var(--primary-400)' }} />
                <span>{startTime}–{endTime}</span>
              </div>
              <span>•</span>
              <div>
                {dateMode === 'unlimited'
                  ? `Mulai ${startDate} · Tanpa Batas Akhir`
                  : `${startDate} sampai ${recurring ? endDate : startDate}`}
              </div>
              <span>•</span>
              <div>
                {recurring
                  ? days.length === 7 ? 'Setiap Hari' : days.map((val) => ALL_DAYS[val - 1]?.short || val).join(', ')
                  : 'Satu kali'}
              </div>
              <span>•</span>
              <div style={{ fontWeight: 600, color: (deviceIds.length > 0 || groupIds.length > 0) ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                {deviceIds.length + groupIds.length} Target Dipilih
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link href="/studio/schedules" className="btn btn-outline" style={{ padding: '8px 16px' }}>
                Batal
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: 7 }}
              >
                <Layers size={15} />
                <span>{saving ? 'Menyimpan...' : 'Simpan ke Rundown'}</span>
              </button>
            </div>
          </div>

          {selectedScheduleIds.length > 1 && (
            <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, backgroundColor: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)', fontSize: '0.8rem' }}>
              <X size={15} style={{ flexShrink: 0 }} />
              <span>Target terpilih memakai rundown berbeda. Pisahkan penugasan agar jadwal yang sudah ada tidak tertimpa.</span>
            </div>
          )}

          {error && (
            <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 9, color: 'var(--accent-rose)', background: 'rgba(244,63,94,.1)', fontSize: '0.82rem' }}>
              <X size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
