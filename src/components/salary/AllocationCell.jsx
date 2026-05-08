import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

export default function AllocationCell({ value, salary, onSave }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const pct = value || 0;
  const dollars = pct * salary;

  const handleStart = () => {
    setEditValue(Math.round(pct * 100).toString());
    setEditing(true);
  };

  const handleSave = () => {
    const num = parseFloat(editValue);
    if (!isNaN(num)) {
      onSave(num / 100);
    }
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditing(false);
  };

  if (editing) {
    return (
      <td className="px-2 py-1.5">
        <Input
          ref={inputRef}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-7 w-16 text-xs text-center px-1"
          min="0"
          max="100"
        />
      </td>
    );
  }

  return (
    <td
      className="px-2 py-1.5 cursor-pointer hover:bg-secondary/30 transition-colors group"
      onClick={handleStart}
    >
      <div className="flex flex-col items-center">
        <span className={`text-xs font-medium ${pct > 0 ? 'text-foreground' : 'text-muted-foreground/40'}`}>
          {pct > 0 ? `${Math.round(pct * 100)}%` : '—'}
        </span>
        {pct > 0 && (
          <span className="text-[10px] text-muted-foreground">
            ${Math.round(dollars).toLocaleString()}
          </span>
        )}
      </div>
    </td>
  );
}