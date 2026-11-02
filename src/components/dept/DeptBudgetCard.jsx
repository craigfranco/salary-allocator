import React from 'react';
import { Building2, Users } from 'lucide-react';
import { formatCurrency, HOTEL_COLORS } from '@/lib/helpers';

export default function DeptBudgetCard({ hotel, deptLabel, allocatedTotal, employeeCount, onClick }) {
  const accent = HOTEL_COLORS[hotel.short_code] || HOTEL_COLORS.CORP;
  const rev = hotel.room_revenue_budget || 0;
  const pct = rev > 0 ? (allocatedTotal / rev) * 100 : 0;

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

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/30 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Room Revenue</p>
            <p className="text-sm font-bold tabular-nums">{formatCurrency(rev)}</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{deptLabel} Allocated</p>
            <p className="text-sm font-bold tabular-nums">{formatCurrency(allocatedTotal)}</p>
          </div>
        </div>

        <div className="mt-3 flex justify-between items-center">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">% of Room Revenue</span>
          <span className="text-xs font-bold tabular-nums" style={pct > 0 ? { color: accent.hex } : undefined}>
            {rev > 0 ? `${pct.toFixed(2)}%` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}