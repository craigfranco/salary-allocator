import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPercent } from '@/lib/helpers';

function toCSV(rows, headers) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
}

export default function ExportButton({ employees, hotels, hotelTotals }) {
  const handleExport = () => {
    const headers = ['Department', 'Name', 'Title', 'Annual Salary', 'Total %', ...hotels.map(h => `${h.short_code} %`), ...hotels.map(h => `${h.short_code} $`)];
    const rows = employees.map(emp => [
      emp.department,
      emp.name,
      emp.title,
      emp.annual_salary,
      formatPercent(Object.values(emp.allocations || {}).reduce((s, v) => s + v, 0)),
      ...hotels.map(h => formatPercent(emp.allocations?.[h.short_code] || 0)),
      ...hotels.map(h => formatCurrency((emp.allocations?.[h.short_code] || 0) * emp.annual_salary)),
    ]);

    // footer rows
    rows.push([]);
    rows.push(['Total Salary Allocated', '', '', '', '', ...hotels.map(h => ''), ...hotels.map(h => formatCurrency(hotelTotals[h.short_code] || 0))]);
    rows.push(['S&M Payroll Budget', '', '', '', '', ...hotels.map(h => ''), ...hotels.map(h => formatCurrency(h.sm_payroll_budget || 0))]);
    rows.push(['Over/(Short) Budget', '', '', '', '', ...hotels.map(h => ''), ...hotels.map(h => formatCurrency((hotelTotals[h.short_code] || 0) - (h.sm_payroll_budget || 0)))]);

    const csv = toCSV(rows, headers);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary-allocations-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
      <Download className="w-3.5 h-3.5" />
      Export CSV
    </Button>
  );
}