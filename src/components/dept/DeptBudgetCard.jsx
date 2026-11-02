import React from 'react';
import { Building2, Users } from 'lucide-react';
import { formatCurrency, HOTEL_COLORS } from '@/lib/helpers';

const DEPT_BUDGET_FIELDS = {
  FINANCE: 'finance_payroll_budget',
  HR: 'hr_payroll_budget',
  ENGINEERING: 'engineering_payroll_budget',
};

export default function DeptBudgetCard({ hotel, dept, deptLabel, allocatedTotal, employeeCount, onClick }) {
  const accent = HOTEL_COLORS[hotel.short_code] || HOTEL_COLORS.CORP;
  const rev = hotel.room_revenue_budget || 0;
  const pct = rev > 0 ? (allocatedTotal / rev) * 100 : 0;
  const budget = (dept && DEPT_BUDGET_FIELDS[dept] ? hotel[DEPT_BUDGET_FIELDS[dept]] : hotel.sm_payroll_budget) || 0;
  const remaining = budget - allocatedTotal;
  const isOver = budget > 0 && allocatedTotal > budget;
  const pctUsed = budget > 0 ? Math.min((allocatedTotal / budget) * 100, 100) : 0;
  const isNear = !isOver && pctUsed > 95;

  return (
    <div
      onClick={onClick}
      className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden cursor-pointer"
    >
      <div className={`h-1.5 w-full ${accent.bg}`} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accent.hex + '25' }}>
              <Building2 className="w-4 h-4" style={{ color: accent.hex }} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm leading-tight">{hotel.name}</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent.hex }}>{hotel.short_code}</span>
            </div>
          </div>
          {employeeCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-muted/60 text-muted-foreground">
              <Users className="w-3 h-3" />{employeeCount}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-muted/30 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Room Revenue</p>
            <p className="text-sm font-bold tabular-nums">{formatCurrency(rev)}</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{deptLabel} Budget</p>
            <p className="text-sm font-bold tabular-nums">{formatCurrency(budget)}</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{deptLabel} Allocated</p>
            <p className="text-sm font-bold tabular-nums">{formatCurrency(allocatedTotal)}</p>
          </div>
          <div className={`rounded-xl p-3 ${isOver ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Remaining</p>
            <p className={`text-sm font-bold tabular-nums ${isOver ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{formatCurrency(remaining)}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">% of Room Revenue</span>
          <span className="text-xs font-bold tabular-nums" style={pct > 0 ? { color: accent.hex } : undefined}>
            {rev > 0 ? `${pct.toFixed(2)}%` : '—'}
          </span>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Budget Used</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isOver ? 'bg-red-500/15 text-red-500' : isNear ? 'bg-amber-500/15 text-amber-500' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            }`}>
              {budget > 0 ? `${Math.round((allocatedTotal / budget) * 100)}%` : '—'}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-red-500' : isNear ? 'bg-amber-500' : accent.bg}`}
              style={{ width: `${pctUsed}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}