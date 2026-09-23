'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface MediaFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  setPage: (val: number) => void;
}

export default function MediaFilterBar({
  search,
  setSearch,
  setPage,
}: MediaFilterBarProps) {
  return (
    <div className="card-elevated" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari aset berdasarkan nama file atau tipe..."
          className="form-input"
          style={{ paddingLeft: '36px' }}
        />
      </div>
    </div>
  );
}
