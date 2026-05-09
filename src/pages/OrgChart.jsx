import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import EmployeeForm from '@/components/salary/EmployeeForm';
import { formatCurrency, HOTEL_COLORS } from '@/lib/helpers';
import { User, EyeOff, ChevronDown, ChevronRight, GitBranch } from 'lucide-react';

const HOTEL_ORDER = ['AURA', 'H5A', 'INK48', 'LIFE', 'RENWICK', 'SMYTH', 'CORP'];

const DEPT_STYLES = {
  REVENUE: { bg: 'bg-teal-500/15', text: 'text-teal-600 dark:text-teal-400', border: 'border-l-teal-500' },
  ECOMM:   { bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400', border: 'border-l-orange-500' },
  SALES:   { bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400', border: 'border-l-purple-500' },
};

function EmployeeCard({ employee, onClick }) {
  const dept = DEPT_STYLES[employee.department] || {};
  // Craig Franco is always shown as a normal leader, never faded
  const suppressed = !!employee.suppressed && employee.name !== 'Craig Franco';
  const allocEntries = Object.entries(employee.allocations || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);

  return (
    <div
      onClick={() => onClick(employee)}
      className={`rounded-xl border-l-2 ${dept.border} border border-border bg-card p-3 cursor-pointer transition-all duration-150 select-none w-48 flex-shrink-0 ${
        suppressed ? 'opacity-40' : 'hover:shadow-md hover:border-primary/30'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg ${dept.bg} flex items-center justify-center flex-shrink-0`}>
          {suppressed ? <EyeOff className={`w-3.5 h-3.5 ${dept.text}`} /> : <User className={`w-3.5 h-3.5 ${dept.text}`} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold truncate ${suppressed ? 'line-through text-muted-foreground' : ''}`}>{employee.name}</p>
          <p className="text-[10px] text-muted-foreground truncate leading-tight">{employee.title}</p>
        </div>
      </div>
      <div className="mt-1 text-[10px] font-bold text-muted-foreground">{formatCurrency(employee.annual_salary)}</div>
      {allocEntries.length > 0 && (
        <div className="mt-2 flex h-1 rounded-full overflow-hidden bg-muted/50 gap-px">
          {allocEntries.map(([code, pct]) => (
            <div key={code} className={`${HOTEL_COLORS[code]?.bg || 'bg-slate-400'}`} style={{ width: `${pct * 100}%` }} title={`${code}: ${Math.round(pct * 100)}%`} />
          ))}
        </div>
      )}
    </div>
  );
}

// Renders a node and all its subtree in a top-down horizontal layout
function OrgNode({ employee, allEmployees, onEdit, collapsed, onToggle }) {
  const directReports = allEmployees.filter(e => e.manager_id === employee.id);
  const isCollapsed = collapsed[employee.id];

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <EmployeeCard employee={employee} onClick={onEdit} />

      {/* Toggle + children */}
      {directReports.length > 0 && (
        <>
          <button
            className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => onToggle(employee.id)}
          >
            {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {directReports.length} report{directReports.length !== 1 ? 's' : ''}
          </button>

          {!isCollapsed && (
            <>
              {/* Vertical connector line */}
              <div className="w-px h-4 bg-border" />
              {/* Horizontal row of children */}
              <div className="flex flex-row items-start gap-4 relative">
                {/* Horizontal line spanning children */}
                {directReports.length > 1 && (
                  <div
                    className="absolute top-0 left-0 right-0 h-px bg-border"
                    style={{ top: 0 }}
                  />
                )}
                {directReports.map((report) => (
                  <div key={report.id} className="flex flex-col items-center">
                    {/* Small vertical stub down to child card */}
                    <div className="w-px h-4 bg-border" />
                    <OrgNode
                      employee={report}
                      allEmployees={allEmployees}
                      onEdit={onEdit}
                      collapsed={collapsed}
                      onToggle={onToggle}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function OrgChart() {
  const [editEmp, setEditEmp] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const qc = useQueryClient();

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });
  const { data: hotels = [] } = useQuery({ queryKey: ['hotels'], queryFn: () => base44.entities.Hotel.list() });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setEditEmp(null); },
  });

  const sortedHotels = [...hotels].sort((a, b) => HOTEL_ORDER.indexOf(a.short_code) - HOTEL_ORDER.indexOf(b.short_code));
  const suppressedCount = employees.filter(e => e.suppressed).length;
  const rawTopLevel = employees.filter(e => !e.manager_id);

  // Craig Franco is always shown as department leader regardless of suppressed status
  // Other suppressed top-level employees have their reports promoted up
  const topLevel = rawTopLevel.flatMap(emp => {
    if (emp.suppressed && emp.name !== 'Craig Franco') {
      return employees.filter(e => e.manager_id === emp.id);
    }
    return [emp];
  });

  const toggleCollapse = (id) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Organization Chart</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Built from reporting relationships set in Salary Allocations
            {suppressedCount > 0 && <span className="ml-2 text-amber-500 font-medium">· {suppressedCount} suppressed</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
          <GitBranch className="w-3.5 h-3.5" />
          Click to edit
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/50 p-6 overflow-auto">
        {/* Top-level row */}
        <div className="flex flex-row items-start gap-6 justify-start min-w-max">
          {topLevel.map((emp) => (
            <OrgNode
              key={emp.id}
              employee={emp}
              allEmployees={employees}
              onEdit={setEditEmp}
              collapsed={collapsed}
              onToggle={toggleCollapse}
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