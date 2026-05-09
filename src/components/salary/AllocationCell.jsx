import React, { useState, useRef, useEffect } from 'react';
import { formatCurrency } from '@/lib/helpers';

export default function AllocationCell({ value, salary, onSave, disabled, hotelName }) {
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
  };

  const handleSave = () => {
    const parsed = parseFloat(inputVal) / 100;
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
      onSave(parsed);
    } else if (inputVal === '' || inputVal === '0') {
      onSave(0);
    }
    setEditing(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditing(false);
  };

  if (editing) {
    return (
      <td className="px-1.5 py-1">
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