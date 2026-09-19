'use client';

import { useState } from 'react';

interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'image';
  size: string;
  dimensions: string;
  duration: string;
  hash: string;
  uploaded_at: string;
}

export default function MediaPage() {
  const [mediaItems] = useState<MediaAsset[]>([
    {
      id: 'm1',
      name: 'Summer_Sale_Promo_Teaser.mp4',
      type: 'video',
      size: '42.8 MB',
      dimensions: '1920 × 1080',
      duration: '15 detik',
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      uploaded_at: 'Kemarin, 14:30',
    },
    {
      id: 'm2',
      name: 'Fresh_Produce_Discount_Banner.jpg',
      type: 'image',
      size: '2.4 MB',
      dimensions: '1920 × 1080',
      duration: 'Static',
      hash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
      uploaded_at: '3 hari yang lalu',
    },
    {
      id: 'm3',
      name: 'Brand_Ambassador_Commercial.mp4',
      type: 'video',
      size: '88.1 MB',
      dimensions: '1920 × 1080',
      duration: '20 detik',
      hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
      uploaded_at: '5 hari yang lalu',
    },
    {
      id: 'm4',
      name: 'Vertical_Fashion_Totem_Lookbook.png',
      type: 'image',
      size: '4.1 MB',
      dimensions: '1080 × 1920',
      duration: 'Static',
      hash: 'fe2592a39132372c8670e617937d225845e0be975ff95c1ce80a914088200c9e',
      uploaded_at: 'Seminggu yang lalu',
    },
  ]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Media Asset Library
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Unggah dan kelola video promosi & gambar dengan kalkulasi checksum SHA256 otomatis
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => alert('Pilih file video / gambar untuk diunggah')}>
          <span>📤 Unggah Media Baru</span>
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Preview & Nama Asset</th>
              <th>Tipe</th>
              <th>Ukuran File</th>
              <th>Resolusi</th>
              <th>Durasi</th>
              <th>SHA256 Checksum</th>
              <th>Tanggal Upload</th>
            </tr>
          </thead>
          <tbody>
            {mediaItems.map((item) => (
              <tr key={item.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-sm)',
                      background: item.type === 'video' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                    }}>
                      {item.type === 'video' ? '🎬' : '🖼️'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {item.id}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                    {item.type}
                  </span>
                </td>
                <td>{item.size}</td>
                <td>{item.dimensions}</td>
                <td>{item.duration}</td>
                <td>
                  <code style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    {item.hash.substring(0, 16)}...
                  </code>
                </td>
                <td>{item.uploaded_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
