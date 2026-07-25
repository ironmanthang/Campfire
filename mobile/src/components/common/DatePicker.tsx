import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  className?: string;
}

const WEEKDAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WEEKDAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_VI = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

function buildMonthGrid(viewYear: number, viewMonth: number) {
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = Sun
  const startDate = new Date(viewYear, viewMonth, 1 - startWeekday);

  const days: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push({ date: d, inMonth: d.getMonth() === viewMonth });
  }
  return days;
}

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, className = '' }) => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const initial = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const isVi = i18n.language === 'vi';
  const WEEKDAYS = isVi ? WEEKDAYS_VI : WEEKDAYS_EN;
  const MONTHS = isVi ? MONTHS_VI : MONTHS_EN;

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  // Close when clicking/tapping outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  // Sync view when selection changes from parent
  useEffect(() => {
    if (!value) return;
    const d = new Date(value);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [value]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        goNextMonth();
      } else {
        goPrevMonth();
      }
    }
  };

  const handleSelect = (date: Date) => {
    onChange(toKey(date));
    setOpen(false);
  };

  const today = new Date();
  const todayKey = toKey(today);
  const grid = buildMonthGrid(viewYear, viewMonth);

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return t("datePicker.selectDate");
    return d.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-app border border-border-brand hover:border-accent-brand text-text-secondary hover:text-text-primary transition-all duration-200 cursor-pointer text-xs font-semibold select-none"
      >
        <Calendar size={13} className="text-accent-brand shrink-0" />
        <span>{value ? formatDateDisplay(value) : t("datePicker.selectDate")}</span>
      </button>

      {open && (
        <div
          className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-bg-surface border border-border-brand rounded-2xl shadow-xl p-4 w-[280px] select-none animate-fade-in"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-center mb-4 pb-2 border-b border-border-brand/40">
            <span className="text-sm font-bold text-text-primary tracking-wide">
              {MONTHS[viewMonth]} {viewYear}
            </span>
          </div>

          {/* Touch Swipable Calendar Area */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="touch-none"
          >
            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-center text-[10px] font-bold text-text-secondary/70 uppercase">
                  {w}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1">
              {grid.map(({ date, inMonth }) => {
                const key = toKey(date);
                const isToday = key === todayKey;
                const isSelected = key === value;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => handleSelect(date)}
                    className={`h-8 w-8 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-accent-brand text-bg-app font-bold'
                        : isToday
                        ? 'border border-accent-brand text-text-primary font-bold'
                        : inMonth
                        ? 'text-text-primary hover:bg-bg-app'
                        : 'text-text-secondary/30 hover:bg-bg-app/40'
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Swipe Instructions */}
          <p className="text-[9px] text-text-secondary/50 text-center mt-2.5 italic">
            {t("datePicker.swipeHint")}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-brand/40">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
            >
              {t("datePicker.clear")}
            </button>
            <button
              type="button"
              onClick={() => handleSelect(today)}
              className="text-xs font-semibold text-accent-brand hover:text-accent-brand-hover transition-colors cursor-pointer"
            >
              {t("datePicker.today")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
