import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, EyeOff, Eye, Copy } from 'lucide-react';
import AllocationCell from './AllocationCell';
import { getTotalAllocation, getAllocationStatus, getAllocationColor, formatCurrency, getDeptColor } from '@/lib/helpers';

export default function SalaryTableRow({ employee, hotels, onAllocChange, onFix, onEdit, onDelete, onToggleSuppress, onDuplicate, isOdd, highlight, managerName, isRedacted }) {
  const suppressed = !!employee.suppressed;
  const total = getTotalAllocation(employee.allocations);
  const status = getAllocationStatus(total);
  const colorClass = getAllocationColor(status);
  const totalPct = Math.round(total * 100);

  const rowBg = suppressed
    ? 'opacity-40 bg-muted/10'
    : highlight
    ? 'bg-primary/5'
    : isOdd
    ? 'bg-muted/20 hover:bg-muted/40'
    : 'bg-card hover:bg-muted/20';

  return (
    <tr className={`border-b border-border/40 transition-colors ${rowBg}`}>
      <td className={`px-2 py-2 sticky left-0 z-10 ${suppressed ? 'bg-muted/10' : isOdd ? 'bg-muted/20' : 'bg-card'}`}>
        <Badge variant="outline" className={`text-[10px] font-semibold whitespace-nowrap ${getDeptColor(employee.department)}`}>
          {employee.department}
        </Badge>
      </td>
      <td className="px-2 py-2 text-xs text-muted-foreground max-w-[120px] truncate">{employee.title}</td>
      <td className="px-2 py-2 text-sm font-medium whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          {suppressed && <EyeOff className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
          <span
            className={`cursor-pointer hover:underline hover:text-primary transition-colors ${suppressed ? 'text-muted-foreground italic' : ''}`}
            onClick={() => onEdit(employee)}
          >{employee.name}</span>
        </div>
      </td>
      <td className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap max-w-[100px] truncate">{managerName || <span className="text-border">—</span>}</td>
      <td className={`px-2 py-2 text-sm font-semibold text-right whitespace-nowrap tabular-nums ${suppressed ? 'text-muted-foreground/50 line-through' : ''}`}>
        {isRedacted ? <span className="font-mono tracking-widest text-muted-foreground">██████</span> : formatCurrency(employee.annual_salary)}
      </td>
      <td className="px-1.5 py-2 text-center">
        <div className="flex flex-col items-center gap-1">
          <span className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-bold ${colorClass}`}>
            {totalPct}%
          </span>
          {status !== 'exact' && !suppressed && onFix && (
            <button
              onClick={() => onFix(employee)}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              title="Spread this row's remaining % across its hotels to reach exactly 100%"
            >
              Fix to 100%
            </button>
          )}
        </div>
      </td>
      {hotels.map(hotel => (
        <AllocationCell
          key={hotel.short_code}
          value={employee.allocations?.[hotel.short_code]}
          salary={employee.annual_salary}
          onSave={(newPct) => onAllocChange(employee, hotel.short_code, newPct)}
          disabled={suppressed}
          hotelName={hotel.name}
          currentTotal={totalPct}
          isRedacted={isRedacted}
          suppressed={suppressed}
        />
      ))}
      <td className="px-2 py-2.5">
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onEdit(employee)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className={`h-7 w-7 ${suppressed ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground hover:text-amber-500'}`}
            title={suppressed ? 'Unsuppress (restore to calculations)' : 'Suppress (exclude from all calculations)'}
            onClick={() => onToggleSuppress(employee)}
          >
            {suppressed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" title="Duplicate employee" onClick={() => onDuplicate(employee)}>
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => onDelete(employee)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}