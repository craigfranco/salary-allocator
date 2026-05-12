import React, { useState, useRef, useEffect } from 'react';
import { formatCurrency } from '@/lib/helpers';

export default function AllocationCell({ value, salary, onSave, disabled, hotelName, currentTotal, onEditingChange }) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const pct = value || 0;
  const dollars = pct * salary;
  const displayPct = Math.round(pct * 100);

  const handleStart = () => {
    if (disabled) return;
    setInputVal(String(displayPct));
    setEditing(true);
    onEditingChange?.(true, displayPct);
  };

  const handleSave = () => {
    const parsed = parseFloat(inputVal) / 100;
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
      onSave(parsed);
    } else if (inputVal === '' || inputVal === '0') {
      onSave(0);
    }
    setEditing(false);
    onEditingChange?.(false, 0);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setEditing(false); onEditingChange?.(false, 0); }
  };

  const liveVal = parseFloat(inputVal) || 0;
  const liveTotal = editing ? Math.round((currentTotal - displayPct + liveVal)) : 0;
  const liveTotalColor = liveTotal === 100 ? 'text-emerald-500' : liveTotal > 100 ? 'text-red-500' : 'text-amber-500';

  if (editing) {
    return (
      <td className="px-1.5 py-1">
        <div className="flex flex-col items-center gap-0.5">
          <input
            ref={inputRef}
            type="number"
            min="0" max="100"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKey}
            className="w-16 h-7 text-center text-sm border border-primary rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span className={`text-[10px] font-bold tabular-nums ${liveTotalColor}`}>
            total: {liveTotal}%
          </span>
        </div>
      </td>
    );
  }

  return (
    <td
      className={`px-1.5 py-1 text-center transition-colors group relative ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-primary/5'
      }`}
      onClick={handleStart}
      title={displayPct > 0 ? `${hotelName || ''}: ${displayPct}% · ${formatCurrency(dollars)}` : undefined}
    >
      {displayPct > 0 ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-semibold text-foreground">{displayPct}%</span>
          <span className="text-[10px] text-muted-foreground leading-none">{formatCurrency(dollars)}</span>
        </div>
      ) : (
        <span className="text-muted-foreground/30 text-xs group-hover:text-muted-foreground transition-colors">—</span>
      )}
    </td>
  );
}