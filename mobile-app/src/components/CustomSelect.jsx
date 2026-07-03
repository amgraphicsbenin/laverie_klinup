import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const CustomSelect = ({ value, onChange, options, placeholder, disabled, style, dropdownStyle, buttonStyle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => String(o.value) === String(value));

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 100 : 1, ...style }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.42rem 0.65rem 0.42rem 0.65rem',
          fontSize: '0.75rem',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.7)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          textAlign: 'left',
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)',
          outline: 'none',
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          ...buttonStyle
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
          }
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : (placeholder || '-- Choisir --')}
        </span>
        <ChevronDown 
          size={14} 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.2s ease', 
            color: 'var(--text-secondary)',
            marginLeft: '0.35rem',
            flexShrink: 0
          }} 
        />
      </button>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '105%',
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '10px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
          overflowY: 'auto',
          maxHeight: '180px',
          padding: '4px',
          animation: 'slideUp 0.12s ease-out',
          ...dropdownStyle
        }}>
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={String(opt.value)}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '7px 10px',
                  fontSize: '0.72rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--primary-light)' : 'transparent',
                  color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: isSelected ? '700' : '500',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={11} color="var(--primary)" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
