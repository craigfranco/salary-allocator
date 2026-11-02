import React from 'react';
import { Pencil, Trash2, EyeOff, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AllocationCell from '@/components/salary/AllocationCell';
import { getTotalAllocation, getAllocationStatus, getAllocationColor, formatCurrency } from '@/lib/helpers';

export default function DeptStaffRow({ staff, hotels, onAllocChange, onEdit, onDelete, onToggleSuppress }) {
  const total = getTotalAllocation(staff.allocations);
  const status = getAllocationStatus(total);
  const color = getAllocationColor(status);

  return (
    <tr className={`group hover:bg-muted/30 transition-colors ${staff.suppressed ? 'opacity-50' : ''}`}>
      <td className="px-4 py-2.5">
        <div className="font-medium">{staff.name}</div>
        <div className="text-xs text-muted-foreground">{staff.title}</div>
      </td>
      <td className="px-4 py-2.5 text-right whitespace-nowrap">
        <span className={`text-sm font-semibold tabular-nums ${staff.suppressed ? 'line-through text-muted-foreground/50' : ''}`}>
          {formatCurrency(staff.annual_salary || 0)}
        </span>
      </td>
      {hotels.map(h => (
        <AllocationCell
          key={h.short_code}
          value={staff.allocations?.[h.short_code] || 0}
          salary={staff.annual_salary || 0}
          hotelName={h.name}
          currentTotal={total}
          suppressed={staff.suppressed}
          onSave={(v) => onAllocChange(h.short_code, v)}
        />
      ))}
      <td className="px-3 py-2.5 text-center">
        <span className={`text-xs font-bold px-2 py-1 rounded-full tabular-nums ${color}`}>
          {Math.round(total * 100)}%
        </span>
      </td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} title="Edit">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleSuppress} title={staff.suppressed ? 'Unsuppress' : 'Suppress'}>
          {staff.suppressed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={onDelete} title="Delete">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </td>
    </tr>
  );
}