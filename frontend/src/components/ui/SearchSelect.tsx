'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

export interface SearchSelectOption {
  value: string;
  label: string;
  hint?: string;
  swatch?: string;
}

interface SearchSelectProps {
  value: string;
  options: SearchSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  clearable?: boolean;
}

export default function SearchSelect({ value, options, onChange, placeholder = 'Pilih...', clearable }: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className="form-input" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', fontSize: '0.78rem', cursor: 'text' }} onClick={() => setOpen(true)}>
        {!open && selected?.swatch && <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: selected.swatch, flexShrink: 0 }} />}
        <input
          value={open ? query : selected?.label || ''}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filtered[0]) pick(filtered[0].value);
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder={selected?.label || placeholder}
          aria-label={placeholder}
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 'inherit' }}
        />
        {clearable && value && (
          <button type="button" aria-label="Kosongkan" onClick={(e) => { e.stopPropagation(); pick(''); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={13} />
          </button>
        )}
        <ChevronDown size={13} color="var(--text-muted)" />
      </div>

      {open && (
        <div role="listbox" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, maxHeight: 220, overflowY: 'auto', padding: 4, borderRadius: 8, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: '0 10px 24px -8px rgba(0,0,0,0.25)' }}>
          {filtered.length === 0 && <div style={{ padding: '8px 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tidak ada hasil</div>}
          {filtered.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              onClick={() => pick(o.value)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-primary)', backgroundColor: o.value === value ? 'rgba(37, 99, 235, 0.12)' : 'transparent' }}
            >
              {o.swatch && <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: o.swatch, flexShrink: 0 }} />}
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
              {o.hint && <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{o.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
