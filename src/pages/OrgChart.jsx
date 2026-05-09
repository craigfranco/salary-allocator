import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import EmployeeForm from '@/components/salary/EmployeeForm';
import { formatCurrency, HOTEL_COLORS } from '@/lib/helpers';
import { User, EyeOff, GitBranch } from 'lucide-react';

const HOTEL_ORDER = ['AURA', 'H5A', 'INK48', 'LIFE', 'RENWICK', 'SMYTH', 'CORP'];

const DEPT_STYLES = {
  REVENUE: { bg: 'bg-teal-500/15', text: 'text-teal-600 dark:text-teal-400', border: 'border-l-teal-500', label: 'Revenue' },
  ECOMM:   { bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400', border: 'border-l-orange-500', label: 'E-Commerce' },
  SALES:   { bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400', border: 'border-l-purple-500', label: 'Sales & Marketing' },
};

const TIER_ORDER = ['Executive', 'Director', 'Manager', 'Coordinator / Associate', 'Other'];

function getTier(title) {
  const t = title.toLowerCase();
  if (t.includes('executive') || t.includes('vp') || t.includes('chief')) return 'Executive';
  if (t.includes('director')) return 'Director';
  if (t.includes('manager')) return 'Manager';
  if (t.includes('coordinator') || t.includes('associate') || t.includes('specialist') || t.includes('analyst')) return 'Coordinator / Associate';
  return 'Other';
}

function EmployeeCard({ employee, onClick }) {
  const dept = DEPT_STYLES[employee.department] || {};
  const suppressed = !!employee.suppressed && employee.name !== 'Craig Franco';
  const allocEntries = Object.entries(employee.allocations || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);

  return (
    <div
      onClick={() => onClick(employee)}
      className={`rounded-lg border-l-2 ${dept.border} border border-border bg-card p-2 cursor-pointer transition-all duration-150 select-none w-36 flex-shrink-0 ${
        suppressed ? 'opacity-40' : 'hover:shadow-md hover:border-primary/30'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <div className={`w-6 h-6 rounded-md ${dept.bg} flex items-center justify-center flex-shrink-0`}>
          {suppressed ? <EyeOff className={`w-3 h-3 ${dept.text}`} /> : <User className={`w-3 h-3 ${dept.text}`} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] font-semibold truncate ${suppressed ? 'line-through text-muted-foreground' : ''}`}>{employee.name}</p>
          <p className="text-[9px] text-muted-foreground truncate leading-tight">{employee.title}</p>
        </div>
      </div>
      {allocEntries.length > 0 && (
        <div className="mt-1.5 flex h-1 rounded-full overflow-hidden bg-muted/50 gap-px">
          {allocEntries.map(([code, pct]) => (
            <div key={code} className={`${HOTEL_COLORS[code]?.bg || 'bg-slate-400'}`} style={{ width: `${pct * 100}%` }} title={`${code}: ${Math.round(pct * 100)}%`} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgChart() {
  const [editEmp, setEditEmp] = useState(null);
  const qc = useQueryClient();

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });
  const { data: hotels = [] } = useQuery({ queryKey: ['hotels'], queryFn: () => base44.entities.Hotel.list() });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setEditEmp(null); },
  });

  const sortedHotels = [...hotels].sort((a, b) => HOTEL_ORDER.indexOf(a.short_code) - HOTEL_ORDER.indexOf(b.short_code));
  const suppressedCount = employees.filter(e => e.suppressed && e.name !== 'Craig Franco').length;

  // Build tiered groups: tier → dept → employees
  const tiers = {};
  TIER_ORDER.forEach(t => { tiers[t] = { REVENUE: [], ECOMM: [], SALES: [] }; });

  employees.forEach(emp => {
    if (emp.suppressed && emp.name !== 'Craig Franco') return;
    const tier = getTier(emp.title);
    if (tiers[tier] && tiers[tier][emp.department]) {
      tiers[tier][emp.department].push(emp);
    }
  });

  // Only show tiers that have at least one employee
  const activeTiers = TIER_ORDER.filter(t => Object.values(tiers[t]).some(arr => arr.length > 0));

  const DEPTS = ['REVENUE', 'ECOMM', 'SALES'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Organization Chart</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Grouped by seniority tier and department
            {suppressedCount > 0 && <span className="ml-2 text-amber-500 font-medium">· {suppressedCount} suppressed</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
          <GitBranch className="w-3.5 h-3.5" />
          Click to edit
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/50 overflow-hidden">
        {/* Department header */}
        <div className="grid grid-cols-[120px_1fr_1fr_1fr] border-b border-border bg-muted/30">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground" />
          {DEPTS.map(dept => (
            <div key={dept} className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${DEPT_STYLES[dept].text}`}>
              {DEPT_STYLES[dept].label}
            </div>
          ))}
        </div>

        {/* Tier rows */}
        {activeTiers.map((tier, i) => (
          <div
            key={tier}
            className={`grid grid-cols-[120px_1fr_1fr_1fr] border-b border-border/50 last:border-b-0 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/10'}`}
          >
            {/* Tier label */}
            <div className="px-3 py-3 flex items-start">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">{tier}</span>
            </div>

            {/* Dept columns */}
            {DEPTS.map(dept => (
              <div key={dept} className="px-2 py-3 flex flex-wrap gap-2 border-l border-border/30">
                {tiers[tier][dept].map(emp => (
                  <EmployeeCard key={emp.id} employee={emp} onClick={setEditEmp} />
                ))}
                {tiers[tier][dept].length === 0 && (
                  <span className="text-[10px] text-muted-foreground/40 italic">—</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {editEmp && (
        <EmployeeForm
          open={!!editEmp}
          onClose={() => setEditEmp(null)}
          onSave={(form) => updateMutation.mutate({ id: editEmp.id, data: form })}
          employee={editEmp}
          hotels={sortedHotels}
          allEmployees={employees}
        />
      )}
    </div>
  );
}