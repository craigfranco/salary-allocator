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

function EmployeeCard({ employee, provided, snapshot, onClick }) {
  const dept = DEPT_STYLES[employee.department] || {};
  const suppressed = !!employee.suppressed;
  const allocEntries = Object.entries(employee.allocations || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={() => onClick(employee)}
      className={`rounded-xl border-l-2 ${dept.border} border border-border bg-card p-3 cursor-grab active:cursor-grabbing transition-all duration-150 select-none ${
        snapshot.isDragging
          ? 'shadow-2xl scale-105 rotate-1 opacity-95 z-50'
          : suppressed
          ? 'opacity-40'
          : 'hover:shadow-md hover:border-primary/30'
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

function OrgNode({ employee, allEmployees, depth, onEdit, collapsed, onToggle, inGrid = false }) {
  const directReports = allEmployees.filter(e => e.manager_id === employee.id);
  const isCollapsed = collapsed[employee.id];
  const isSuppressed = !!employee.suppressed;

  return (
    <div className={inGrid ? '' : depth > 0 ? 'ml-5 pl-4 border-l-2 border-dashed border-border mt-2' : 'mt-2'}>
      <Draggable draggableId={employee.id} index={0}>
        {(provided, snapshot) => (
          <EmployeeCard employee={employee} provided={provided} snapshot={snapshot} onClick={onEdit} />
        )}
      </Draggable>

      {directReports.length > 0 && (
        <button
          className="flex items-center gap-1 mt-1 mb-1 ml-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onToggle(employee.id)}
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {directReports.length} direct report{directReports.length !== 1 ? 's' : ''}
        </button>
      )}

      {!isCollapsed && (
        <Droppable droppableId={employee.id} type="EMPLOYEE">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`min-h-[8px] rounded-lg transition-all duration-150 ${
                snapshot.isDraggingOver ? 'bg-primary/5 ring-1 ring-primary/20 p-2' : ''
              } ${isSuppressed && directReports.length > 1 ? 'grid grid-cols-2 gap-2' : 'space-y-1'}`}
            >
              {directReports.map((report, idx) => (
                <Draggable key={report.id} draggableId={`child-${report.id}`} index={idx}>
                  {(prov, snap) => (
                    <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                      <OrgNode
                        employee={report}
                        allEmployees={allEmployees}
                        depth={depth + 1}
                        onEdit={onEdit}
                        collapsed={collapsed}
                        onToggle={onToggle}
                        inGrid={isSuppressed && directReports.length > 1}
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
  const topLevel = employees.filter(e => !e.manager_id);

  const toggleCollapse = (id) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  const onDragEnd = (result) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    // Strip the "child-" prefix used on nested draggables
    const employeeId = draggableId.startsWith('child-') ? draggableId.slice(6) : draggableId;
    const newManagerId = destination.droppableId === 'UNASSIGNED' || destination.droppableId === 'ROOT'
      ? ''
      : destination.droppableId;

    if (newManagerId === employeeId) return; // Can't be own manager

    // Prevent circular reference: new manager can't be a direct report of the dragged employee
    const wouldCreateCycle = (managerId, targetId) => {
      if (!managerId) return false;
      if (managerId === targetId) return true;
      const mgr = employees.find(e => e.id === managerId);
      return mgr ? wouldCreateCycle(mgr.manager_id, targetId) : false;
    };
    if (wouldCreateCycle(newManagerId, employeeId)) return;

    updateMutation.mutate({ id: employeeId, data: { manager_id: newManagerId } });
  };

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
          Drag to reassign · Click to edit
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hierarchy tree */}
          <div className="lg:col-span-2 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Reporting Structure</p>
            <Droppable droppableId="ROOT" type="EMPLOYEE">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 min-h-[40px] rounded-xl transition-all duration-150 ${
                    snapshot.isDraggingOver ? 'bg-primary/5 ring-1 ring-primary/20 p-3' : ''
                  }`}
                >
                  {topLevel.map((emp, idx) => (
                    <Draggable key={emp.id} draggableId={emp.id} index={idx}>
                      {(prov, snap) => (
                        <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                          <OrgNode
                            employee={emp}
                            allEmployees={employees}
                            depth={0}
                            onEdit={setEditEmp}
                            collapsed={collapsed}
                            onToggle={toggleCollapse}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Unassigned drop zone */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              No Manager (Top Level)
            </p>
            <Droppable droppableId="UNASSIGNED" type="EMPLOYEE">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[120px] rounded-xl border-2 border-dashed transition-all duration-150 p-3 space-y-2 ${
                    snapshot.isDraggingOver
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border bg-muted/20'
                  }`}
                >
                  {!snapshot.isDraggingOver && topLevel.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Drop here to remove manager</p>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>

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