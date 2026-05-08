import React from 'react';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/helpers';
import { User } from 'lucide-react';

const barColors = {
  AURA: 'bg-blue-500',
  H5A: 'bg-indigo-500',
  INK48: 'bg-purple-500',
  LIFE: 'bg-emerald-500',
  RENWICK: 'bg-amber-500',
  SMYTH: 'bg-rose-500',
  CORP: 'bg-gray-400',
};

export default function OrgEmployeeCard({ employee, onClick }) {
  const allocEntries = Object.entries(employee.allocations || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);

  return (
    <Card
      className="p-3 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 border border-border/60"
      onClick={() => onClick(employee)}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{employee.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{employee.title}</p>
          <p className="text-xs font-bold text-secondary mt-1">{formatCurrency(employee.annual_salary)}</p>
        </div>
      </div>
      <div className="mt-3 flex h-2 rounded-full overflow-hidden bg-muted">
        {allocEntries.map(([code, pct]) => (
          <div
            key={code}
            className={`${barColors[code] || 'bg-gray-300'} transition-all`}
            style={{ width: `${pct * 100}%` }}
            title={`${code}: ${Math.round(pct * 100)}%`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {allocEntries.map(([code, pct]) => (
          <span key={code} className="text-[9px] text-muted-foreground">
            {code} {Math.round(pct * 100)}%
          </span>
        ))}
      </div>
    </Card>
  );
}