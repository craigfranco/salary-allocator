import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Building2, Pencil, Check, X, Users, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers';
import { HOTEL_COLORS } from '@/lib/helpers';

const DEPTS = [
  { key: 'REVENUE', label: 'Revenue', dot: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400' },
  { key: 'ECOMM',   label: 'E-Comm',  dot: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' },
  { key: 'SALES',   label: 'S&M',     dot: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400' },
];

const PAYROLL_DEPTS = [
  { key: 'COMMERCIAL',   label: 'Commercial',   dot: 'bg-primary',    budget: (h) => h.sm_payroll_budget || 0 },
  { key: 'FINANCE',      label: 'Finance',      dot: 'bg-sky-500',     budget: (h) => h.finance_payroll_budget || 0 },
  { key: 'HR',           label: 'HR',           dot: 'bg-amber-500',   budget: (h) => h.hr_payroll_budget || 0 },
  { key: 'ENGINEERING',  label: 'Engineering',  dot: 'bg-emerald-500', budget: (h) => h.engineering_payroll_budget || 0 },
];

export default function HotelBudgetCard({ hotel, allocatedTotal, employeeCount, employees = [], deptStaff = [], onUpdate, onDelete, onClick }) {
  const [editing, setEditing] = useState(false);
  const [roomRev, setRoomRev] = useState(hotel.room_revenue_budget);
  const [payroll, setPayroll] = useState(hotel.sm_payroll_budget);
  const [finBudget, setFinBudget] = useState(hotel.finance_payroll_budget || 0);
  const [hrBudget, setHrBudget] = useState(hotel.hr_payroll_budget || 0);
  const [engBudget, setEngBudget] = useState(hotel.engineering_payroll_budget || 0);

  const budget = hotel.sm_payroll_budget || 0;
  const deptAllocated = {
    COMMERCIAL: allocatedTotal,
    FINANCE: deptStaff.filter(s => s.department === 'FINANCE' && !s.suppressed).reduce((s, e) => s + ((e.allocations?.[hotel.short_code] || 0) * (e.annual_salary || 0)), 0),
    HR: deptStaff.filter(s => s.department === 'HR' && !s.suppressed).reduce((s, e) => s + ((e.allocations?.[hotel.short_code] || 0) * (e.annual_salary || 0)), 0),
    ENGINEERING: deptStaff.filter(s => s.department === 'ENGINEERING' && !s.suppressed).reduce((s, e) => s + ((e.allocations?.[hotel.short_code] || 0) * (e.annual_salary || 0)), 0),
  };
  const deptBreakdown = DEPTS.map(d => {
    const total = employees.reduce((s, e) => {
      if (e.suppressed || e.exclude_from_table || e.department !== d.key) return s;
      const pct = e.allocations?.[hotel.short_code] || 0;
      return s + pct * (e.annual_salary || 0);
    }, 0);
    return { ...d, total };
  });
  const remaining = budget - allocatedTotal;
  const pctUsed = budget > 0 ? Math.min((allocatedTotal / budget) * 100, 100) : 0;
  const isOver = budget > 0 && allocatedTotal > budget;
  const isNear = !isOver && pctUsed > 95;

  const accent = HOTEL_COLORS[hotel.short_code] || HOTEL_COLORS.CORP;

  const handleSave = () => {
    onUpdate({
      room_revenue_budget: roomRev,
      sm_payroll_budget: payroll,
      finance_payroll_budget: finBudget,
      hr_payroll_budget: hrBudget,
      engineering_payroll_budget: engBudget,
    });
    setEditing(false);
  };

  if (hotel.short_code === 'CORP') return null;

  return (
    <div
      className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group cursor-pointer"
      onClick={(e) => { if (!editing) onClick?.(); }}
    >
      {/* Color banner */}
      <div className={`h-1.5 w-full ${accent.bg}`} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${accent.bg} bg-opacity-20 flex items-center justify-center flex-shrink-0`} style={{ background: accent.hex + '25' }}>
              <Building2 className="w-4 h-4" style={{ color: accent.hex }} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm leading-tight">{hotel.name}</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent.hex }}>{hotel.short_code}</span>
            </div>
          </div>
          {!editing ? (
            <div className="flex items-center gap-2">
              {employeeCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-muted/60 text-muted-foreground">
                  <Users className="w-3 h-3" />{employeeCount}
                </span>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Remove hotel">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setEditing(true); }}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            </div>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-500" onClick={(e) => { e.stopPropagation(); handleSave(); }}><Check className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditing(false); }}><X className="w-3.5 h-3.5" /></Button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
            <div><label className="text-xs text-muted-foreground">Room Revenue Budget</label><Input type="number" value={roomRev} onChange={(e) => setRoomRev(parseFloat(e.target.value) || 0)} /></div>
            <div><label className="text-xs text-muted-foreground">S&M Payroll Budget (Commercial)</label><Input type="number" value={payroll} onChange={(e) => setPayroll(parseFloat(e.target.value) || 0)} /></div>
            <div><label className="text-xs text-muted-foreground">Finance Payroll Budget</label><Input type="number" value={finBudget} onChange={(e) => setFinBudget(parseFloat(e.target.value) || 0)} /></div>
            <div><label className="text-xs text-muted-foreground">HR Payroll Budget</label><Input type="number" value={hrBudget} onChange={(e) => setHrBudget(parseFloat(e.target.value) || 0)} /></div>
            <div><label className="text-xs text-muted-foreground">Engineering Payroll Budget</label><Input type="number" value={engBudget} onChange={(e) => setEngBudget(parseFloat(e.target.value) || 0)} /></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-muted/30 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Room Revenue</p>
                <p className="text-sm font-bold">{formatCurrency(hotel.room_revenue_budget || 0)}</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">S&M Budget</p>
                <p className="text-sm font-bold">{formatCurrency(budget)}</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Allocated</p>
                <p className="text-sm font-bold">{formatCurrency(allocatedTotal)}</p>
              </div>
              <div className={`rounded-xl p-3 ${isOver ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Remaining</p>
                <p className={`text-sm font-bold ${isOver ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{formatCurrency(remaining)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="px-3 py-2 bg-muted/20 border-b border-border/60">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Commercial Breakdown</span>
              </div>
              <div className="divide-y divide-border/40">
                {deptBreakdown.map(d => {
                  const rev = hotel.room_revenue_budget || 0;
                  const pct = rev > 0 ? (d.total / rev) * 100 : 0;
                  return (
                    <div key={d.key} className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${d.dot}`} />
                        <span className={`text-xs font-semibold ${d.text}`}>{d.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground tabular-nums">{rev > 0 ? `${pct.toFixed(1)}%` : '—'}</span>
                        <span className="text-xs font-bold tabular-nums">{d.total > 0 ? formatCurrency(d.total) : '—'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border/60 overflow-hidden mt-4">
              <div className="px-3 py-2 bg-muted/20 border-b border-border/60">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Department Payroll Budgets</span>
              </div>
              <div className="divide-y divide-border/40">
                {PAYROLL_DEPTS.map(d => {
                  const deptBudget = d.budget(hotel);
                  const alloc = deptAllocated[d.key];
                  const over = deptBudget > 0 && alloc > deptBudget;
                  return (
                    <div key={d.key} className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${d.dot}`} />
                        <span className="text-xs font-semibold">{d.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold tabular-nums ${over ? 'text-red-500' : ''}`}>{formatCurrency(alloc)}</span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">of {formatCurrency(deptBudget)}</span>
                        {over && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-500">Over</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Budget Used</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isOver ? 'bg-red-500/15 text-red-500' : isNear ? 'bg-amber-500/15 text-amber-500' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {Math.round((allocatedTotal / budget) * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-red-500' : isNear ? 'bg-amber-500' : accent.bg}`}
                  style={{ width: `${pctUsed}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}