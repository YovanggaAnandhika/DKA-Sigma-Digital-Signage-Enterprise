'use client';

import React from 'react';
import { Film, Image as ImageIcon, Clock } from 'lucide-react';

interface SimulatorDisplayProps {
  currentItem: {
    title: string;
    type: string;
    color: string;
    tag: string;
    duration: number;
  };
  slideIndex: number;
  totalSlides: number;
}

export default function SimulatorDisplay({
  currentItem,
  slideIndex,
  totalSlides,
}: SimulatorDisplayProps) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '880px',
        aspectRatio: '16 / 9',
        backgroundColor: '#000000',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        border: '4px solid #18181b',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Main Visual Display (Upper portion) */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* ZONE 1: Video / Media Utama (70% Left) */}
        <div
          style={{
            width: '70%',
            height: '100%',
            backgroundColor: currentItem.color,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            transition: 'background-color 0.6s ease',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              marginBottom: '14px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
            }}
          >
            {currentItem.type === 'video' ? (
              <Film size={28} style={{ color: '#a5b4fc' }} />
            ) : (
              <ImageIcon size={28} style={{ color: '#6ee7b7' }} />
            )}
          </div>

          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              marginBottom: '10px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}
          >
            {currentItem.tag}
          </span>

          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: '#ffffff',
              maxWidth: '380px',
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            {currentItem.title}
          </h2>

          <div
            style={{
              marginTop: '14px',
              padding: '4px 12px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              color: '#e4e4e7',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Clock size={12} style={{ color: '#60a5fa' }} />
            <span>
              Slide {slideIndex + 1} dari {totalSlides} • Auto-rotating ({currentItem.duration}d)
            </span>
          </div>
        </div>

        {/* ZONE 2: Side Promo Banner (30% Right) */}
        <div
          style={{
            width: '30%',
            height: '100%',
            backgroundColor: '#090d16',
            borderLeft: '2px solid rgba(255, 255, 255, 0.1)',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                display: 'inline-block',
              }}
            >
              ⭐ SPESIAL HARI INI
            </span>
            <h3
              style={{
                fontSize: '0.9375rem',
                fontWeight: 800,
                color: '#ffffff',
                marginTop: '8px',
                lineHeight: 1.3,
              }}
            >
              Kupon Belanja Rp 50.000
            </h3>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                marginTop: '6px',
                lineHeight: 1.4,
              }}
            >
              Scan QR di kasir untuk klaim cashback instan pada struk!
            </p>
          </div>

          {/* QR Box Visual */}
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100px',
              height: '100px',
              margin: '8px auto',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                border: '2px dashed #64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f172a',
                fontWeight: 800,
                fontSize: '0.625rem',
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              QR SCAN CASHIER
            </div>
          </div>

          <div style={{ fontSize: '0.6875rem', color: '#64748b', textAlign: 'center' }}>
            Berlaku di seluruh gerai DKASigma
          </div>
        </div>
      </div>

      {/* ZONE 3: Running Text Ticker (Bottom Bar) */}
      <div
        style={{
          height: '42px',
          backgroundColor: '#0c0a1f',
          borderTop: '2px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '12px',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            backgroundColor: '#f43f5e',
            color: '#ffffff',
            fontSize: '0.625rem',
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            flexShrink: 0,
          }}
        >
          LIVE TICKER
        </span>
        <div
          style={{
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: '#f1f5f9',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Selamat datang di Toko Retail DKASigma • Nikmati promo Buy 1 Get 1 Free seluruh aneka roti & minuman • Jam Operasional: 08:00 - 22:00 WIB • Gunakan aplikasi member untuk diskon tambahan!
        </div>
      </div>
    </div>
  );
}
