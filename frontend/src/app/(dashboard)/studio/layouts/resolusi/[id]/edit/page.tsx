'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/services';
import { ArrowLeft, Save, RefreshCw, AlertCircle } from 'lucide-react';

function calculateAspectRatio(w: number, h: number): string {
  if (!w || !h || w <= 0 || h <= 0) return '';

  const gcd = (a: number, b: number): number => {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) {
      const t = y;
      y = x % y;
      x = t;
    }
    return x;
  };

  const divisor = gcd(w, h);
  const rw = w / divisor;
  const rh = h / divisor;

  const ratioVal = w / h;
  const standardRatios = [
    { ratio: 16 / 9, label: '16:9' },
    { ratio: 9 / 16, label: '9:16' },
    { ratio: 16 / 10, label: '16:10' },
    { ratio: 10 / 16, label: '10:16' },
    { ratio: 4 / 3, label: '4:3' },
    { ratio: 3 / 4, label: '3:4' },
    { ratio: 21 / 9, label: '21:9' },
    { ratio: 64 / 27, label: '21:9' },
    { ratio: 9 / 21, label: '9:21' },
    { ratio: 32 / 9, label: '32:9' },
    { ratio: 1 / 1, label: '1:1' },
    { ratio: 5 / 4, label: '5:4' },
    { ratio: 4 / 5, label: '4:5' },
  ];

  for (const std of standardRatios) {
    if (Math.abs(ratioVal - std.ratio) < 0.05) {
      return std.label;
    }
  }

  if (rw < 50 && rh < 50) {
    return `${rw}:${rh}`;
  }

  return ratioVal >= 1
    ? `${Number(ratioVal.toFixed(2))}:1`
    : `1:${Number((1 / ratioVal).toFixed(2))}`;
}

export default function EditResolusiPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    width: '' as number | '',
    height: '' as number | '',
    aspectRatio: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await api.getResolution(params.id);
        setFormData({
          name: data.name,
          width: data.width,
          height: data.height,
          aspectRatio: data.aspectRatio || calculateAspectRatio(data.width, data.height) || '16:9',
        });
      } catch (err: any) {
        alert(err.message || 'Gagal memuat resolusi');
        router.push('/studio/layouts/resolusi');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id, router]);

  const handleNameChange = (val: string) => {
    setErrorMessage('');
    setFormData((prev) => {
      const next = { ...prev, name: val };
      const match = val.match(/(\d{3,5})\s*[x×X]\s*(\d{3,5})/);
      if (match) {
        const w = Number(match[1]);
        const h = Number(match[2]);
        if (w > 0 && h > 0) {
          next.width = w;
          next.height = h;
          next.aspectRatio = calculateAspectRatio(w, h);
        }
      }
      return next;
    });
  };

  const handleWidthChange = (val: number | '') => {
    setErrorMessage('');
    setFormData((prev) => {
      const w = val === '' ? '' : Number(val);
      const next = { ...prev, width: w };
      if (typeof w === 'number' && typeof next.height === 'number') {
        next.aspectRatio = calculateAspectRatio(w, next.height);
      }
      return next;
    });
  };

  const handleHeightChange = (val: number | '') => {
    setErrorMessage('');
    setFormData((prev) => {
      const h = val === '' ? '' : Number(val);
      const next = { ...prev, height: h };
      if (typeof next.width === 'number' && typeof h === 'number') {
        next.aspectRatio = calculateAspectRatio(next.width, h);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const widthNum = Number(formData.width);
    const heightNum = Number(formData.height);

    if (!formData.name.trim()) {
      setErrorMessage('Nama resolusi wajib diisi');
      return;
    }
    if (!widthNum || widthNum <= 0 || !heightNum || heightNum <= 0) {
      setErrorMessage('Dimensi resolusi harus berupa angka lebih besar dari 0');
      return;
    }

    try {
      setSaving(true);
      await api.updateResolution(params.id, {
        name: formData.name.trim(),
        width: widthNum,
        height: heightNum,
        aspectRatio: formData.aspectRatio.trim() || calculateAspectRatio(widthNum, heightNum) || '16:9',
      });

      router.push('/studio/layouts/resolusi');
    } catch (err: any) {
      const msg = err.message ? err.message.replace(/^\d+\s+[A-Z_]+:\s*/, '') : 'Gagal memperbarui resolusi';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data master resolusi...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/studio/layouts/resolusi" className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
            Edit Master Resolusi
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
            Perbarui parameter nama atau dimensi piksel resolusi digital signage.
          </p>
        </div>
      </div>

      <div className="card-elevated" style={{ padding: '28px', width: '100%' }}>
        {errorMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: 'var(--accent-rose)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nama Resolusi <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Contoh: 2306x1080, Full HD Totem, Ultrawide Banner"
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Lebar Piksel (Width) <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="number"
                required
                min={100}
                max={15360}
                value={formData.width}
                onChange={(e) => handleWidthChange(e.target.value === '' ? '' : Number(e.target.value))}
                className="form-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Tinggi Piksel (Height) <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="number"
                required
                min={100}
                max={15360}
                value={formData.height}
                onChange={(e) => handleHeightChange(e.target.value === '' ? '' : Number(e.target.value))}
                className="form-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Rasio Aspek (Aspect Ratio Otomatis)
              </label>
              <input
                type="text"
                value={formData.aspectRatio}
                onChange={(e) => setFormData({ ...formData, aspectRatio: e.target.value })}
                placeholder="Terhitung otomatis (misal: 16:9, 2.14:1)"
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <Link href="/studio/layouts/resolusi" className="btn btn-secondary">
              Batal
            </Link>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{saving ? 'Menyimpan perubahan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
