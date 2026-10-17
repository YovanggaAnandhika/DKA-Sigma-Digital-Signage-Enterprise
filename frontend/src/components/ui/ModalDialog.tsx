'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { AlertTriangle, Info, CheckCircle2, AlertCircle, X } from 'lucide-react';

export type DialogVariant = 'danger' | 'warning' | 'info' | 'success';

export interface AlertOptions {
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  variant?: DialogVariant;
}

export interface ConfirmOptions {
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
}

interface ActiveDialog {
  id: string;
  type: 'alert' | 'confirm';
  title: string;
  message: React.ReactNode;
  confirmText: string;
  cancelText?: string;
  variant: DialogVariant;
  resolve: (value: boolean) => void;
}

// Global emitter so modal can be called imperatively from anywhere
type DialogListener = (dialog: ActiveDialog | null) => void;
let globalListener: DialogListener | null = null;

export const modal = {
  alert: (optionsOrMessage: string | AlertOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const opts = typeof optionsOrMessage === 'string'
        ? { message: optionsOrMessage }
        : optionsOrMessage;

      const dialog: ActiveDialog = {
        id: Math.random().toString(36).substring(2),
        type: 'alert',
        title: opts.title || (opts.variant === 'danger' ? 'Terjadi Kesalahan' : opts.variant === 'success' ? 'Berhasil' : 'Pemberitahuan'),
        message: opts.message,
        confirmText: opts.confirmText || 'Mengerti',
        variant: opts.variant || 'info',
        resolve,
      };

      if (globalListener) {
        globalListener(dialog);
      } else {
        console.warn('ModalDialog listener not mounted yet.');
        resolve(true);
      }
    });
  },

  confirm: (optionsOrMessage: string | ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const opts = typeof optionsOrMessage === 'string'
        ? { message: optionsOrMessage }
        : optionsOrMessage;

      const dialog: ActiveDialog = {
        id: Math.random().toString(36).substring(2),
        type: 'confirm',
        title: opts.title || 'Konfirmasi Tindakan',
        message: opts.message,
        confirmText: opts.confirmText || 'Lanjutkan',
        cancelText: opts.cancelText || 'Batal',
        variant: opts.variant || 'warning',
        resolve,
      };

      if (globalListener) {
        globalListener(dialog);
      } else {
        console.warn('ModalDialog listener not mounted yet.');
        resolve(false);
      }
    });
  },
};

const ModalContext = createContext<typeof modal>(modal);
export const useModal = () => useContext(ModalContext);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [activeDialog, setActiveDialog] = useState<ActiveDialog | null>(null);

  useEffect(() => {
    globalListener = (d) => setActiveDialog(d);

    // Override native window.alert to completely eliminate browser alert glitching
    if (typeof window !== 'undefined') {
      window.alert = (msg?: any) => {
        modal.alert({
          title: 'Pemberitahuan',
          message: String(msg ?? ''),
          variant: 'info',
        });
      };
    }

    return () => {
      globalListener = null;
    };
  }, []);

  const handleClose = useCallback((result: boolean) => {
    if (activeDialog) {
      activeDialog.resolve(result);
      setActiveDialog(null);
    }
  }, [activeDialog]);

  // Keyboard navigation (Escape = cancel/close, Enter = confirm)
  useEffect(() => {
    if (!activeDialog) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleClose(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDialog, handleClose]);

  return (
    <ModalContext.Provider value={modal}>
      {children}

      {activeDialog && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(3px)',
            animation: 'fadeIn 0.15s ease-out',
          }}
          onClick={() => handleClose(false)}
        >
          <div
            className="card-elevated"
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              animation: 'scaleIn 0.15s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Icon badge & Title */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  backgroundColor:
                    activeDialog.variant === 'danger'
                      ? 'rgba(244, 63, 94, 0.15)'
                      : activeDialog.variant === 'warning'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : activeDialog.variant === 'success'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(59, 130, 246, 0.15)',
                  color:
                    activeDialog.variant === 'danger'
                      ? 'var(--accent-rose)'
                      : activeDialog.variant === 'warning'
                      ? 'var(--accent-amber)'
                      : activeDialog.variant === 'success'
                      ? 'var(--accent-emerald)'
                      : 'var(--primary-500)',
                }}
              >
                {activeDialog.variant === 'danger' && <AlertTriangle size={22} />}
                {activeDialog.variant === 'warning' && <AlertCircle size={22} />}
                {activeDialog.variant === 'success' && <CheckCircle2 size={22} />}
                {activeDialog.variant === 'info' && <Info size={22} />}
              </div>

              <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                  }}
                >
                  {activeDialog.title}
                </h3>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    marginTop: '6px',
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                  }}
                >
                  {activeDialog.message}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleClose(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                }}
                aria-label="Tutup dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px',
                paddingTop: '8px',
              }}
            >
              {activeDialog.type === 'confirm' && (
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 18px', minWidth: '84px' }}
                >
                  {activeDialog.cancelText || 'Batal'}
                </button>
              )}

              <button
                type="button"
                autoFocus
                onClick={() => handleClose(true)}
                className={`btn ${
                  activeDialog.variant === 'danger'
                    ? 'btn-danger'
                    : 'btn-primary'
                }`}
                style={{
                  padding: '8px 20px',
                  minWidth: '92px',
                  ...(activeDialog.variant === 'danger'
                    ? {
                        backgroundColor: 'var(--accent-rose)',
                        color: '#ffffff',
                        borderColor: 'transparent',
                      }
                    : {}),
                }}
              >
                {activeDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}
