import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, HOTEL_COLORS } from '@/lib/helpers';

export default function DeptHotelDialog({ hotel, staff, deptLabel, onClose }) {
  if (!hotel) return null;
  const accent = HOTEL_COLORS[hotel.short_code] || HOTEL_COLORS.CORP;
  const rows = staff
    .filter(s => (s.allocations?.[hotel.short_code] || 0) > 0)
    .sort((a, b) => (b.allocations[hotel.short_code] * (b.annual_salary || 0)) - (a.allocations[hotel.short_code] * (a.annual_salary || 0)));
  const total = rows.reduce((s, e) => s + e.allocations[hotel.short_code] * (e.annual_salary || 0), 0);
  const rev = hotel.total_revenue_budget || 0;
  const pct = rev > 0 ? (total / rev) * 100 : 0;

  return (
    <Dialog open={!!hotel} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">{hotel.name} · {deptLabel} Allocations</DialogTitle>
        </DialogHeader>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No {deptLabel} allocations to this hotel yet.</p>
        ) : (
          <div className="space-y-2">
            {rows.map(s => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.title}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold tabular-nums" style={{ color: accent.hex }}>
                    {Math.round(s.allocations[hotel.short_code] * 100)}%
                  </span>
                  <span className="text-sm font-bold tabular-nums w-24 text-right">
                    {formatCurrency(s.allocations[hotel.short_code] * (s.annual_salary || 0))}
                  </span>
                </div>
              </div>
            ))}
            <div className="rounded-xl bg-muted/40 border border-border/60 px-3 py-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Total Revenue</p>
                <p className="text-sm font-bold mt-0.5">{formatCurrency(rev)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">{deptLabel} Total</p>
                <p className="text-sm font-bold mt-0.5">{formatCurrency(total)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">% of Revenue</p>
                <p className="text-sm font-bold mt-0.5" style={pct > 0 ? { color: accent.hex } : undefined}>
                  {rev > 0 ? `${pct.toFixed(2)}%` : '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}