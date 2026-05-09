import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle } from 'lucide-react';
import SalaryTableRow from '@/components/salary/SalaryTableRow';
import SearchBar from '@/components/salary/SearchBar';
import ExportButton from '@/components/salary/ExportButton';
import EmployeeForm from '@/components/salary/EmployeeForm';
import { getTotalAllocation, getAllocationStatus, formatCurrency } from '@/lib/helpers';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

const HOTEL_ORDER = ['AURA', 'H5A', 'INK48', 'LIFE', 'RENWICK', 'SMYTH', 'CORP'];

export default function SalaryTable() {
  const [formOpen, setFormOpen] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [deleteEmp, setDeleteEmp] = useState(null);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [allocFilter, setAllocFilter] = useState('');
  const qc = useQueryClient();

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });
  const { data: hotels = [] } = useQuery({ queryKey: ['hotels'], queryFn: () => base44.entities.Hotel.list() });

  const sortedHotels = [...hotels].sort((a, b) => HOTEL_ORDER.indexOf(a.short_code) - HOTEL_ORDER.indexOf(b.short_code));
  const tableHotels = sortedHotels.filter(h => h.short_code !== 'CORP');

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setFormOpen(false); setEditEmp(null); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setFormOpen(false); setEditEmp(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Employee.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setDeleteEmp(null); },
  });

  const handleAllocChange = (emp, hotelCode, newPct) => {
    const newAllocs = { ...(emp.allocations || {}), [hotelCode]: newPct };
    if (newPct === 0) delete newAllocs[hotelCode];
    updateMutation.mutate({ id: emp.id, data: { allocations: newAllocs } });
  };

  const handleSave = (form) => {
    if (editEmp) updateMutation.mutate({ id: editEmp.id, data: form });
    else createMutation.mutate(form);
  };

  const handleToggleSuppress = (emp) => {
    updateMutation.mutate({ id: emp.id, data: { suppressed: !emp.suppressed } });
  };

  const activeEmployees = employees.filter(e => !e.suppressed);
  const suppressedCount = employees.length - activeEmployees.length;

  const hotelTotals = {};
  sortedHotels.forEach(h => {
    hotelTotals[h.short_code] = activeEmployees.reduce((sum, emp) => sum + ((emp.allocations?.[h.short_code] || 0) * emp.annual_salary), 0);
  });

  const propertyHotels = sortedHotels.filter(h => h.short_code !== 'CORP');

  // Total payroll: only count salary portions allocated to non-CORP hotels
  const totalPayroll = activeEmployees.reduce((sum, emp) => {
    return sum + propertyHotels.reduce((s, h) => s + ((emp.allocations?.[h.short_code] || 0) * emp.annual_salary), 0);
  }, 0);
  const totalRoomRev = propertyHotels.reduce((s, h) => s + (h.room_revenue_budget || 0), 0);
  const totalPayrollPct = totalRoomRev > 0 ? (totalPayroll / totalRoomRev) * 100 : null;
  const totalSmBudget = propertyHotels.reduce((s, h) => s + (h.sm_payroll_budget || 0), 0);
  const totalBudgetDiff = totalSmBudget > 0 ? totalPayroll - totalSmBudget : null;

  const sortedEmployees = [...employees].sort((a, b) => {
    // Suppressed (non-Craig) float to top
    const aSuppressed = a.suppressed && a.name !== 'Craig Franco';
    const bSuppressed = b.suppressed && b.name !== 'Craig Franco';
    if (aSuppressed && !bSuppressed) return -1;
    if (!aSuppressed && bSuppressed) return 1;
    const deptOrder = ['REVENUE', 'ECOMM', 'SALES'];
    const d = deptOrder.indexOf(a.department) - deptOrder.indexOf(b.department);
    return d !== 0 ? d : a.name.localeCompare(b.name);
  });

  const q = search.toLowerCase();
  const filteredEmployees = sortedEmployees.filter(emp => {
    if (emp.name === 'Craig Franco') return false;
    if (emp.suppressed && allocFilter !== 'suppressed') return false;
    if (q && !emp.name.toLowerCase().includes(q) && !emp.title.toLowerCase().includes(q) && !emp.department.toLowerCase().includes(q)) return false;
    if (deptFilter && emp.department !== deptFilter) return false;
    if (allocFilter === 'exact' && getAllocationStatus(getTotalAllocation(emp.allocations)) !== 'exact') return false;
    if (allocFilter === 'issues' && getAllocationStatus(getTotalAllocation(emp.allocations)) === 'exact') return false;
    if (allocFilter === 'suppressed' && !emp.suppressed) return false;
    return true;
  });

  const issueEmployees = activeEmployees.filter(e => getAllocationStatus(getTotalAllocation(e.allocations)) !== 'exact');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Salary Allocations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {activeEmployees.length} employees · {sortedHotels.filter(h => h.short_code !== 'CORP').length} properties
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton employees={sortedEmployees} hotels={sortedHotels} hotelTotals={hotelTotals} />
          <Button onClick={() => { setEditEmp(null); setFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Add Employee
          </Button>
        </div>
      </div>

      <SearchBar
        search={search} setSearch={setSearch}
        department={deptFilter} setDepartment={setDeptFilter}
        allocationFilter={allocFilter} setAllocationFilter={setAllocFilter}
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
              <tr className="bg-gradient-to-r from-primary to-blue-700 dark:from-blue-900 dark:to-slate-800">
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground sticky left-0 bg-primary dark:bg-blue-900 z-10">Dept</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground">Title</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground">Name</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground">Reports To</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground text-right">Salary</th>
                <th className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground text-center">Total</th>
                {sortedHotels.map(h => (
                  <th key={h.short_code} className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground text-center min-w-[88px]">
                    {h.short_code}
                  </th>
                ))}
                <th className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground text-center">Total</th>
                <th className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp, idx) => (
                <SalaryTableRow
                  key={emp.id}
                  employee={emp}
                  hotels={sortedHotels}
                  onAllocChange={handleAllocChange}
                  onEdit={(e) => { setEditEmp(e); setFormOpen(true); }}
                  onDelete={setDeleteEmp}
                  onToggleSuppress={handleToggleSuppress}
                  isOdd={idx % 2 === 1}
                  highlight={q && (emp.name.toLowerCase().includes(q) || emp.title.toLowerCase().includes(q))}
                  managerName={employees.find(e => e.id === emp.manager_id)?.name || ''}
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
              <tr className="bg-muted/60 border-t-2 border-border">
                <td colSpan={5} className="px-3 py-3 text-sm font-bold sticky left-0 bg-muted/60 z-10">Total Allocated</td>
                <td />
                {sortedHotels.map(h => (
                  <td key={h.short_code} className="px-2 py-3 text-center">
                    <span className="text-xs font-bold tabular-nums">{formatCurrency(hotelTotals[h.short_code])}</span>
                  </td>
                ))}
                <td className="px-2 py-3 text-center">
                  <span className="text-xs font-bold tabular-nums">{formatCurrency(totalPayroll)}</span>
                </td>
                <td />
              </tr>
              <tr className="bg-primary/5 border-t border-border/50">
                <td colSpan={5} className="px-3 py-2 text-xs font-semibold text-muted-foreground sticky left-0 bg-primary/5 z-10">S&M Payroll Budget</td>
                <td />
                {tableHotels.map(h => {
                   const budget = h.sm_payroll_budget || 0;
                   const allocated = hotelTotals[h.short_code] || 0;
                   const isOver = budget > 0 && allocated > budget;
                   const isNear = budget > 0 && allocated / budget > 0.95 && allocated <= budget;
                   return (
                     <td key={h.short_code} className="px-2 py-2 text-center">
                       <span className={`text-xs font-semibold tabular-nums ${isOver ? 'text-red-500' : isNear ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                         {budget > 0 ? formatCurrency(budget) : '—'}
                       </span>
                     </td>
                   );
                 })}
                <td className="px-2 py-2 text-center">
                  <span className="text-xs font-bold tabular-nums text-foreground">{totalSmBudget > 0 ? formatCurrency(totalSmBudget) : '—'}</span>
                </td>
              </tr>
              <tr className="bg-primary/5 border-t border-border/50">
                <td colSpan={5} className="px-3 py-2 text-xs font-semibold text-muted-foreground sticky left-0 bg-primary/5 z-10">Over / (Short) Budget</td>
                <td />
                {tableHotels.map(h => {
                   const budget = h.sm_payroll_budget || 0;
                   const allocated = hotelTotals[h.short_code] || 0;
                   const diff = allocated - budget;
                  if (budget === 0) return <td key={h.short_code} className="px-2 py-2 text-center"><span className="text-xs text-muted-foreground">—</span></td>;
                  return (
                    <td key={h.short_code} className="px-2 py-2 text-center">
                      <span className={`text-xs font-bold tabular-nums ${diff > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                      </span>
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-center">
                  {totalBudgetDiff !== null && (
                    <span className={`text-xs font-bold tabular-nums ${totalBudgetDiff > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {totalBudgetDiff > 0 ? '+' : ''}{formatCurrency(totalBudgetDiff)}
                    </span>
                  )}
                </td>
              </tr>
              <tr className="bg-primary/5 border-t border-border/50">
                <td colSpan={5} className="px-3 py-2 text-xs font-semibold text-muted-foreground sticky left-0 bg-primary/5 z-10">Room Revenue Budget</td>
                <td />
                {tableHotels.map(h => (
                   <td key={h.short_code} className="px-2 py-2 text-center">
                     <span className="text-xs font-semibold tabular-nums">{h.room_revenue_budget > 0 ? formatCurrency(h.room_revenue_budget) : '—'}</span>
                   </td>
                 ))}
                <td className="px-2 py-2 text-center">
                  <span className="text-xs font-bold tabular-nums text-foreground">{totalRoomRev > 0 ? formatCurrency(totalRoomRev) : '—'}</span>
                </td>
              </tr>
              <tr className="bg-primary/5 border-t border-border/50">
                <td colSpan={5} className="px-3 py-2 text-xs font-semibold text-muted-foreground sticky left-0 bg-primary/5 z-10">Payroll as % of Room Rev</td>
                <td />
                {tableHotels.map(h => {
                   const roomRev = h.room_revenue_budget || 0;
                  const allocated = hotelTotals[h.short_code] || 0;
                  const pct = roomRev > 0 ? (allocated / roomRev) * 100 : null;
                  return (
                    <td key={h.short_code} className="px-2 py-2 text-center">
                      <span className={`text-xs font-bold tabular-nums ${pct === null ? 'text-muted-foreground' : pct > 5 ? 'text-red-500' : pct > 3 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {pct !== null ? `${pct.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-center">
                  <span className={`text-xs font-bold tabular-nums ${totalPayrollPct === null ? 'text-muted-foreground' : totalPayrollPct > 5 ? 'text-red-500' : totalPayrollPct > 3 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {totalPayrollPct !== null ? `${totalPayrollPct.toFixed(1)}%` : '—'}
                  </span>
                </td>
              </tr>
              <tr className="bg-primary/10 border-t-2 border-primary/20">
                <td colSpan={5} className="px-3 py-2.5 text-xs font-bold text-foreground sticky left-0 bg-primary/10 z-10">
                  Total Payroll % of Room Rev
                  <span className="ml-2 text-[10px] text-muted-foreground font-normal">(property salaries only, excl. CORP)</span>
                </td>
                <td />
                <td colSpan={tableHotels.length} className="px-2 py-2.5 text-center">
                  <span className={`text-sm font-bold tabular-nums ${
                    totalPayrollPct === null ? 'text-muted-foreground'
                    : totalPayrollPct > 5 ? 'text-red-500'
                    : totalPayrollPct > 3 ? 'text-amber-500'
                    : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {totalPayrollPct !== null ? `${totalPayrollPct.toFixed(1)}%` : '—'}
                    {totalPayrollPct !== null && (
                      <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                        ({formatCurrency(totalPayroll)} / {formatCurrency(totalRoomRev)})
                      </span>
                    )}
                  </span>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {formOpen && (
        <EmployeeForm open={formOpen} onClose={setFormOpen} onSave={handleSave} employee={editEmp} hotels={sortedHotels} allEmployees={employees} />
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
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteEmp.id)} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}