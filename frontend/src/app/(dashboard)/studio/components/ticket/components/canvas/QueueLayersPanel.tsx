'use client';

import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  ArrowUp,
  ArrowDown,
  Type,
  Ticket,
  Users,
  MessageSquare,
  Image as ImageIcon,
} from 'lucide-react';
import { useQueueEditor } from '../../context/QueueEditorContext';
import { QueueLayoutItem, QueueItemType } from '../../types';

interface QueueLayersPanelProps {
  selectedItemId: string | null;
  onSelectItem: (item: QueueLayoutItem | null) => void;
}

export default function QueueLayersPanel({
  selectedItemId,
  onSelectItem,
}: QueueLayersPanelProps) {
  const { queue, updateLayoutItem, setQueue } = useQueueEditor();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleAddNewItem = (type: QueueItemType) => {
    setIsAddOpen(false);
    const newId = `item-${Date.now()}`;
    const maxZ = queue.items.reduce((max, it) => Math.max(max, it.zIndex || 1), 1) + 1;

    let newItem: QueueLayoutItem;

    if (type === 'ticket_number') {
      newItem = {
        id: newId,
        itemType: 'ticket_number',
        name: 'Nomor Antrian Besar',
        x: 360,
        y: 200,
        width: 1200,
        height: 400,
        zIndex: maxZ,
        backgroundColor: 'transparent',
        textColor: '#0284c7',
        fontSize: 150,
        fontWeight: '900',
        textAlign: 'center',
        templateContent: '$queue_number$',
        config: { pulseOnCall: true },
        isVisible: true,
      };
    } else if (type === 'counter_loket') {
      newItem = {
        id: newId,
        itemType: 'counter_loket',
        name: 'Badge Loket',
        x: 710,
        y: 680,
        width: 500,
        height: 90,
        zIndex: maxZ,
        backgroundColor: '#f59e0b',
        textColor: '#ffffff',
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
        templateContent: '$queue_counter$',
        config: { borderRadius: 14 },
        isVisible: true,
      };
    } else if (type === 'marquee') {
      newItem = {
        id: newId,
        itemType: 'marquee',
        name: 'Running Text Informasi',
        x: 0,
        y: 990,
        width: 1920,
        height: 90,
        zIndex: maxZ,
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'left',
        templateContent: 'PENGUMUMAN: Silakan menuju $queue_counter$ saat nomor $queue_number$ dipanggil.',
        config: { speed: 'normal', direction: 'left' },
        isVisible: true,
      };
    } else {
      newItem = {
        id: newId,
        itemType: 'text_label',
        name: 'Label Teks Kustom',
        x: 100,
        y: 60,
        width: 1000,
        height: 80,
        zIndex: maxZ,
        backgroundColor: 'transparent',
        textColor: '#0f172a',
        fontSize: 36,
        fontWeight: '800',
        textAlign: 'left',
        templateContent: 'Selamat Datang di Layanan Antrian',
        config: {},
        isVisible: true,
      };
    }

    setQueue((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    onSelectItem(newItem);
  };

  const handleToggleVisible = (e: React.MouseEvent, id: string, current: boolean) => {
    e.stopPropagation();
    updateLayoutItem(id, { isVisible: !current });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setQueue((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id),
    }));
    if (selectedItemId === id) onSelectItem(null);
  };

  const handleMoveZ = (e: React.MouseEvent, id: string, delta: number) => {
    e.stopPropagation();
    const item = queue.items.find((it) => it.id === id);
    if (!item) return;
    const newZ = Math.max(1, (item.zIndex || 1) + delta);
    updateLayoutItem(id, { zIndex: newZ });
  };

  const getItemIcon = (type: QueueItemType) => {
    if (type === 'ticket_number') return <Ticket size={14} color="#0284c7" />;
    if (type === 'counter_loket') return <Users size={14} color="#f59e0b" />;
    if (type === 'marquee') return <MessageSquare size={14} color="#ec4899" />;
    return <Type size={14} color="var(--primary-500)" />;
  };

  // Sorted by zIndex descending so top layers appear at the top of the list
  const sortedItems = [...queue.items].sort((a, b) => (b.zIndex || 1) - (a.zIndex || 1));

  return (
    <div
      style={{
        width: '260px',
        backgroundColor: 'var(--bg-surface-elevated)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '620px',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={15} color="var(--primary-500)" />
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Lapisan ({queue.items.length})
          </span>
        </div>

        {/* Add Layer dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsAddOpen(!isAddOpen)}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
            title="Tambah Lapisan Baru"
          >
            <Plus size={13} />
            Tambah
          </button>

          {isAddOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                zIndex: 999,
                minWidth: '190px',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {[
                { type: 'text_label', label: 'Teks / Judul', icon: Type, color: 'var(--primary-500)' },
                { type: 'ticket_number', label: 'Nomor Antrian', icon: Ticket, color: '#0284c7' },
                { type: 'counter_loket', label: 'Badge Loket', icon: Users, color: '#f59e0b' },
                { type: 'marquee', label: 'Running Text', icon: MessageSquare, color: '#ec4899' },
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => handleAddNewItem(opt.type as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      textAlign: 'left',
                    }}
                    className="hover:bg-slate-800"
                  >
                    <Icon size={14} color={opt.color} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Layer List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {sortedItems.map((item) => {
          const isSelected = item.id === selectedItemId;
          return (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                border: isSelected ? '1px solid var(--primary-500)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              className={!isSelected ? 'hover:bg-slate-800/40' : undefined}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                {getItemIcon(item.itemType)}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 700 : 500,
                      color: item.isVisible ? 'var(--text-primary)' : 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {item.width} × {item.height} · Z:{item.zIndex}
                  </div>
                </div>
              </div>

              {/* Actions: Visibility, Reorder Z, Delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <button
                  type="button"
                  onClick={(e) => handleToggleVisible(e, item.id, item.isVisible)}
                  style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}
                  title={item.isVisible ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {item.isVisible ? <Eye size={12} /> : <EyeOff size={12} color="var(--accent-rose)" />}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleMoveZ(e, item.id, 1)}
                  style={{ background: 'none', border: 'none', padding: '3px', cursor: 'pointer', color: 'var(--text-muted)' }}
                  title="Naikkan Lapisan"
                >
                  <ArrowUp size={11} />
                </button>

                <button
                  type="button"
                  onClick={(e) => handleMoveZ(e, item.id, -1)}
                  style={{ background: 'none', border: 'none', padding: '3px', cursor: 'pointer', color: 'var(--text-muted)' }}
                  title="Turunkan Lapisan"
                >
                  <ArrowDown size={11} />
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDelete(e, item.id)}
                  style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}
                  title="Hapus Elemen"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
