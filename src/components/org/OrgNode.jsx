import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { formatCurrency, HOTEL_COLORS } from '@/lib/helpers';
import { User, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';

const DEPT_STYLES = {
  REVENUE: { bg: 'bg-teal-500/15', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/30' },
  ECOMM:   { bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
  SALES:   { bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
};

function EmployeeMiniCard({ employee, provided, snapshot, onClick }) {
  const dept = DEPT_STYLES[employee.department] || {};
  const suppressed = !!employee.suppressed;
  const allocEntries = Object.entries(employee.allocations || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={() => onClick(employee)}
      className={`rounded-xl border bg-card p-3 cursor-pointer transition-all duration-150 select-none ${
        snapshot.isDragging
          ? 'shadow-xl border-primary/50 rotate-1 scale-105'
          : suppressed
          ? 'opacity-40 border-border'
          : `hover:shadow-md hover:border-primary/30 border-border`
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg ${dept.bg} flex items-center justify-center flex-shrink-0`}>
          {suppressed
            ? <EyeOff className={`w-3.5 h-3.5 ${dept.text}`} />
            : <User className={`w-3.5 h-3.5 ${dept.text}`} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold truncate ${suppressed ? 'line-through text-muted-foreground' : ''}`}>
            {employee.name}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">{employee.title}</p>
        </div>
        <span className="text-[10px] font-bold text-muted-foreground shrink-0">{formatCurrency(employee.annual_salary)}</span>
      </div>
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

export default function OrgNode({ employee, allEmployees, depth = 0, onEdit, collapsed, onToggle }) {
  const dept = DEPT_STYLES[employee.department] || {};
  const suppressed = !!employee.suppressed;
  const directReports = allEmployees.filter(e => e.manager_id === employee.id);
  const isCollapsed = collapsed[employee.id];

  return (
    <div className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-border' : ''}`}>
      {/* Manager card (draggable + droppable target) */}
      <Draggable draggableId={employee.id} index={0}>
        {(provided, snapshot) => (
          <EmployeeMiniCard
            employee={employee}
            provided={provided}
            snapshot={snapshot}
            onClick={onEdit}
          />
        )}
      </Draggable>

      {/* Toggle + drop zone for reports */}
      {directReports.length > 0 && (
        <button
          className="flex items-center gap-1 mt-1 mb-1 ml-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onToggle(employee.id)}
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {directReports.length} report{directReports.length > 1 ? 's' : ''}
        </button>
      )}

      {!isCollapsed && (
        <Droppable droppableId={employee.id} type="EMPLOYEE">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-2 mt-1 min-h-[4px] rounded-lg transition-colors duration-150 ${
                snapshot.isDraggingOver ? 'bg-primary/5 ring-1 ring-primary/20 p-2' : ''
              }`}
            >
              {directReports.map((report, idx) => (
                <Draggable key={report.id} draggableId={report.id} index={idx}>
                  {(prov, snap) => (
                    <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                      <OrgNode
                        employee={report}
                        allEmployees={allEmployees}
                        depth={depth + 1}
                        onEdit={onEdit}
                        collapsed={collapsed}
                        onToggle={onToggle}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
    </div>
  );
}