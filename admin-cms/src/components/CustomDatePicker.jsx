import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const WEEKDAYS_FR = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

const pad2 = (n) => String(n).padStart(2, '0');

const parseIsoDate = (str) => {
  if (!str || typeof str !== 'string') return null;
  const match = str.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]) - 1;
  const d = Number(match[3]);
  const dt = new Date(y, m, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m || dt.getDate() !== d) return null;
  return dt;
};

const toIsoDate = (dt) => `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;

const formatDisplayFr = (str) => {
  const dt = parseIsoDate(str);
  if (!dt) return '';
  return `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}/${dt.getFullYear()}`;
};

export default function CustomDatePicker({
  value = '',
  onChange,
  placeholder = 'jj/mm/aaaa',
  className = 'input-control',
  style = {},
  allowClear = false,
  disabled = false,
  alignRight = false,
  title
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selectedDate = useMemo(() => parseIsoDate(value), [value]);
  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());

  useEffect(() => {
    if (selectedDate) setViewDate(selectedDate);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const todayIso = toIsoDate(new Date());

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells = [];
    for (let i = startOffset - 1; i >= 0; i--) {
      const dt = new Date(year, month - 1, daysInPrevMonth - i);
      cells.push({ date: dt, iso: toIsoDate(dt), inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      cells.push({ date: dt, iso: toIsoDate(dt), inMonth: true });
    }
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const dt = new Date(year, month + 1, d);
      cells.push({ date: dt, iso: toIsoDate(dt), inMonth: false });
    }
    return cells;
  }, [viewDate]);

  const emitChange = (nextIso) => {
    if (onChange) onChange({ target: { value: nextIso } });
    setIsOpen(false);
  };

  const wrapperStyle = {
    position: 'relative',
    display: style.display || 'inline-block',
    width: style.width || '100%',
    minWidth: style.minWidth,
    margin: style.margin,
    flex: style.flex
  };

  const triggerStyle = {
    ...style,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.65 : 1,
    userSelect: 'none',
    width: '100%',
    margin: 0,
    flex: 'none'
  };

  return (
    <div
      ref={wrapperRef}
      className={`custom-select-wrapper ${isOpen ? 'open' : ''}`}
      style={wrapperStyle}
      title={title}
    >
      <div
        className={className}
        onClick={() => !disabled && setIsOpen((o) => !o)}
        style={triggerStyle}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: value ? 'var(--text-primary)' : 'var(--text-muted)'
          }}
        >
          {value ? formatDisplayFr(value) : placeholder}
        </span>
        <Calendar
          size={14}
          style={{
            opacity: 0.72,
            marginLeft: '0.45rem',
            flexShrink: 0,
            color: isOpen ? 'var(--primary)' : 'var(--text-muted)'
          }}
        />
      </div>

      {isOpen && !disabled && (
        <div
          className="custom-select-dropdown"
          style={{
            width: '276px',
            minWidth: '276px',
            padding: '0.8rem',
            borderRadius: '16px',
            right: alignRight ? 0 : 'auto',
            left: alignRight ? 'auto' : 0,
            zIndex: 1200
          }}
        >
          {/* Header mois + navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <button
              type="button"
              onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-app)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={15} />
            </button>

            <span style={{ fontSize: '0.84rem', fontWeight: 700, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
              {MONTH_NAMES_FR[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>

            <button
              type="button"
              onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-app)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Jours de la semaine */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
            {WEEKDAYS_FR.map((day) => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  padding: '3px 0'
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
            {calendarDays.map((cell) => {
              const isSelected = cell.iso === value;
              const isToday = cell.iso === todayIso;
              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => emitChange(cell.iso)}
                  style={{
                    height: '32px',
                    borderRadius: '9px',
                    border: isToday && !isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                    background: isSelected
                      ? 'var(--primary)'
                      : isToday
                        ? 'var(--primary-light)'
                        : 'transparent',
                    color: isSelected
                      ? '#ffffff'
                      : cell.inMonth
                        ? 'var(--text-primary)'
                        : 'var(--text-muted)',
                    opacity: cell.inMonth || isSelected ? 1 : 0.45,
                    fontSize: '0.76rem',
                    fontWeight: isSelected || isToday ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s ease'
                  }}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Pied de calendrier */}
          <div
            style={{
              display: 'flex',
              justifyContent: allowClear ? 'space-between' : 'flex-end',
              alignItems: 'center',
              marginTop: '0.6rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--border-color)'
            }}
          >
            {allowClear && (
              <button
                type="button"
                onClick={() => emitChange('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '2px 4px'
                }}
              >
                Effacer
              </button>
            )}
            <button
              type="button"
              onClick={() => emitChange(todayIso)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '2px 4px'
              }}
            >
              Aujourd&apos;hui
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
