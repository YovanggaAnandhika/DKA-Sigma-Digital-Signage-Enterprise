'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Trash2,
  RefreshCw,
  LayoutGrid,
  Rocket,
} from 'lucide-react';
import {
  ScheduleDetailProvider,
  useScheduleDetail,
} from './context/ScheduleDetailContext';

const ScheduleOverviewTab = dynamic(
  () => import('./components/ScheduleOverviewTab'),
  {
    loading: () => (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--primary-400)' }} />
        <span style={{ fontSize: '0.875rem' }}>Memuat data jadwal...</span>
      </div>
    ),
    ssr: false,
  }
);

const ScheduleRolloutTab = dynamic(
  () => import('./components/ScheduleRolloutTab'),
  {
    loading: () => (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--primary-400)' }} />
        <span style={{ fontSize: '0.875rem' }}>Memuat panel rollout & upload media...</span>
      </div>
    ),
    ssr: false,
  }
);

function ScheduleDetailView() {
  const {
    schedule,
    loading,
    deleting,
    activeTab,
    setActiveTab,
    layoutMediaItems,
    fetchScheduleData,
    handleDelete,
    primaryEvent,
  } = useScheduleDetail();

  if (loading || !schedule) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 16px auto', color: 'var(--primary-400)' }} />
        <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>Memuat detail jadwal tayang...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top Header Bar (Full-Width) */}
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
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>{schedule.description || 'Jadwal tayang konten digital signage'}</span>
              <span>·</span>
              <span>Dibuat: {schedule.createdAt ? new Date(schedule.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => fetchScheduleData()} className="btn btn-outline" style={{ padding: '8px 12px' }} title="Muat Ulang">
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

      {/* 2-Tab Navigation Bar (HDR Vanilla CSS) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '2px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('data')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'data' ? 600 : 500,
            color: activeTab === 'data' ? 'var(--text-primary)' : 'var(--text-secondary)',
            backgroundColor: activeTab === 'data' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            borderBottom: activeTab === 'data' ? '2px solid var(--primary-500)' : '2px solid transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <LayoutGrid size={16} style={{ color: activeTab === 'data' ? 'var(--primary-400)' : 'var(--text-muted)' }} />
          <span>Data Jadwal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rollout')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'rollout' ? 600 : 500,
            color: activeTab === 'rollout' ? 'var(--text-primary)' : 'var(--text-secondary)',
            backgroundColor: activeTab === 'rollout' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            borderBottom: activeTab === 'rollout' ? '2px solid var(--primary-500)' : '2px solid transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Rocket size={16} style={{ color: activeTab === 'rollout' ? 'var(--primary-400)' : 'var(--text-muted)' }} />
          <span>Rollout & Upload Media</span>
          {layoutMediaItems.length > 0 && (
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '1px 6px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: 'var(--primary-400)',
                fontWeight: 700,
              }}
            >
              {layoutMediaItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Dynamic Tab Renderers */}
      {activeTab === 'data' && <ScheduleOverviewTab />}
      {activeTab === 'rollout' && <ScheduleRolloutTab />}
    </div>
  );
}

export default function ViewSchedulePage() {
  const params = useParams() as { id: string };

  return (
    <ScheduleDetailProvider scheduleId={params.id}>
      <ScheduleDetailView />
    </ScheduleDetailProvider>
  );
}
