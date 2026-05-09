import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import AllocationCell from './AllocationCell';
import { getTotalAllocation, getAllocationStatus, getAllocationColor, formatCurrency, getDeptColor } from '@/lib/helpers';

export default function SalaryTableRow({ employee, hotels, onAllocChange, onEdit, onDelete, onToggleSuppress, isOdd, highlight, managerName }) {
  const suppressed = !!employee.suppressed;
  const total = getTotalAllocation(employee.allocations);
  const status = getAllocationStatus(total);
  const colorClass = getAllocationColor(status);

  const rowBg = suppressed
    ? 'opacity-40 bg-muted/10'
    : highlight
    ? 'bg-primary/5'
    : isOdd
    ? 'bg-muted/20 hover:bg-muted/40'
    : 'bg-card hover:bg-muted/20';

  return (
    <tr className={`border-b border-border/40 transition-colors ${rowBg}`}>
      <td className={`px-3 py-2.5 sticky left-0 z-10 ${suppressed ? 'bg-muted/10' : isOdd ? 'bg-muted/20' : 'bg-card'}`}>
        <Badge variant="outline" className={`text-[10px] font-semibold whitespace-nowrap ${getDeptColor(employee.department)}`}>
          {employee.department}
        </Badge>
      </td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[160px] truncate">{employee.title}</td>
      <td className="px-3 py-2.5 text-sm font-medium whitespace-nowrap">
        <span>{employee.name}</span>
      </td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{managerName || <span className="text-border">—</span>}</td>
      <td className="px-3 py-2.5 text-sm font-semibold text-right whitespace-nowrap tabular-nums">{formatCurrency(employee.annual_salary)}</td>
      <td className="px-2 py-2.5 text-center">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${colorClass}`}>
          {Math.round(total * 100)}%
        </span>
      </td>
      {hotels.map(hotel => (
        <AllocationCell
          key={hotel.short_code}
          value={employee.allocations?.[hotel.short_code]}
          salary={employee.annual_salary}
          onSave={(newPct) => onAllocChange(employee, hotel.short_code, newPct)}
          disabled={suppressed}
          hotelName={hotel.name}
        />
      ))}
      <td className="px-2 py-2.5">
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onEdit(employee)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => onDelete(employee)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}