import React from 'react';
import { formatCurrency, HOTEL_SHORT_NAMES, HOTEL_COLORS } from '@/lib/helpers';

const DEPTS = [
  { key: 'REVENUE', label: 'Revenue Management', dot: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400' },
  { key: 'ECOMM',   label: 'E-Commerce',         dot: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' },
  { key: 'SALES',   label: 'Sales & Marketing',  dot: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400' },
];

export default function DeptBreakdownRollup({ employees, hotels }) {
  const propertyHotels = hotels.filter(h => h.short_code !== 'CORP');

  // Matrix: dept -> hotel -> allocated dollars
  const matrix = {};
  DEPTS.forEach(d => { matrix[d.key] = {}; propertyHotels.forEach(h => { matrix[d.key][h.short_code] = 0; }); });

  employees.forEach(emp => {
    if (emp.suppressed || emp.exclude_from_table) return;
    const dept = matrix[emp.department];
    if (!dept) return;
    propertyHotels.forEach(h => {
      const pct = emp.allocations?.[h.short_code] || 0;
      dept[h.short_code] += pct * (emp.annual_salary || 0);
    });
  });

  const deptTotals = DEPTS.reduce((acc, d) => {
    acc[d.key] = propertyHotels.reduce((s, h) => s + matrix[d.key][h.short_code], 0);
    return acc;
  }, {});

  const grandTotal = Object.values(deptTotals).reduce((s, v) => s + v, 0);

  // Column (per-hotel) totals
  const colTotals = {};
  propertyHotels.forEach(h => {
    colTotals[h.short_code] = DEPTS.reduce((s, d) => s + matrix[d.key][h.short_code], 0);
  });

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <h3 className="text-base font-semibold font-display">Department Breakdown by Hotel</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Allocated payroll ($) across properties, grouped by department</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sticky left-0 bg-card">Department</th>
              {propertyHotels.map(h => (
                <th key={h.short_code} className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                  {HOTEL_SHORT_NAMES[h.short_code] || h.short_code}
                </th>
              ))}
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground text-center bg-muted/20">Total</th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground text-center bg-muted/20">% Total</th>
            </tr>
          </thead>
          <tbody>
            {DEPTS.map(d => (
              <tr key={d.key} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 sticky left-0 bg-card">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${d.dot}`} />
                    <span className={`text-xs font-semibold ${d.text}`}>{d.label}</span>
                  </div>
                </td>
                {propertyHotels.map(h => {
                  const val = matrix[d.key][h.short_code];
                  const share = colTotals[h.short_code] > 0 ? (val / colTotals[h.short_code]) * 100 : 0;
                  return (
                    <td key={h.short_code} className="px-3 py-3 text-center tabular-nums text-xs font-medium">
                      {val > 0 ? (
                        <div>
                          <div>{formatCurrency(val)}</div>
                          <div className="text-[10px] text-muted-foreground font-normal">{share.toFixed(1)}%</div>
                        </div>
                      ) : <span className="text-muted-foreground/40">—</span>}
                    </td>
                  );
                })}
                <td className="px-3 py-3 text-center tabular-nums text-xs font-bold bg-muted/20">
                  {deptTotals[d.key] > 0 ? formatCurrency(deptTotals[d.key]) : <span className="text-muted-foreground/40">—</span>}
                </td>
                <td className="px-3 py-3 text-center tabular-nums text-xs font-bold bg-muted/20">
                  {grandTotal > 0 ? `${((deptTotals[d.key] / grandTotal) * 100).toFixed(1)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-primary/20 bg-primary/5">
              <td className="px-4 py-3 text-xs font-bold uppercase tracking-wider sticky left-0 bg-primary/5">Total</td>
              {propertyHotels.map(h => {
                const colTotal = DEPTS.reduce((s, d) => s + matrix[d.key][h.short_code], 0);
                return (
                  <td key={h.short_code} className="px-3 py-3 text-center tabular-nums text-xs font-bold">
                    {colTotal > 0 ? formatCurrency(colTotal) : <span className="text-muted-foreground/40">—</span>}
                  </td>
                );
              })}
              <td className="px-3 py-3 text-center tabular-nums text-sm font-bold bg-primary/10">{formatCurrency(grandTotal)}</td>
              <td className="px-3 py-3 text-center tabular-nums text-sm font-bold bg-primary/10">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}