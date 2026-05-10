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

function EmployeeCard({ employee, onClick, hotelMap }) {
  const dept = employee.exclude_from_table ? CRAIG_STYLE : (DEPT_STYLES[employee.department] || {});
  const suppressed = !!employee.suppressed;
  const allocEntries = Object.entries(employee.allocations || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);

  return (
    <div
      onClick={() => onClick(employee)}
      className={`rounded-lg border ${dept.border} border-2 bg-card p-2 cursor-pointer transition-all duration-150 select-none w-44 flex-shrink-0 shadow-sm ${
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
        <>
          <div className="mt-1.5 flex h-1 rounded-full overflow-hidden bg-muted/50 gap-px">
            {allocEntries.map(([code, pct]) => (
              <div key={code} className={`${HOTEL_COLORS[code]?.bg || 'bg-slate-400'}`} style={{ width: `${pct * 100}%` }} title={`${code}: ${Math.round(pct * 100)}%`} />
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {allocEntries.map(([code, pct]) => (
              <span key={code} className={`text-[8px] font-bold px-1 py-0.5 rounded-full ${HOTEL_COLORS[code]?.badge || 'bg-muted/50 text-muted-foreground'}`}>
                {hotelMap[code] || code} {Math.round(pct * 100)}%
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const CARD_W = 176; // w-44
const CARD_GAP = 16; // gap-4
const SLOT_W = CARD_W + CARD_GAP; // width per child slot

// Returns total pixel width that a subtree occupies
function subtreeWidth(employeeId, childrenMap) {
  const children = childrenMap[employeeId] || [];
  if (children.length === 0) return CARD_W;
  const total = children.reduce((sum, c) => sum + subtreeWidth(c.id, childrenMap), 0);
  return total + CARD_GAP * (children.length - 1);
}

// Recursive tree node
function OrgNode({ employee, childrenMap, onClick, hotelMap }) {
  const children = childrenMap[employee.id] || [];
  const myWidth = subtreeWidth(employee.id, childrenMap);

  // Compute cumulative widths to find center of each child subtree
  const childWidths = children.map(c => subtreeWidth(c.id, childrenMap));
  let cumulative = 0;
  const childCenters = childWidths.map(w => {
    const center = cumulative + w / 2;
    cumulative += w + CARD_GAP;
    return center;
  });

  const firstCenter = childCenters[0] ?? 0;
  const lastCenter = childCenters[childCenters.length - 1] ?? 0;

  return (
    <div className="flex flex-col items-center" style={{ width: myWidth }}>
      <EmployeeCard employee={employee} onClick={onClick} hotelMap={hotelMap} />
      {children.length > 0 && (
        <>
          {/* Vertical line from parent down */}
          <div className="w-px h-6 bg-border" />
          {/* Horizontal bar spanning first to last child center */}
          {children.length > 1 && (
            <div className="relative h-px bg-transparent" style={{ width: myWidth }}>
              <div
                className="absolute top-0 h-px bg-border"
                style={{ left: firstCenter, width: lastCenter - firstCenter }}
              />
            </div>
          )}
          {/* Children row with vertical drops */}
          <div className="flex items-start" style={{ width: myWidth }}>
            {children.map((child, idx) => (
              <div key={child.id} className="flex flex-col items-center" style={{ width: childWidths[idx], marginRight: idx < children.length - 1 ? CARD_GAP : 0 }}>
                <div className="w-px h-6 bg-border" />
                <OrgNode
                  employee={child}
                  childrenMap={childrenMap}
                  onClick={onClick}
                  hotelMap={hotelMap}
                />
              </div>
            ))}
          </div>
        </>
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
  const hotelMap = Object.fromEntries(hotels.map(h => [h.short_code, h.name]));

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
              hotelMap={hotelMap}
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