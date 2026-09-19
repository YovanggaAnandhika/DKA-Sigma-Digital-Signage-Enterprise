import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Store Displays Overview
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Live status of centralized retail promotional screens across all store branches
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/displays" className="btn btn-primary">
            <span>+ Pair New Display</span>
          </Link>
          <Link href="/layouts" className="btn btn-secondary">
            <span>🎨 Layout Studio</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Active Displays
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
            48 <span style={{ fontSize: '0.9rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>/ 52 Online</span>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <span className="badge badge-online">92% Connected</span>
            <span className="badge badge-offline">4 Offline</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Promotional Layouts
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
            14
          </div>
          <div style={{ marginTop: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              10 Landscape (1920x1080), 4 Portrait (1080x1920)
            </span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Media & Playlists
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
            186 <span style={{ fontSize: '0.9rem', color: 'var(--accent-secondary)' }}>Assets</span>
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            14.2 GB cached locally on Android players
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Canary Gradual Rollout
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: 'var(--accent-amber)' }}>
            25%
          </div>
          <div style={{ marginTop: '12px' }}>
            <span className="badge badge-canary">Weekend Promo Campaign</span>
          </div>
        </div>
      </div>

      {/* Fleet Quick Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Featured Retail Screens</h2>
          <Link href="/displays" style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 600 }}>
            View All 52 Displays →
          </Link>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Display Name / Location</th>
              <th>Status</th>
              <th>Resolution</th>
              <th>Current Layout</th>
              <th>Active Zone Content</th>
              <th>Canary Tier</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Store 01 - Cashier Screen A</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: dev-9942 • MAC: 48:B0:2D:11:92:0A</div>
              </td>
              <td>
                <span className="badge badge-online">
                  <span className="badge-dot"></span> Online (gRPC)
                </span>
              </td>
              <td>1920 × 1080 (Landscape)</td>
              <td>Main Cashier Promo V3</td>
              <td>Video Promo (15s) + Side Banner</td>
              <td><span className="badge badge-canary">Canary 25%</span></td>
              <td>
                <Link href="/simulator" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                  Live Preview
                </Link>
              </td>
            </tr>
            <tr>
              <td>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Store 01 - Entrance Totem</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: dev-9943 • MAC: 48:B0:2D:11:92:0B</div>
              </td>
              <td>
                <span className="badge badge-online">
                  <span className="badge-dot"></span> Online (gRPC)
                </span>
              </td>
              <td>1080 × 1920 (Portrait)</td>
              <td>Vertical Fashion Lookbook</td>
              <td>Looping Slideshow (5 Slides)</td>
              <td><span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>Stable</span></td>
              <td>
                <Link href="/simulator" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                  Live Preview
                </Link>
              </td>
            </tr>
            <tr>
              <td>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Store 02 - Aisle 3 Screen</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: dev-8811 • MAC: 7C:2F:80:4A:E1:99</div>
              </td>
              <td>
                <span className="badge badge-offline">
                  <span className="badge-dot"></span> Offline
                </span>
              </td>
              <td>1920 × 1080 (Landscape)</td>
              <td>Snacks & Beverage Specials</td>
              <td>Cached (Offline Playing)</td>
              <td><span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>Stable</span></td>
              <td>
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                  Ping Device
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
