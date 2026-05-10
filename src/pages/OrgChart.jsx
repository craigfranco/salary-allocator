import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import EmployeeForm from '@/components/salary/EmployeeForm';
import { formatCurrency, HOTEL_COLORS } from '@/lib/helpers';
import { User, EyeOff, GitBranch } from 'lucide-react';

const HOTEL_ORDER = ['AURA', 'H5A', 'INK48', 'LIFE', 'RENWICK', 'SMYTH', 'CORP'];

const DEPT_STYLES = {
  REVENUE: { bg: 'bg-teal-500/15', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500', label: 'Revenue' },
  ECOMM:   { bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500', label: 'E-Commerce' },
  SALES:   { bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500', label: 'Sales & Marketing' },
};

const CRAIG_STYLE = { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500', label: 'Head of Commercial' };

function EmployeeCard({ employee, onClick }) {
  const dept = employee.exclude_from_table ? CRAIG_STYLE : (DEPT_STYLES[employee.department] || {});
  const suppressed = !!employee.suppressed;
  const allocEntries = Object.entries(employee.allocations || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);

  return (
    <div
      onClick={() => onClick(employee)}
      className={`rounded-lg border ${dept.border} border-2 bg-card p-2 cursor-pointer transition-all duration-150 select-none w-40 flex-shrink-0 shadow-sm ${
        suppressed ? 'opacity-40' : 'hover:shadow-md hover:scale-[1.02]'
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

// Recursive tree node
function OrgNode({ employee, childrenMap, onClick, isLast, depth }) {
  const children = childrenMap[employee.id] || [];

  return (
    <div className="flex flex-col items-center">
      <EmployeeCard employee={employee} onClick={onClick} />
      {children.length > 0 && (
        <div className="flex flex-col items-center">
          {/* Vertical line down from parent */}
          <div className="w-px h-6 bg-border" />
          {/* Horizontal connector */}
          {children.length > 1 && (
            <div className="relative flex items-start" style={{ width: `${children.length * 176}px` }}>
              <div
                className="absolute top-0 bg-border"
                style={{
                  height: '1px',
                  left: `${88}px`,
                  right: `${88}px`,
                }}
              />
            </div>
          )}
          {/* Children row */}
          <div className="flex gap-4 items-start">
            {children.map((child, idx) => (
              <div key={child.id} className="flex flex-col items-center">
                {children.length > 1 && <div className="w-px h-6 bg-border" />}
                <OrgNode
                  employee={child}
                  childrenMap={childrenMap}
                  onClick={onClick}
                  isLast={idx === children.length - 1}
                  depth={depth + 1}
                />
              </div>
            ))}
          </div>
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

  // Build manager → children map
  const childrenMap = {};
  const activeEmployees = employees.filter(e => !e.suppressed);

  activeEmployees.forEach(emp => {
    const mid = emp.manager_id && emp.manager_id.trim() ? emp.manager_id : null;
    if (!childrenMap[mid]) childrenMap[mid] = [];
    childrenMap[mid].push(emp);
  });

  // Sort children by title length (approximate seniority)
  Object.keys(childrenMap).forEach(k => {
    childrenMap[k].sort((a, b) => a.name.localeCompare(b.name));
  });

  // Roots = employees with no manager or whose manager isn't in the active list
  const activeIds = new Set(activeEmployees.map(e => e.id));
  const roots = activeEmployees.filter(e => !e.manager_id || !e.manager_id.trim() || !activeIds.has(e.manager_id));

  const suppressedCount = employees.filter(e => e.suppressed).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Organization Chart</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Reporting hierarchy
            {suppressedCount > 0 && <span className="ml-2 text-amber-500 font-medium">· {suppressedCount} suppressed (hidden)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
          <GitBranch className="w-3.5 h-3.5" />
          Click a card to edit
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4">
        {Object.entries(DEPT_STYLES).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm border-2 ${val.border} ${val.bg}`} />
            <span className={`text-xs font-medium ${val.text}`}>{val.label}</span>
          </div>
        ))}
      </div>

      <div className="overflow-auto rounded-2xl border border-border bg-card/50 p-6">
        <div className="flex gap-12 items-start min-w-max">
          {roots.map(root => (
            <OrgNode
              key={root.id}
              employee={root}
              childrenMap={childrenMap}
              onClick={setEditEmp}
              isLast={true}
              depth={0}
            />
          ))}
        </div>
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