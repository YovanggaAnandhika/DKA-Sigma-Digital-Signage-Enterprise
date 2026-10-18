'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SingleSelectOption {
  value: string;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
}

interface SingleSelectProps {
  value: string;
  options: (SingleSelectOption | { value: string; label: string })[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function SingleSelect({
  value,
  options,
  onChange,
  placeholder = 'Pilih opsi...',
  disabled = false,
  className = '',
  style,
}: SingleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '9px 12px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--input-bg)',
          border: isOpen ? '1px solid var(--border-focus)' : '1px solid var(--input-border)',
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: '0.875rem',
          fontFamily: 'inherit',
          fontWeight: 500,
          boxShadow: isOpen
            ? '0 0 0 3px var(--focus-ring-glow)'
            : '0 1px 2px var(--input-inset-shadow)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          style={{
            color: isOpen ? 'var(--primary-500)' : 'var(--text-muted)',
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s ease',
          }}
        />
      </button>

      {/* Floating Options Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--card-shadow), 0 16px 36px -6px rgba(0, 0, 0, 0.35)',
            padding: '6px',
            maxHeight: '260px',
            overflowY: 'auto',
          }}
        >
          {options.length === 0 ? (
            <div
              style={{
                padding: '10px 12px',
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
              }}
            >
              Tidak ada pilihan
            </div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              const optHint = 'hint' in option ? option.hint : undefined;

              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    color: isSelected ? 'var(--primary-500)' : 'var(--text-primary)',
                    backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                    fontWeight: isSelected ? 600 : 500,
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--hover-surface)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {option.label}
                    </span>
                    {optHint && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          color: 'var(--text-muted)',
                          marginTop: '1px',
                        }}
                      >
                        {optHint}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <Check size={15} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
