import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import AllocationCell from './AllocationCell';
import { getTotalAllocation, getAllocationStatus, getAllocationColor, formatCurrency, getDeptColor } from '@/lib/helpers';

export default function SalaryTableRow({ employee, hotels, onAllocChange, onEdit, onDelete }) {
  const total = getTotalAllocation(employee.allocations);
  const status = getAllocationStatus(total);
  const colorClass = getAllocationColor(status);

  return (
    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
      <td className="px-3 py-2 sticky left-0 bg-card z-10">
        <Badge variant="outline" className={`text-[10px] font-semibold ${getDeptColor(employee.department)}`}>
          {employee.department}
        </Badge>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground max-w-[160px] truncate">{employee.title}</td>
      <td className="px-3 py-2 text-sm font-medium whitespace-nowrap">{employee.name}</td>
      <td className="px-3 py-2 text-sm font-semibold text-right whitespace-nowrap">{formatCurrency(employee.annual_salary)}</td>
      <td className="px-2 py-2 text-center">
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
        />
      ))}
      <td className="px-2 py-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(employee)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(employee)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}