import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronUp, ChevronDown } from "lucide-react";
import { formatToDDMMYY } from "../../lib/dateUtils";
import { useTranslation } from "react-i18next";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  className?: string;
}

const WEEKDAYS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAYS_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_VI = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

function buildMonthGrid(viewYear: number, viewMonth: number) {
  // Returns 6 rows of 7 days, with leading/trailing days from neighbour months.
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
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DatePicker({ value, onChange, className = "" }: DatePickerProps) {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === "vi";
  const weekdays = isVi ? WEEKDAYS_VI : WEEKDAYS_EN;
  const months = isVi ? MONTHS_VI : MONTHS_EN;

  const [open, setOpen] = useState(false);
  // The month currently being viewed in the popover, independent of selected value.
  const initial = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside the picker.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // When the selected value changes from outside, re-center the view.
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

  const today = new Date();
  const todayKey = toKey(today);
  const valueKey = value;
  const grid = buildMonthGrid(viewYear, viewMonth);

  const handleSelect = (date: Date) => {
    onChange(toKey(date));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-bg-surface transition-colors"
        title={t("journalEditor.datePickerTooltip", "Pick a date")}
      >
        <Calendar className="h-4 w-4 text-accent-brand" />
        <span className="text-sm font-semibold">
          {value ? formatToDDMMYY(value) : t("journalEditor.pickDate", "Pick date")}
        </span>
      </button>

      {open && (
        <div
          className="absolute z-50 top-full left-0 mt-2 bg-bg-surface border border-border-brand rounded-lg shadow-xl p-3 w-[280px]"
          // Prevent the inner mousedown from bubbling to the document handler.
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header: month label + up/down arrows */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-text-primary">
              {months[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goPrevMonth}
                className="p-1 rounded hover:bg-bg-app text-text-secondary hover:text-text-primary"
                title={t("datePicker.prevMonth", "Previous month")}
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goNextMonth}
                className="p-1 rounded hover:bg-bg-app text-text-secondary hover:text-text-primary"
                title={t("datePicker.nextMonth", "Next month")}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekdays.map((w) => (
              <div
                key={w}
                className="text-center text-xs font-semibold text-text-secondary py-1"
              >
                {w}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {grid.map(({ date, inMonth }) => {
              const key = toKey(date);
              const isToday = key === todayKey;
              const isSelected = key === valueKey;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => handleSelect(date)}
                  className={[
                    "h-8 w-8 rounded text-xs font-semibold transition-colors",
                    inMonth ? "text-text-primary" : "text-text-secondary/50",
                    isSelected
                      ? "bg-accent-brand text-bg-app"
                      : isToday
                      ? "ring-1 ring-accent-brand text-text-primary"
                      : "hover:bg-bg-app",
                  ].join(" ")}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-brand/50">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-xs font-semibold text-accent-brand hover:underline"
            >
              {t("journalEditor.clear", "Clear")}
            </button>
            <button
              type="button"
              onClick={() => handleSelect(today)}
              className="text-xs font-semibold text-accent-brand hover:underline"
            >
              {t("journalEditor.today", "Today")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
