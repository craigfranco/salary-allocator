import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle } from 'lucide-react';
import SalaryTableRow from '@/components/salary/SalaryTableRow';
import SearchBar from '@/components/salary/SearchBar';
import ExportButton from '@/components/salary/ExportButton';
import ScenarioManager from '@/components/salary/ScenarioManager';
import EmployeeForm from '@/components/salary/EmployeeForm';
import { getTotalAllocation, getAllocationStatus, formatCurrency, HOTEL_SHORT_NAMES, orderHotelsByRevenue, spreadTo100 } from '@/lib/helpers';
import { DEPT_LABELS, DEPT_BUDGET_FIELDS } from '@/lib/deptConfig';
import { useScenario } from '@/lib/ScenarioContext';
import { useRedactedIds } from '@/lib/RedactionContext';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

export default function SalaryTable({ dept = 'COMMERCIAL' }) {
  const isCommercial = dept === 'COMMERCIAL';
  const budgetField = DEPT_BUDGET_FIELDS[dept];
  const budgetLabel = dept === 'COMMERCIAL' ? 'S&M Payroll Budget' : `${DEPT_LABELS[dept]} Payroll Budget`;
  const pctBudgetLabel = dept === 'COMMERCIAL' ? '% of S&M Budget' : '% of Budget';
  const budgetSummaryLabel = dept === 'COMMERCIAL' ? 'S&M Payroll\nBudget' : `${DEPT_LABELS[dept]}\nBudget`;
  const pctBudgetSummaryLabel = dept === 'COMMERCIAL' ? '% of S&M\nBudget' : '% of\nBudget';
  const memberNoun = dept === 'COMMERCIAL' ? 'employees' : 'team members';
  const [formOpen, setFormOpen] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [deleteEmp, setDeleteEmp] = useState(null);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [allocFilter, setAllocFilter] = useState('');
  const [hotelFilter, setHotelFilter] = useState('');
  const qc = useQueryClient();
  const { activeScenario, scenarioData, setScenarioData } = useScenario(dept);
  const { redactedIds } = useRedactedIds();

  const entity = isCommercial ? base44.entities.Employee : base44.entities.DeptStaff;
  const { data: employees = [] } = useQuery({
    queryKey: isCommercial ? ['employees'] : ['deptstaff', dept],
    queryFn: () => isCommercial ? base44.entities.Employee.list() : base44.entities.DeptStaff.filter({ department: dept }),
  });
  const { data: hotels = [] } = useQuery({ queryKey: ['hotels'], queryFn: () => base44.entities.Hotel.list() });

  // Use scenario data if scenario is active, otherwise use DB employees
  const displayEmployees = Array.isArray(scenarioData) ? scenarioData : (Array.isArray(employees) ? employees : []);

  // Deep link from Alerts: ?focus=<employeeId> filters the table to that row
  const handledFocus = useRef(false);
  useEffect(() => {
    if (handledFocus.current) return;
    const urlParams = new URLSearchParams(window.location.search);
    const focusId = urlParams.get('focus');
    if (!focusId) return;
    const emp = displayEmployees.find(e => e.id === focusId);
    if (!emp) return;
    handledFocus.current = true;
    setSearch(emp.name);
    setDeptFilter(''); setAllocFilter(''); setHotelFilter('');
    window.history.replaceState({}, '', window.location.pathname);
  }, [displayEmployees]);

  const sortedHotels = orderHotelsByRevenue(hotels);
  const tableHotels = sortedHotels.filter(h => h.short_code !== 'CORP');

  const invalidateStaff = () => qc.invalidateQueries({ queryKey: isCommercial ? ['employees'] : ['deptstaff', dept] });
  const createMutation = useMutation({
    mutationFn: (data) => entity.create(data),
    onSuccess: () => { invalidateStaff(); setFormOpen(false); setEditEmp(null); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entity.update(id, data),
    onSuccess: () => { invalidateStaff(); setFormOpen(false); setEditEmp(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => entity.delete(id),
    onSuccess: () => { invalidateStaff(); setDeleteEmp(null); },
  });

  const handleDelete = (emp) => {
    if (activeScenario && Array.isArray(scenarioData)) {
      const updated = scenarioData.filter(e => e.id !== emp.id);
      setScenarioData(updated);
      setDeleteEmp(null);
    } else {
      deleteMutation.mutate(emp.id);
    }
  };

  const handleAllocChange = (emp, hotelCode, newPct) => {
    if (activeScenario && Array.isArray(scenarioData)) {
      const updated = JSON.parse(JSON.stringify(scenarioData));
      const empIdx = updated.findIndex(e => e.id === emp.id);
      if (empIdx !== -1) {
        const newAllocs = { ...(updated[empIdx].allocations || {}), [hotelCode]: newPct };
        if (newPct === 0) delete newAllocs[hotelCode];
        updated[empIdx].allocations = newAllocs;
        setScenarioData(updated);
      }
    } else {
      const newAllocs = { ...(emp.allocations || {}), [hotelCode]: newPct };
      if (newPct === 0) delete newAllocs[hotelCode];
      updateMutation.mutate({ id: emp.id, data: { allocations: newAllocs } });
    }
  };

  const handleFixTo100 = (emp) => {
    const newAllocs = spreadTo100(emp.allocations, emp.locked_hotels);
    if (activeScenario && Array.isArray(scenarioData)) {
      const updated = JSON.parse(JSON.stringify(scenarioData));
      const empIdx = updated.findIndex(e => e.id === emp.id);
      if (empIdx !== -1) {
        updated[empIdx].allocations = newAllocs;
        setScenarioData(updated);
      }
    } else {
      updateMutation.mutate({ id: emp.id, data: { allocations: newAllocs } });
    }
  };

  const handleSave = (form) => {
    const payload = isCommercial ? form : { ...form, department: dept };
    if (activeScenario && Array.isArray(scenarioData)) {
      const updated = JSON.parse(JSON.stringify(scenarioData));
      if (editEmp) {
        const empIdx = updated.findIndex(e => e.id === editEmp.id);
        if (empIdx !== -1) {
          updated[empIdx] = { ...updated[empIdx], ...form };
        }
      } else {
        updated.push({ ...payload, id: 'new_' + Date.now() });
      }
      setScenarioData(updated);
      setFormOpen(false);
      setEditEmp(null);
    } else if (editEmp) {
      updateMutation.mutate({ id: editEmp.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDuplicate = (emp) => {
    const { id, created_date, updated_date, created_by_id, ...cloneData } = emp;
    const dup = { ...cloneData, name: `${emp.name} (Copy)` };
    if (activeScenario && Array.isArray(scenarioData)) {
      const updated = [...JSON.parse(JSON.stringify(scenarioData)), { ...dup, id: 'dup_' + Date.now() }];
      setScenarioData(updated);
    } else {
      createMutation.mutate(dup);
    }
  };

  const handleToggleSuppress = (emp) => {
    if (activeScenario && Array.isArray(scenarioData)) {
      const updated = JSON.parse(JSON.stringify(scenarioData));
      const empIdx = updated.findIndex(e => e.id === emp.id);
      if (empIdx !== -1) {
        updated[empIdx].suppressed = !updated[empIdx].suppressed;
        setScenarioData(updated);
      }
    } else {
      updateMutation.mutate({ id: emp.id, data: { suppressed: !emp.suppressed } });
    }
  };

  const activeEmployees = displayEmployees.filter(e => !e.suppressed && !e.exclude_from_table);
  const suppressedCount = displayEmployees.filter(e => e.suppressed && !e.exclude_from_table).length;

  const hotelTotals = {};
  sortedHotels.forEach(h => {
    hotelTotals[h.short_code] = activeEmployees.reduce((sum, emp) => sum + ((emp.allocations?.[h.short_code] || 0) * emp.annual_salary), 0);
  });

  const propertyHotels = sortedHotels.filter(h => h.short_code !== 'CORP');

  // Total payroll: only count salary portions allocated to non-CORP hotels
  const totalPayroll = activeEmployees.reduce((sum, emp) => {
    return sum + propertyHotels.reduce((s, h) => s + ((emp.allocations?.[h.short_code] || 0) * emp.annual_salary), 0);
  }, 0);
  const totalRoomRev = propertyHotels.reduce((s, h) => s + (h.total_revenue_budget || 0), 0);
  const totalPayrollPct = totalRoomRev > 0 ? (totalPayroll / totalRoomRev) * 100 : null;
  const totalDeptBudget = propertyHotels.reduce((s, h) => s + (h[budgetField] || 0), 0);
  const totalBudgetDiff = totalDeptBudget > 0 ? totalPayroll - totalDeptBudget : null;

  const sortedEmployees = [...displayEmployees].sort((a, b) => {
    if (a.suppressed && !b.suppressed) return -1;
    if (!a.suppressed && b.suppressed) return 1;
    if (isCommercial) {
      const deptOrder = ['REVENUE', 'ECOMM', 'SALES'];
      const d = deptOrder.indexOf(a.department) - deptOrder.indexOf(b.department);
      if (d !== 0) return d;
    }
    return b.annual_salary - a.annual_salary;
  });

  const q = search.toLowerCase();
  const filteredEmployees = sortedEmployees.filter(emp => {
    if (emp.exclude_from_table) return false;
    if (emp.suppressed && allocFilter !== 'suppressed') return false;
    if (q && !emp.name.toLowerCase().includes(q) && !emp.title.toLowerCase().includes(q) && !emp.department.toLowerCase().includes(q)) return false;
    if (deptFilter && emp.department !== deptFilter) return false;
    if (allocFilter === 'exact' && getAllocationStatus(getTotalAllocation(emp.allocations)) !== 'exact') return false;
    if (allocFilter === 'issues' && getAllocationStatus(getTotalAllocation(emp.allocations)) === 'exact') return false;
    if (allocFilter === 'suppressed' && !emp.suppressed) return false;
    if (hotelFilter && !((emp.allocations?.[hotelFilter] || 0) > 0)) return false;
    return true;
  });

  const issueEmployees = activeEmployees.filter(e => !e.exclude_from_table && getAllocationStatus(getTotalAllocation(e.allocations)) !== 'exact');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Salary Allocations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {activeEmployees.length} {memberNoun} · {sortedHotels.filter(h => h.short_code !== 'CORP').length} properties
            {suppressedCount > 0 && (
              <button
                onClick={() => setAllocFilter(allocFilter === 'suppressed' ? '' : 'suppressed')}
                className={`ml-2 font-medium transition-colors ${allocFilter === 'suppressed' ? 'text-amber-600 underline' : 'text-amber-500 hover:text-amber-600 hover:underline'}`}
              >
                · {suppressedCount} suppressed
              </button>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ScenarioManager employees={employees} department={dept} />
          <ExportButton employees={sortedEmployees} hotels={sortedHotels} hotelTotals={hotelTotals} />
          <Button onClick={() => { setEditEmp(null); setFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> {isCommercial ? 'Add Employee' : 'Add Team Member'}
          </Button>
        </div>
      </div>

      <SearchBar
        showDepartment={isCommercial}
        search={search} setSearch={setSearch}
        department={deptFilter} setDepartment={setDeptFilter}
        allocationFilter={allocFilter} setAllocationFilter={setAllocFilter}
        hotelFilter={hotelFilter} setHotelFilter={setHotelFilter}
        hotels={sortedHotels}
      />

      {issueEmployees.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">
            <span className="font-semibold">{issueEmployees.length} employee(s)</span> have allocation issues: {issueEmployees.map(e => e.name).join(', ')}
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-border shadow-sm overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ backgroundColor: '#2d4b5e' }}>
                <th className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground sticky left-0 z-10" style={{ backgroundColor: '#2d4b5e' }}>Dept</th>
                <th className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground">Title</th>
                <th className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground">Name</th>
                <th className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground">Reports To</th>
                <th className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground text-right">Salary</th>
                <th className="px-1.5 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground text-center min-w-[48px]">Total</th>
                {sortedHotels.map(h => (
                  <th key={h.short_code} className="px-1.5 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground text-center min-w-[56px]">
                    {HOTEL_SHORT_NAMES[h.short_code] || h.short_code}
                  </th>
                ))}
                <th className="px-1.5 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp, idx) => (
                <SalaryTableRow
                  key={emp.id}
                  employee={emp}
                  hotels={sortedHotels}
                  onAllocChange={handleAllocChange}
                  onFix={handleFixTo100}
                  onEdit={(e) => { setEditEmp(e); setFormOpen(true); }}
                  onDelete={setDeleteEmp}
                  onToggleSuppress={handleToggleSuppress}
                  onDuplicate={handleDuplicate}
                  isOdd={idx % 2 === 1}
                  highlight={q && (emp.name.toLowerCase().includes(q) || emp.title.toLowerCase().includes(q))}
                  managerName={displayEmployees.find(e => e.id === emp.manager_id)?.name || ''}
                  isRedacted={redactedIds.has(emp.id)}
                  />
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={6 + sortedHotels.length + 1} className="text-center py-12 text-muted-foreground text-sm">
                    No employees match your filters.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-primary/10 border-t-2 border-primary/20">
                <td colSpan={5} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-foreground sticky left-0 bg-primary/10 z-10">
                  Budget vs. Allocated Payroll
                </td>
                <td />
                {sortedHotels.map(h => (
                  <td key={h.short_code} className="px-1.5 py-2 text-[10px] font-semibold leading-tight text-center text-foreground" title={h.name}>
                    {h.name}
                  </td>
                ))}
                <td />
              </tr>
              <tr className="bg-primary/5 border-t border-border/40">
                <td colSpan={5} className="px-3 py-1.5 text-xs font-semibold text-muted-foreground sticky left-0 bg-primary/5 z-10">Allocated Payroll</td>
                <td />
                {sortedHotels.map(h => (
                  <td key={h.short_code} className="px-1.5 py-1.5 text-center">
                    <span className="text-xs font-semibold tabular-nums">{formatCurrency(hotelTotals[h.short_code])}</span>
                  </td>
                ))}
                <td />
              </tr>
              <tr className="bg-primary/5 border-t border-border/40">
                <td colSpan={5} className="px-3 py-1.5 text-xs font-semibold text-muted-foreground sticky left-0 bg-primary/5 z-10">Budget Total Revenue</td>
                <td />
                {sortedHotels.map(h => {
                  if (h.short_code === 'CORP') return <td key={h.short_code} />;
                  return (
                    <td key={h.short_code} className="px-1.5 py-1.5 text-center">
                      <span className="text-xs font-medium tabular-nums text-muted-foreground">{h.total_revenue_budget > 0 ? formatCurrency(h.total_revenue_budget) : '—'}</span>
                    </td>
                  );
                })}
                <td />
              </tr>
              <tr className="bg-primary/5 border-t border-border/40">
                <td colSpan={5} className="px-3 py-1.5 text-xs font-semibold text-muted-foreground sticky left-0 bg-primary/5 z-10">{budgetLabel}</td>
                <td />
                {sortedHotels.map(h => {
                  if (h.short_code === 'CORP') return <td key={h.short_code} />;
                  const budget = h[budgetField] || 0;
                  const allocated = hotelTotals[h.short_code] || 0;
                  const isOver = budget > 0 && allocated > budget;
                  const isNear = budget > 0 && allocated / budget > 0.95 && allocated <= budget;
                  return (
                    <td key={h.short_code} className="px-1.5 py-1.5 text-center">
                      <span className={`text-xs font-semibold tabular-nums ${isOver ? 'text-red-500' : isNear ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {budget > 0 ? formatCurrency(budget) : '—'}
                      </span>
                    </td>
                  );
                })}
                <td />
              </tr>
              <tr className="bg-primary/5 border-t border-border/40">
                <td colSpan={5} className="px-3 py-1.5 text-xs font-semibold text-muted-foreground sticky left-0 bg-primary/5 z-10">Room Count</td>
                <td />
                {sortedHotels.map(h => {
                  if (h.short_code === 'CORP') return <td key={h.short_code} />;
                  return (
                    <td key={h.short_code} className="px-1.5 py-1.5 text-center">
                      <span className="text-xs font-medium tabular-nums text-muted-foreground">{h.room_count || '—'}</span>
                    </td>
                  );
                })}
                <td />
              </tr>
              <tr className="bg-primary/5 border-t border-border/40">
                <td colSpan={5} className="px-3 py-1.5 text-xs font-semibold text-muted-foreground sticky left-0 bg-primary/5 z-10">Over / (Short) Budget</td>
                <td />
                {sortedHotels.map(h => {
                  if (h.short_code === 'CORP') return <td key={h.short_code} />;
                  const budget = h[budgetField] || 0;
                  const allocated = hotelTotals[h.short_code] || 0;
                  const budgetDiff = budget > 0 ? allocated - budget : null;
                  return (
                    <td key={h.short_code} className="px-1.5 py-1.5 text-center">
                      <span className={`text-xs font-semibold tabular-nums ${budgetDiff > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {budgetDiff !== null ? (budgetDiff > 0 ? '+' : '') + formatCurrency(budgetDiff) : '—'}
                      </span>
                    </td>
                  );
                })}
                <td />
              </tr>
              <tr className="bg-primary/5 border-t border-border/40">
                <td colSpan={5} className="px-3 py-1.5 text-xs font-semibold text-muted-foreground sticky left-0 bg-primary/5 z-10">% of Total Revenue</td>
                <td />
                {sortedHotels.map(h => {
                  if (h.short_code === 'CORP') return <td key={h.short_code} />;
                  const allocated = hotelTotals[h.short_code] || 0;
                  const roomRev = h.total_revenue_budget || 0;
                  const payrollPct = roomRev > 0 ? (allocated / roomRev) * 100 : null;
                  return (
                    <td key={h.short_code} className="px-1.5 py-1.5 text-center">
                      <span className={`text-xs font-semibold tabular-nums ${payrollPct === null ? 'text-muted-foreground' : payrollPct > 5 ? 'text-red-500' : payrollPct > 3 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {payrollPct !== null ? `${payrollPct.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                  );
                })}
                <td />
              </tr>
              <tr className="bg-primary/5 border-t border-border/40">
                <td colSpan={5} className="px-3 py-1.5 text-xs font-semibold text-muted-foreground sticky left-0 bg-primary/5 z-10">{pctBudgetLabel}</td>
                <td />
                {sortedHotels.map(h => {
                  if (h.short_code === 'CORP') return <td key={h.short_code} />;
                  const allocated = hotelTotals[h.short_code] || 0;
                  const budget = h[budgetField] || 0;
                  const budgetPct = budget > 0 ? (allocated / budget) * 100 : null;
                  return (
                    <td key={h.short_code} className="px-1.5 py-1.5 text-center">
                      <span className={`text-xs font-semibold tabular-nums ${budgetPct === null ? 'text-muted-foreground' : budgetPct > 100 ? 'text-red-500' : budgetPct > 95 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {budgetPct !== null ? `${budgetPct.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                  );
                })}
                <td />
              </tr>
              <tr className="bg-primary/10 border-t-2 border-primary/20">
                <td colSpan={5} className="px-3 py-2 text-xs font-bold text-foreground sticky left-0 bg-primary/10 z-10">
                  Summary
                  <span className="ml-2 text-[10px] text-muted-foreground font-normal">(property hotels only, excl. CORP)</span>
                </td>
                <td colSpan={9} className="px-3 py-2">
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { label: 'Total Room\nRevenue', value: totalRoomRev > 0 ? formatCurrency(totalRoomRev) : '—', color: 'text-foreground' },
                      { label: budgetSummaryLabel, value: totalDeptBudget > 0 ? formatCurrency(totalDeptBudget) : '—', color: 'text-foreground' },
                      { label: 'Total Allocated\nPayroll', value: formatCurrency(totalPayroll), color: 'text-foreground' },
                      { label: 'Over /\n(Short) Budget', value: totalBudgetDiff !== null ? (totalBudgetDiff > 0 ? '+' : '') + formatCurrency(totalBudgetDiff) : '—', color: totalBudgetDiff > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400' },
                      { label: '% of\nTotal Rev', value: totalPayrollPct !== null ? `${totalPayrollPct.toFixed(1)}%` : '—', color: totalPayrollPct === null ? 'text-muted-foreground' : totalPayrollPct > 5 ? 'text-red-500' : totalPayrollPct > 3 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400' },
                      { label: pctBudgetSummaryLabel, value: totalDeptBudget > 0 ? `${((totalPayroll / totalDeptBudget) * 100).toFixed(1)}%` : '—', color: totalDeptBudget === 0 ? 'text-muted-foreground' : (totalPayroll / totalDeptBudget) > 1 ? 'text-red-500' : (totalPayroll / totalDeptBudget) > 0.95 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400' }
                    ].map((item, idx) => (
                      <div key={idx} className="text-center">
                        <div className="text-[10px] text-muted-foreground leading-tight whitespace-pre-line">{item.label}</div>
                        <div className={`text-sm font-bold tabular-nums ${item.color}`}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {formOpen && (
        <EmployeeForm open={formOpen} onClose={setFormOpen} onSave={handleSave} employee={editEmp} hotels={sortedHotels} allEmployees={displayEmployees} fixedDepartment={isCommercial ? undefined : dept} />
      )}

      <AlertDialog open={!!deleteEmp} onOpenChange={() => setDeleteEmp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteEmp?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteEmp)} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}