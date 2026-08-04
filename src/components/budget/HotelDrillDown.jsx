import React from 'react';
import { Building2, X, Users } from 'lucide-react';
import { HOTEL_COLORS, formatCurrency } from '@/lib/helpers';

const DEPT_STYLES = {
  REVENUE: { label: 'Revenue Management', bg: 'bg-teal-500/15', text: 'text-teal-600 dark:text-teal-400', dot: 'bg-teal-500' },
  ECOMM:   { label: 'E-Commerce',         bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' },
  SALES:   { label: 'Sales & Marketing',  bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500' },
};

const DEPTS = ['REVENUE', 'ECOMM', 'SALES'];

export default function HotelDrillDown({ hotel, employees, onClose, onEditEmployee }) {
  if (!hotel) return null;

  const accent = HOTEL_COLORS[hotel.short_code] || HOTEL_COLORS.CORP;
  const budget = hotel.sm_payroll_budget || 0;

  // Only active employees with an allocation to this hotel
  const allocated = employees
    .filter(e => !e.suppressed && (e.allocations?.[hotel.short_code] || 0) > 0)
    .map(e => ({
      ...e,
      pct: e.allocations[hotel.short_code],
      dollars: (e.annual_salary || 0) * e.allocations[hotel.short_code],
    }));

  const grandTotal = allocated.reduce((s, e) => s + e.dollars, 0);
  const avgPct = allocated.length > 0 ? allocated.reduce((s, e) => s + e.pct, 0) / allocated.length : 0;
  const remaining = budget - grandTotal;
  const pctUsed = budget > 0 ? Math.min((grandTotal / budget) * 100, 100) : 0;
  const isOver = budget > 0 && grandTotal > budget;
  const isNear = !isOver && pctUsed > 95;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-xl bg-background border-l border-border flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${accent.hex}cc, ${accent.hex}88)` }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
          <div className="relative flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white">{hotel.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/70">{hotel.short_code}</span>
                  <span className="text-white/50">·</span>
                  <span className="text-xs text-white/70 flex items-center gap-1"><Users className="w-3 h-3" />{allocated.length} employee{allocated.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center transition-all">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Department groups */}
          {DEPTS.map(dept => {
            const deptEmployees = allocated.filter(e => e.department === dept);
            if (deptEmployees.length === 0) return null;
            const deptTotal = deptEmployees.reduce((s, e) => s + e.dollars, 0);
            const ds = DEPT_STYLES[dept];
            return (
              <div key={dept} className="rounded-2xl border border-border overflow-hidden">
                {/* Dept header */}
                <div className={`flex items-center justify-between px-4 py-3 ${ds.bg}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${ds.dot}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${ds.text}`}>{ds.label}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/30 ${ds.text}`}>{deptEmployees.length}</span>
                  </div>
                  <span className={`text-xs font-bold ${ds.text}`}>{formatCurrency(deptTotal)}</span>
                </div>

                {/* Employee rows */}
                <div className="divide-y divide-border">
                  {deptEmployees.sort((a, b) => b.dollars - a.dollars).map(emp => (
                    <div key={emp.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors group">
                      <button
                        type="button"
                        onClick={() => onEditEmployee?.(emp)}
                        className="flex-1 min-w-0 pr-4 text-left group-hover:text-primary transition-colors"
                        title="Edit employee"
                      >
                        <p className="text-sm font-semibold text-foreground group-hover:underline truncate">{emp.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{emp.title}</p>
                      </button>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-foreground">{formatCurrency(emp.dollars)}</p>
                        <p className="text-[11px] text-muted-foreground">{Math.round(emp.pct * 100)}% of salary</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dept subtotal */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-t border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subtotal</span>
                  <span className="text-sm font-bold">{formatCurrency(deptTotal)}</span>
                </div>
              </div>
            );
          })}

          {allocated.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No employees allocated to this hotel</p>
            </div>
          )}
        </div>

        {/* Footer summary */}
        <div className="border-t border-border p-5 space-y-4 bg-card/50">
          {/* Grand total row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Headcount</p>
              <p className="text-lg font-bold">{allocated.length}</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Total Allocated</p>
              <p className="text-lg font-bold">{formatCurrency(grandTotal)}</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Avg Alloc %</p>
              <p className="text-lg font-bold">{Math.round(avgPct * 100)}%</p>
            </div>
          </div>

          {/* Budget vs allocated */}
          {budget > 0 && (
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">S&M Payroll Budget</span>
                <span className="text-sm font-bold">{formatCurrency(budget)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remaining</span>
                <span className={`text-sm font-bold ${isOver ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{formatCurrency(remaining)}</span>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-muted-foreground">Budget used</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isOver ? 'bg-red-500/15 text-red-500' : isNear ? 'bg-amber-500/15 text-amber-500' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  }`}>{Math.round((grandTotal / budget) * 100)}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-red-500' : isNear ? 'bg-amber-500' : accent.bg}`}
                    style={{ width: `${pctUsed}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}