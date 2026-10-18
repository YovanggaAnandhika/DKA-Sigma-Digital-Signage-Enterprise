'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, Layout, Device, DisplayGroup } from '@/lib/services';
import { Pagination } from '@/components/ui/Pagination';
import {
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Send,
  Calendar,
  Clock,
  Monitor,
  Folder,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function LayoutsDataPage() {
  const router = useRouter();
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Push to Schedule modal state
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const [selectedLayoutForPush, setSelectedLayoutForPush] = useState<Layout | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [groups, setGroups] = useState<DisplayGroup[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushSuccessMsg, setPushSuccessMsg] = useState<string | null>(null);

  // Push form fields
  const [scheduleName, setScheduleName] = useState('');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('23:59:59');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getLayouts({ search, page, limit });
      setLayouts(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load layouts:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus template layout "${name}"?`)) return;
    try {
      await api.deleteLayout(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus layout');
    }
  };

  const handleOpenPushModal = async (layout: Layout) => {
    setSelectedLayoutForPush(layout);
    setScheduleName(`Tayang: ${layout.name}`);
    setStartTime('00:00:00');
    setEndTime('23:59:59');
    setSelectedDays([1, 2, 3, 4, 5, 6, 7]);
    setSelectedDeviceIds([]);
    setSelectedGroupIds([]);
    setPushSuccessMsg(null);
    setPushModalOpen(true);

    try {
      setLoadingTargets(true);
      const [devRes, grpRes] = await Promise.all([
        api.getDevices({ limit: 1000 }),
        api.getDisplayGroups({ limit: 1000 }),
      ]);
      setDevices(devRes.data || []);
      setGroups(grpRes.data || []);
    } catch (err) {
      console.error('Failed to load devices/groups for push:', err);
    } finally {
      setLoadingTargets(false);
    }
  };

  const handleToggleDevice = (id: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleToggleGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleToggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.length > 1
          ? prev.filter((d) => d !== day)
          : prev
        : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handlePushSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLayoutForPush) return;
    if (selectedDeviceIds.length === 0 && selectedGroupIds.length === 0) {
      alert('Pilih setidaknya satu Layar (Display) atau Grup Layar.');
      return;
    }

    try {
      setPushing(true);
      const daysStr = selectedDays.join(',');
      const res = await api.pushLayoutToSchedule({
        layoutId: selectedLayoutForPush.id,
        scheduleName: scheduleName.trim() || `Tayang: ${selectedLayoutForPush.name}`,
        startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
        endTime: endTime.length === 5 ? `${endTime}:00` : endTime,
        daysOfWeek: daysStr,
        priority: 0,
        deviceIds: selectedDeviceIds,
        displayGroupIds: selectedGroupIds,
      });

      setPushSuccessMsg(res.message || 'Layout berhasil dipush ke penjadwalan perangkat target.');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mempush layout ke penjadwalan');
    } finally {
      setPushing(false);
    }
  };

  const dayNames = [
    { num: 1, label: 'Sen' },
    { num: 2, label: 'Sel' },
    { num: 3, label: 'Rab' },
    { num: 4, label: 'Kam' },
    { num: 5, label: 'Jum' },
    { num: 6, label: 'Sab' },
    { num: 7, label: 'Min' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Cari template layout berdasarkan nama..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="form-input"
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={loadData} className="btn btn-outline" style={{ padding: '8px 12px' }} title="Muat Ulang">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link href="/studio/layouts/data/create" className="btn btn-primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} />
            <span>Buat Layout Baru</span>
          </Link>
        </div>
      </div>

      {/* Layout Table */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>NAMA TEMPLATE LAYOUT</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>DIMENSI CANVAS</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>ORIENTASI</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>JUMLAH LAYER LAYAR</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>DIBUAT PADA</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <span>Memuat template layout...</span>
                  </td>
                </tr>
              ) : layouts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Belum ada template layout tersimpan.
                  </td>
                </tr>
              ) : (
                layouts.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => router.push(`/studio/layouts/data/${l.id}/edit`)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Link
                        href={`/studio/layouts/data/${l.id}/edit`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {l.name}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {l.canvasWidth} × {l.canvasHeight} px
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {String(l.orientation) === '2' || l.orientation === 'portrait' ? 'Portrait' : 'Landscape'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {l.layersList ? l.layersList.length : 0} Layer
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {l.createdAt ? new Date(l.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                    </td>
                    <td
                      style={{ padding: '12px 16px', textAlign: 'right' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {!l.isScheduleSynced && (
                          <button
                            onClick={() => handleOpenPushModal(l)}
                            className="btn btn-primary"
                            style={{
                              padding: '5px 10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                            title="Push ke Penjadwalan Layar"
                          >
                            <Send size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(l.id, l.name)}
                          className="btn btn-outline"
                          style={{ padding: '5px 8px', color: 'var(--accent-rose)' }}
                          title="Hapus Template"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > limit && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
            <Pagination
              page={page}
              total={total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(newLimit: number) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Push to Schedule Modal */}
      {pushModalOpen && selectedLayoutForPush && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            className="card-elevated"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '16px',
              border: '1px solid var(--border-strong)',
              overflow: 'hidden',
              boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    color: 'var(--primary-400)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                  }}
                >
                  <Send size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Push ke Penjadwalan
                  </h3>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Layout: <strong style={{ color: 'var(--text-secondary)' }}>{selectedLayoutForPush.name}</strong> ({selectedLayoutForPush.canvasWidth}×{selectedLayoutForPush.canvasHeight})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPushModalOpen(false)}
                className="btn btn-outline"
                style={{ padding: '6px', borderRadius: '8px' }}
                title="Tutup"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {pushSuccessMsg ? (
                <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                  <CheckCircle2 size={48} style={{ color: 'var(--accent-emerald)', margin: '0 auto 12px auto' }} />
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Berhasil Dipush ke Penjadwalan!
                  </h4>
                  <p style={{ margin: '0 0 20px 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {pushSuccessMsg}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <Link
                      href="/studio/schedules"
                      className="btn btn-primary"
                      style={{ padding: '8px 16px' }}
                      onClick={() => setPushModalOpen(false)}
                    >
                      Buka Menu Penjadwalan
                    </Link>
                    <button
                      onClick={() => setPushModalOpen(false)}
                      className="btn btn-outline"
                      style={{ padding: '8px 16px' }}
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePushSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Schedule Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Nama Entri Jadwal *
                    </label>
                    <input
                      type="text"
                      required
                      value={scheduleName}
                      onChange={(e) => setScheduleName(e.target.value)}
                      className="form-input"
                      placeholder="Contoh: Tayang: Menu Restoran Siang"
                    />
                  </div>

                  {/* Time Window */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Jam Tayang Aktif
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setStartTime('00:00:00');
                            setEndTime('23:59:59');
                          }}
                          className="btn btn-outline"
                          style={{ padding: '2px 8px', fontSize: '0.6875rem' }}
                        >
                          24 Jam Penuh
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStartTime('08:00:00');
                            setEndTime('17:00:00');
                          }}
                          className="btn btn-outline"
                          style={{ padding: '2px 8px', fontSize: '0.6875rem' }}
                        >
                          Jam Kerja (08-17)
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Jam Mulai</span>
                        <input
                          type="text"
                          required
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="form-input"
                          placeholder="00:00:00"
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Jam Selesai</span>
                        <input
                          type="text"
                          required
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="form-input"
                          placeholder="23:59:59"
                        />
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Player hanya menayangkan layout ini saat jam lokal perangkat berada di dalam rentang waktu di atas.
                    </span>
                  </div>

                  {/* Days of week */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Hari Tayang
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {dayNames.map((d) => {
                        const active = selectedDays.includes(d.num);
                        return (
                          <button
                            key={d.num}
                            type="button"
                            onClick={() => handleToggleDay(d.num)}
                            style={{
                              flex: 1,
                              padding: '8px 4px',
                              borderRadius: '8px',
                              border: active ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                              backgroundColor: active ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface)',
                              color: active ? 'var(--primary-400)' : 'var(--text-secondary)',
                              fontWeight: active ? 700 : 500,
                              fontSize: '0.8125rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target Displays */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Target Display / Layar Player ({selectedDeviceIds.length} terpilih)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDeviceIds(
                            selectedDeviceIds.length === devices.length ? [] : devices.map((d) => d.id)
                          )
                        }
                        className="btn btn-outline"
                        style={{ padding: '2px 8px', fontSize: '0.6875rem' }}
                      >
                        {selectedDeviceIds.length === devices.length ? 'Batal Semua' : 'Pilih Semua'}
                      </button>
                    </div>

                    <div
                      style={{
                        maxHeight: '140px',
                        overflowY: 'auto',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-primary)',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      {loadingTargets ? (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', padding: '8px' }}>
                          Memuat daftar perangkat...
                        </span>
                      ) : devices.length === 0 ? (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', padding: '8px' }}>
                          Belum ada perangkat display terdaftar.
                        </span>
                      ) : (
                        devices.map((d) => {
                          const checked = selectedDeviceIds.includes(d.id);
                          return (
                            <label
                              key={d.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                backgroundColor: checked ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.8125rem',
                                color: checked ? 'var(--text-primary)' : 'var(--text-secondary)',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleDevice(d.id)}
                              />
                              <Monitor size={14} style={{ opacity: 0.7 }} />
                              <span style={{ fontWeight: checked ? 600 : 400 }}>{d.name}</span>
                              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                {d.screenWidth}×{d.screenHeight}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Target Display Groups */}
                  {groups.length > 0 && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Target Grup Layar ({selectedGroupIds.length} terpilih)
                      </label>
                      <div
                        style={{
                          maxHeight: '110px',
                          overflowY: 'auto',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-primary)',
                          padding: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        {groups.map((g) => {
                          const checked = selectedGroupIds.includes(g.id);
                          return (
                            <label
                              key={g.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                backgroundColor: checked ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.8125rem',
                                color: checked ? 'var(--text-primary)' : 'var(--text-secondary)',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleGroup(g.id)}
                              />
                              <Folder size={14} style={{ opacity: 0.7 }} />
                              <span style={{ fontWeight: checked ? 600 : 400 }}>{g.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Info Priority */}
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertCircle size={15} style={{ color: 'var(--primary-400)', flexShrink: 0 }} />
                    <span>
                      Prioritas otomatis diset <strong>0 (paling dasar)</strong>. Jadwal baru ini akan tercatat di menu Penjadwalan dan dieksekusi oleh manifest engine sesuai jam aktifnya.
                    </span>
                  </div>

                  {/* Submit Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setPushModalOpen(false)}
                      className="btn btn-outline"
                      style={{ padding: '8px 16px' }}
                      disabled={pushing}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}
                      disabled={pushing}
                    >
                      {pushing ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" />
                          <span>Mempush...</span>
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Kirim ke Penjadwalan</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
