import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EyeOff, Eye, ShieldCheck } from 'lucide-react';
import { useRedactedIds } from '@/lib/RedactionContext';

export { useRedactedIds };

export default function SalaryRedactionManager({ open, onOpenChange }) {
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { redactedIds, toggle, clearAll } = useRedactedIds();

  const DEPT_COLORS = {
    REVENUE: { badge: '#ccf0ed', text: '#0d9488', label: 'Revenue' },
    ECOMM:   { badge: '#fde8d4', text: '#f97316', label: 'E-Commerce' },
    SALES:   { badge: '#ede9fe', text: '#9333ea', label: 'Sales' },
  };

  const active = employees
    .filter(e => !e.suppressed && !e.exclude_from_table)
    .sort((a, b) => {
      const deptOrder = ['REVENUE', 'ECOMM', 'SALES'];
      const dd = deptOrder.indexOf(a.department) - deptOrder.indexOf(b.department);
      return dd !== 0 ? dd : b.annual_salary - a.annual_salary;
    });

  const redactedCount = active.filter(e => redactedIds.has(e.id)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Salary Redaction
          </DialogTitle>
          <DialogDescription>
            Toggle individuals whose salary will appear as <span className="font-mono font-bold tracking-widest">██████</span> in the exported PDF. Applies to all scenarios.
            {redactedCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium">
                <EyeOff className="w-3.5 h-3.5" /> {redactedCount} redacted
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 mt-2 space-y-1 pr-1">
          {active.map(emp => {
            const isRedacted = redactedIds.has(emp.id);
            const dc = DEPT_COLORS[emp.department];
            return (
              <div
                key={emp.id}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 border cursor-pointer transition-colors ${
                  isRedacted
                    ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
                    : 'bg-card border-border hover:bg-muted/50'
                }`}
                onClick={() => toggle(emp.id)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0"
                    style={{ background: dc?.badge, color: dc?.text }}
                  >
                    {dc?.label?.substring(0, 3).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold leading-tight truncate">{emp.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{emp.title}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {isRedacted ? (
                    <>
                      <span className="text-xs font-mono tracking-widest text-amber-600 font-bold">██████</span>
                      <EyeOff className="w-4 h-4 text-amber-500" />
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-muted-foreground">
                        ${emp.annual_salary?.toLocaleString()}
                      </span>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={clearAll}
          >
            Clear All
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}