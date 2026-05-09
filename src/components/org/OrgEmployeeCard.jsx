import React from 'react';
import { formatCurrency, HOTEL_COLORS } from '@/lib/helpers';
import { User, EyeOff } from 'lucide-react';

const DEPT_STYLES = {
  REVENUE: { bg: 'bg-teal-500/15', text: 'text-teal-600 dark:text-teal-400', dot: 'bg-teal-500' },
  ECOMM:   { bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' },
  SALES:   { bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500' },
};

export default function OrgEmployeeCard({ employee, onClick }) {
  const suppressed = !!employee.suppressed;
  const allocEntries = Object.entries(employee.allocations || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const dept = DEPT_STYLES[employee.department] || {};

  return (
    <div
      className={`rounded-2xl border border-border bg-card p-4 cursor-pointer transition-all duration-200 ${
        suppressed ? 'opacity-40' : 'hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30'
      }`}
      onClick={() => onClick(employee)}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl ${dept.bg} flex items-center justify-center flex-shrink-0`}>
          {suppressed
            ? <EyeOff className={`w-4 h-4 ${dept.text}`} />
            : <User className={`w-4 h-4 ${dept.text}`} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${suppressed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {employee.name}
          </p>
          <p className="text-[11px] text-muted-foreground truncate leading-tight">{employee.title}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wide ${dept.text}`}>{employee.department}</span>
            <span className="text-[11px] font-semibold text-foreground">{formatCurrency(employee.annual_salary)}</span>
          </div>
        </div>
      </div>

      {allocEntries.length > 0 && (
        <div className="mt-3">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/50 gap-px">
            {allocEntries.map(([code, pct]) => (
              <div
                key={code}
                className={`${HOTEL_COLORS[code]?.bg || 'bg-slate-400'} transition-all`}
                style={{ width: `${pct * 100}%` }}
                title={`${code}: ${Math.round(pct * 100)}%`}
              />
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {allocEntries.map(([code, pct]) => (
              <span key={code} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                {code} {Math.round(pct * 100)}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}