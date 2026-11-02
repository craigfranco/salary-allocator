import React from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ArrowUp, ArrowDown, Building2, User, Bell, Zap, ArrowRight } from 'lucide-react';
import { getTotalAllocation, getAllocationStatus, formatCurrency, getHotelAllocatedTotal } from '@/lib/helpers';
import { DEPT_LABELS, DEPT_BASE_ROUTES, DEPT_BUDGET_FIELDS } from '@/lib/deptConfig';
import { useScenario } from '@/lib/ScenarioContext';

export default function Alerts({ dept = 'COMMERCIAL' }) {
  const { activeScenario, scenarioData } = useScenario(dept);
  const { data: employees = [] } = useQuery({
    queryKey: dept === 'COMMERCIAL' ? ['employees'] : ['deptstaff', dept],
    queryFn: () => dept === 'COMMERCIAL' ? base44.entities.Employee.list() : base44.entities.DeptStaff.filter({ department: dept }),
  });
  const { data: hotels = [] } = useQuery({ queryKey: ['hotels'], queryFn: () => base44.entities.Hotel.list() });

  // Use scenario data if active, otherwise use DB employees
  const displayEmployees = Array.isArray(scenarioData) ? scenarioData : (Array.isArray(employees) ? employees : []);
  const activeEmployees = displayEmployees.filter(e => !e.suppressed && !e.exclude_from_table);
  const suppressedCount = displayEmployees.filter(e => e.suppressed && !e.exclude_from_table).length;

  const allocAlerts = activeEmployees.map(emp => {
    const total = getTotalAllocation(emp.allocations);
    const status = getAllocationStatus(total);
    if (status === 'exact') return null;
    return { emp, total, status };
  }).filter(Boolean);

  const budgetField = DEPT_BUDGET_FIELDS[dept];
  const deptPrefix = dept === 'COMMERCIAL' ? '' : DEPT_BASE_ROUTES[dept];
  const budgetAlerts = hotels.filter(h => h.short_code !== 'CORP' && h[budgetField] > 0).map(hotel => {
    const allocated = getHotelAllocatedTotal(activeEmployees, hotel.short_code);
    const budget = hotel[budgetField];
    const pctUsed = (allocated / budget) * 100;
    if (pctUsed > 100) return { hotel, allocated, budget, type: 'over', amount: allocated - budget };
    if (pctUsed > 95) return { hotel, allocated, budget, type: 'near', amount: budget - allocated };
    return null;
  }).filter(Boolean);

  const nextActions = [
    ...budgetAlerts.filter(b => b.type === 'over').sort((a, b) => b.amount - a.amount)
      .map(b => ({ key: `over-${b.hotel.id}`, icon: Building2, label: b.hotel.name, detail: `Over ${dept === 'COMMERCIAL' ? 'S&M' : DEPT_LABELS[dept]} budget by ${formatCurrency(b.amount)}`, to: `${deptPrefix}/budgets?focus=${b.hotel.short_code}` })),
    ...budgetAlerts.filter(b => b.type === 'near').sort((a, b) => a.amount - b.amount)
      .map(b => ({ key: `near-${b.hotel.id}`, icon: Building2, label: b.hotel.name, detail: `Near limit — ${formatCurrency(b.amount)} left in budget`, to: `${deptPrefix}/budgets?focus=${b.hotel.short_code}` })),
    ...allocAlerts
      .sort((a, b) => Math.abs(1 - b.total) - Math.abs(1 - a.total))
      .map(a => ({ key: `alloc-${a.emp.id}`, icon: User, label: a.emp.name, detail: `Allocated at ${Math.round(a.total * 100)}% — ${a.total > 1 ? 'over' : 'under'} 100%`, to: `${deptPrefix || '/'}?focus=${a.emp.id}` })),
  ].slice(0, 3);

  const hasIssues = allocAlerts.length > 0 || budgetAlerts.length > 0;
  const totalIssues = allocAlerts.length + budgetAlerts.length;

  const cardBase = "rounded-2xl border p-5 space-y-3";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Alerts & Issues</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time allocation and budget monitoring
          {suppressedCount > 0 && <span className="ml-2 text-amber-500 font-medium">· {suppressedCount} employee(s) suppressed</span>}
        </p>
      </div>

      {nextActions.length > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Next Actions — top {nextActions.length} things to fix</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {nextActions.map(action => (
              <Link key={action.key} to={action.to} className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <action.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{action.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{action.detail}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {!hasIssues && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">All Clear</p>
            <p className="text-sm text-muted-foreground">No allocation or budget issues detected.</p>
          </div>
        </div>
      )}

      {hasIssues && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/8 border border-red-500/20">
          <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
            <Bell className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">{totalIssues} issue{totalIssues !== 1 ? 's' : ''} require attention</p>
            <p className="text-xs text-muted-foreground">{allocAlerts.length} allocation · {budgetAlerts.length} budget</p>
          </div>
        </div>
      )}

      {allocAlerts.length > 0 && (
        <div className={`${cardBase} border-border bg-card`}>
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <User className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Allocation Issues</h3>
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-500">{allocAlerts.length}</span>
          </div>
          <div className="space-y-2">
            {allocAlerts.map(({ emp, total, status }) => {
              const pct = Math.round(total * 100);
              const isOver = status === 'over' || status === 'close-over';
              return (
                <div key={emp.id} className={`flex items-center justify-between p-3 rounded-xl border ${
                  status.includes('close') ? 'bg-amber-500/8 border-amber-500/20' : 'bg-red-500/8 border-red-500/20'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${status.includes('close') ? 'bg-amber-500/20' : 'bg-red-500/20'}`}>
                      {isOver
                        ? <ArrowUp className={`w-3.5 h-3.5 ${status.includes('close') ? 'text-amber-500' : 'text-red-500'}`} />
                        : <ArrowDown className={`w-3.5 h-3.5 ${status.includes('close') ? 'text-amber-500' : 'text-red-500'}`} />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.title} · {emp.exclude_from_table ? 'Department Head' : emp.department}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    status.includes('close') ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'
                  }`}>
                    {isOver ? `Over: ${pct}%` : `Under: ${pct}%`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {budgetAlerts.length > 0 && (
        <div className={`${cardBase} border-border bg-card`}>
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Budget Alerts</h3>
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-500">{budgetAlerts.length}</span>
          </div>
          <div className="space-y-2">
            {budgetAlerts.map(({ hotel, allocated, budget, type, amount }) => (
              <div key={hotel.id} className={`flex items-center justify-between p-3 rounded-xl border ${
                type === 'over' ? 'bg-red-500/8 border-red-500/20' : 'bg-amber-500/8 border-amber-500/20'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${type === 'over' ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
                    <Building2 className={`w-3.5 h-3.5 ${type === 'over' ? 'text-red-500' : 'text-amber-500'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{hotel.name}</p>
                    <p className="text-xs text-muted-foreground">Budget: {formatCurrency(budget)} · Allocated: {formatCurrency(allocated)}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  type === 'over' ? 'bg-red-500/15 text-red-600 dark:text-red-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                }`}>
                  {type === 'over' ? `Over ${formatCurrency(amount)}` : `Near limit`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}