'use client';

import React, { useState } from 'react';
import { History, Trash2, Search, ArrowRight, RotateCcw, Volume2, Clock } from 'lucide-react';
import { useQueueManagement } from '../../context/QueueManagementContext';

export default function TabRiwayatTab() {
  const { callHistory, clearHistory } = useQueueManagement();
  const [historySearch, setHistorySearch] = useState('');

  const filteredHistory = callHistory.filter((item) => {
    const term = historySearch.toLowerCase();
    return (
      item.ticketNumber.toLowerCase().includes(term) ||
      item.counterName.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Top Header: Search & Clear Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: 'var(--primary-400)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <History size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Riwayat Panggilan Antrian
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Catatan log audit pemanggilan antrian loket secara real-time.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px', height: '36px', fontSize: '0.78rem' }}
              placeholder="Cari nomor / loket..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={clearHistory}
            disabled={callHistory.length === 0}
            className="btn btn-outline"
            style={{
              height: '36px',
              padding: '0 14px',
              color: 'var(--accent-rose)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              opacity: callHistory.length === 0 ? 0.4 : 1,
            }}
            title="Hapus seluruh log riwayat panggilan"
          >
            <Trash2 size={14} />
            <span>Bersihkan Riwayat</span>
          </button>
        </div>
      </div>

      {/* History Data Table Card */}
      <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>NO</th>
                <th style={{ width: '130px' }}>WAKTU</th>
                <th style={{ width: '160px' }}>NOMOR TIKET</th>
                <th>LOKET / POS TUJUAN</th>
                <th style={{ width: '180px' }}>TIPE PANGGILAN</th>
                <th style={{ width: '130px', textAlign: 'right' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Clock size={28} style={{ opacity: 0.4 }} />
                      <span>{historySearch ? 'Tidak ada riwayat panggilan yang cocok dengan pencarian.' : 'Belum ada riwayat pemanggilan nomor antrian.'}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item, idx) => {
                  const callTypeBadge = (() => {
                    if (item.callType === 'next') {
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                          <ArrowRight size={13} />
                          <span>Panggil Selanjutnya</span>
                        </span>
                      );
                    }
                    if (item.callType === 'recall') {
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--primary-400)', fontWeight: 600 }}>
                          <Volume2 size={13} />
                          <span>Panggilan Ulang</span>
                        </span>
                      );
                    }
                    return (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                        <RotateCcw size={13} />
                        <span>Mundur</span>
                      </span>
                    );
                  })();

                  return (
                    <tr key={item.id || idx}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        {idx + 1}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {item.calledAt || (item.timestamp ? new Date(item.timestamp).toLocaleTimeString('id-ID') : '-')}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            fontSize: '1.05rem',
                            letterSpacing: '0.04em',
                            color: 'var(--primary-400)',
                          }}
                        >
                          {item.ticketNumber}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                          {item.counterName}
                        </span>
                      </td>
                      <td>{callTypeBadge}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(16, 185, 129, 0.12)',
                            color: 'var(--accent-emerald)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                          }}
                        >
                          Terdengar
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
