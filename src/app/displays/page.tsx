'use client';

import { useState } from 'react';

interface DisplayItem {
  id: string;
  name: string;
  pairing_code: string;
  is_paired: boolean;
  is_online: boolean;
  resolution: string;
  orientation: 'landscape' | 'portrait';
  layout_name: string;
  storage: string;
  last_ping: string;
}

export default function DisplaysPage() {
  const [showPairModal, setShowPairModal] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [resolution, setResolution] = useState('1920x1080');

  const [displays, setDisplays] = useState<DisplayItem[]>([
    {
      id: 'd1',
      name: 'Cashier Display 01 (Grand Indonesia)',
      pairing_code: 'XR8-992',
      is_paired: true,
      is_online: true,
      resolution: '1920 × 1080',
      orientation: 'landscape',
      layout_name: 'Summer Promo Split-Zone V2',
      storage: '18.4 GB / 32 GB',
      last_ping: 'Just now (gRPC)',
    },
    {
      id: 'd2',
      name: 'Entrance Fashion Totem (Pondok Indah Mall)',
      pairing_code: 'KJ3-41A',
      is_paired: true,
      is_online: true,
      resolution: '1080 × 1920',
      orientation: 'portrait',
      layout_name: 'Vertical Lookbook Slideshow',
      storage: '12.1 GB / 64 GB',
      last_ping: '12s ago (gRPC)',
    },
    {
      id: 'd3',
      name: 'Beverage Showcase Screen (Kelapa Gading)',
      pairing_code: 'BN7-09P',
      is_paired: true,
      is_online: false,
      resolution: '1920 × 1080',
      orientation: 'landscape',
      layout_name: 'Beverage Specials Fullscreen',
      storage: '8.5 GB / 32 GB',
      last_ping: '2 hours ago (Offline Cache Active)',
    },
  ]);

  const handlePairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingCode || !deviceName) return;

    const newDisplay: DisplayItem = {
      id: `dev-${Date.now()}`,
      name: deviceName,
      pairing_code: pairingCode.toUpperCase(),
      is_paired: true,
      is_online: true,
      resolution: resolution === '1920x1080' ? '1920 × 1080' : '1080 × 1920',
      orientation: orientation,
      layout_name: 'Default Welcome Layout',
      storage: '4.2 GB / 32 GB',
      last_ping: 'Just now',
    };

    setDisplays([newDisplay, ...displays]);
    setShowPairModal(false);
    setPairingCode('');
    setDeviceName('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Display Fleet & Device Pairing
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Register Android promotional displays via 6-digit pairing code and configure hardware orientations
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowPairModal(true)}>
          <span>📺 Pair New Display</span>
        </button>
      </div>

      {/* Fleet Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Display Name</th>
              <th>Pairing Code</th>
              <th>Status</th>
              <th>Resolution & Orientation</th>
              <th>Active Layout</th>
              <th>Storage Cache</th>
              <th>Last Ping</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {displays.map((display) => (
              <tr key={display.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {display.name}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {display.id}</div>
                </td>
                <td>
                  <code style={{ background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: '4px', color: 'var(--accent-secondary)' }}>
                    {display.pairing_code}
                  </code>
                </td>
                <td>
                  {display.is_online ? (
                    <span className="badge badge-online">
                      <span className="badge-dot"></span> Online
                    </span>
                  ) : (
                    <span className="badge badge-offline">
                      <span className="badge-dot"></span> Offline
                    </span>
                  )}
                </td>
                <td>
                  <div>{display.resolution}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {display.orientation}
                  </span>
                </td>
                <td style={{ color: 'var(--text-primary)' }}>{display.layout_name}</td>
                <td>{display.storage}</td>
                <td style={{ fontSize: '0.8rem' }}>{display.last_ping}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      Reboot
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      Screenshot
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pairing Modal */}
      {showPairModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div className="glass-panel" style={{ width: '480px', padding: '32px', background: '#0f172a' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
              Pair New Android Display
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
              Masukkan 6-karakter kode pairing yang tampil di layar Android toko retail.
            </p>

            <form onSubmit={handlePairSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  PAIRING CODE
                </label>
                <input
                  type="text"
                  placeholder="e.g. XR8-992"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem',
                    letterSpacing: '0.1em',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  DISPLAY NAME / STORE LOCATION
                </label>
                <input
                  type="text"
                  placeholder="e.g. Toko Cabang Sudirman - Layar Kasir 1"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    ORIENTATION
                  </label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="landscape">Landscape (Horizontal)</option>
                    <option value="portrait">Portrait (Vertikal)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    RESOLUSI LAYAR
                  </label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="1920x1080">Full HD (1920 × 1080)</option>
                    <option value="1080x1920">Vertical (1080 × 1920)</option>
                    <option value="3840x2160">4K Ultra HD (3840 × 2160)</option>
                    <option value="1280x720">HD Ready (1280 × 720)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPairModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Klaim & Pasangkan Display
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
