import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, FileText } from 'lucide-react';
import { exportExecutiveSummary } from '@/functions/exportExecutiveSummary';

import SalaryTableRow from '@/components/salary/SalaryTableRow';
import SearchBar from '@/components/salary/SearchBar';
import ExportButton from '@/components/salary/ExportButton';
import ScenarioManager from '@/components/salary/ScenarioManager';
import EmployeeForm from '@/components/salary/EmployeeForm';
import { getTotalAllocation, getAllocationStatus, formatCurrency, HOTEL_SHORT_NAMES } from '@/lib/helpers';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

const HOTEL_ORDER = ['AURA', 'H5A', 'INK48', 'LIFE', 'RENWICK', 'SMYTH', 'CORP'];

export default function SalaryTable() {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [deleteEmp, setDeleteEmp] = useState(null);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [allocFilter, setAllocFilter] = useState('');
  const [hotelFilter, setHotelFilter] = useState('');
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

  const activeEmployees = employees.filter(e => !e.suppressed && !e.exclude_from_table);
  const suppressedCount = employees.filter(e => e.suppressed).length;

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
    if (a.suppressed && !b.suppressed) return -1;
    if (!a.suppressed && b.suppressed) return 1;
    const deptOrder = ['REVENUE', 'ECOMM', 'SALES'];
    const d = deptOrder.indexOf(a.department) - deptOrder.indexOf(b.department);
    return d !== 0 ? d : b.annual_salary - a.annual_salary;
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
            {activeEmployees.length} employees · {sortedHotels.filter(h => h.short_code !== 'CORP').length} properties
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
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={exportingPdf}
            onClick={async () => {
              setExportingPdf(true);
              try {
                const res = await exportExecutiveSummary({});
                const blob = new Blob([res.data], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `sm-payroll-executive-summary-${new Date().toISOString().slice(0,10)}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              } finally {
                setExportingPdf(false);
              }
            }}
          >
            <FileText className="w-4 h-4" />
            {exportingPdf ? 'Generating…' : 'Executive Summary PDF'}
          </Button>
          <ScenarioManager
            employees={employees}
            onRestore={async (snapshot) => {
              await Promise.all(
                Object.entries(snapshot).map(([empId, val]) => {
                  const isNewFormat = val && typeof val === 'object' && 'allocations' in val;
                  const data = isNewFormat
                    ? { allocations: val.allocations, suppressed: val.suppressed }
                    : { allocations: val };
                  return base44.entities.Employee.update(empId, data);
                })
              );
              qc.invalidateQueries({ queryKey: ['employees'] });
            }}
          />
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
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground sticky left-0 z-10" style={{ backgroundColor: '#2d4b5e' }}>Dept</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground">Title</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground">Name</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground">Reports To</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground text-right">Salary</th>
                <th className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground text-center">Total</th>
                {sortedHotels.map(h => (
                  <th key={h.short_code} className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground text-center min-w-[88px]">
                    {HOTEL_SHORT_NAMES[h.short_code] || h.short_code}
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
              <tr className="bg-primary/10 border-t-2 border-primary/20">
                <td colSpan={5} className="px-3 py-3 text-sm font-bold sticky left-0 bg-primary/10 z-10">Property Summary</td>
                <td />
                {sortedHotels.map(h => (
                  <td key={h.short_code} className="px-2 py-3 text-center">
                    <span className="text-xs font-semibold text-muted-foreground">{HOTEL_SHORT_NAMES[h.short_code] || h.short_code}</span>
                  </td>
                ))}
                <td />
                <td />
              </tr>
              <tr className="bg-primary/5 border-t border-border/50">
                <td colSpan={5} className="px-3 py-2 text-xs font-semibold text-muted-foreground sticky left-0 bg-primary/5 z-10">Budget Room Revenue</td>
                <td />
                {sortedHotels.map(h => {
                  if (h.short_code === 'CORP') return <td key={h.short_code} />;
                  return (
                    <td key={h.short_code} className="px-2 py-2 text-center">
                      <span className="text-xs font-semibold tabular-nums">{h.room_revenue_budget > 0 ? formatCurrency(h.room_revenue_budget) : '—'}</span>
                    </td>
                  );
                })}
                <td />
                <td />
              </tr>
              <tr className="bg-primary/5 border-t border-border/50">
                <td colSpan={5} className="px-3 py-2 text-xs font-semibold text-muted-foreground sticky left-0 bg-primary/5 z-10">S&M Payroll Budget</td>
                <td />
                {sortedHotels.map(h => {
                  if (h.short_code === 'CORP') return <td key={h.short_code} />;
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
                <td />
                <td />
              </tr>
              <tr className="bg-primary/5 border-t border-border/50">
                <td colSpan={5} className="px-3 py-2 text-xs font-semibold text-muted-foreground sticky left-0 bg-primary/5 z-10">Allocated Payroll</td>
                <td />
                {sortedHotels.map(h => (
                  <td key={h.short_code} className="px-2 py-2 text-center">
                    <span className="text-xs font-semibold tabular-nums">{formatCurrency(hotelTotals[h.short_code])}</span>
                  </td>
                ))}
                <td />
                <td />
              </tr>
              <tr className="bg-primary/5 border-t border-border/50">
                <td colSpan={5} className="px-3 py-2 text-xs font-semibold text-muted-foreground sticky left-0 bg-primary/5 z-10">Over / (Short) Budget</td>
                <td />
                {sortedHotels.map(h => {
                  if (h.short_code === 'CORP') return <td key={h.short_code} />;
                  const budget = h.sm_payroll_budget || 0;
                  const allocated = hotelTotals[h.short_code] || 0;
                  const budgetDiff = budget > 0 ? allocated - budget : null;
                  return (
                    <td key={h.short_code} className="px-2 py-2 text-center">
                      <span className={`text-xs font-semibold tabular-nums ${budgetDiff > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {budgetDiff !== null ? (budgetDiff > 0 ? '+' : '') + formatCurrency(budgetDiff) : '—'}
                      </span>
                    </td>
                  );
                })}
                <td />
                <td />
              </tr>
              <tr className="bg-primary/5 border-t border-border/50">
                <td colSpan={5} className="px-3 py-2 text-xs font-semibold text-muted-foreground sticky left-0 bg-primary/5 z-10">% of Room Revenue</td>
                <td />
                {sortedHotels.map(h => {
                  if (h.short_code === 'CORP') return <td key={h.short_code} />;
                  const allocated = hotelTotals[h.short_code] || 0;
                  const roomRev = h.room_revenue_budget || 0;
                  const payrollPct = roomRev > 0 ? (allocated / roomRev) * 100 : null;
                  return (
                    <td key={h.short_code} className="px-2 py-2 text-center">
                      <span className={`text-xs font-semibold tabular-nums ${payrollPct === null ? 'text-muted-foreground' : payrollPct > 5 ? 'text-red-500' : payrollPct > 3 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {payrollPct !== null ? `${payrollPct.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                  );
                })}
                <td />
                <td />
              </tr>
              <tr className="bg-primary/5 border-t border-border/50">
                <td colSpan={5} className="px-3 py-2 text-xs font-semibold text-muted-foreground sticky left-0 bg-primary/5 z-10">% of S&M Budget</td>
                <td />
                {sortedHotels.map(h => {
                  if (h.short_code === 'CORP') return <td key={h.short_code} />;
                  const allocated = hotelTotals[h.short_code] || 0;
                  const budget = h.sm_payroll_budget || 0;
                  const budgetPct = budget > 0 ? (allocated / budget) * 100 : null;
                  return (
                    <td key={h.short_code} className="px-2 py-2 text-center">
                      <span className={`text-xs font-semibold tabular-nums ${budgetPct === null ? 'text-muted-foreground' : budgetPct > 100 ? 'text-red-500' : budgetPct > 95 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {budgetPct !== null ? `${budgetPct.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                  );
                })}
                <td />
                <td />
              </tr>
              <tr className="bg-primary/10 border-t-2 border-primary/20">
                <td colSpan={5} className="px-3 py-2.5 text-xs font-bold text-foreground sticky left-0 bg-primary/10 z-10">
                  Summary
                  <span className="ml-2 text-[10px] text-muted-foreground font-normal">(property hotels only, excl. CORP)</span>
                </td>
                <td />
                {[
                  { label: 'Total Room\nRevenue', value: totalRoomRev > 0 ? formatCurrency(totalRoomRev) : '—', color: 'text-foreground' },
                  { label: 'S&M Payroll\nBudget', value: totalSmBudget > 0 ? formatCurrency(totalSmBudget) : '—', color: 'text-foreground' },
                  { label: 'Total Allocated\nPayroll', value: formatCurrency(totalPayroll), color: 'text-foreground' },
                  { 
                    label: 'Over /\n(Short) Budget', 
                    value: totalBudgetDiff !== null ? (totalBudgetDiff > 0 ? '+' : '') + formatCurrency(totalBudgetDiff) : '—', 
                    color: totalBudgetDiff > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400' 
                  },
                  { 
                    label: '% of\nRoom Rev', 
                    value: totalPayrollPct !== null ? `${totalPayrollPct.toFixed(1)}%` : '—', 
                    color: totalPayrollPct === null ? 'text-muted-foreground' : totalPayrollPct > 5 ? 'text-red-500' : totalPayrollPct > 3 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'
                  },
                  {
                    label: '% of S&M\nBudget',
                    value: totalSmBudget > 0 ? `${((totalPayroll / totalSmBudget) * 100).toFixed(1)}%` : '—',
                    color: totalSmBudget === 0 ? 'text-muted-foreground' : (totalPayroll / totalSmBudget) > 1 ? 'text-red-500' : (totalPayroll / totalSmBudget) > 0.95 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'
                  }
                ].map((item, idx) => (
                  <td key={idx} className="px-8 py-2.5 text-center">
                    <div className="text-[10px] text-muted-foreground w-[80px] mx-auto leading-tight whitespace-pre-line">{item.label}</div>
                    <div className={`text-sm font-bold tabular-nums ${item.color}`}>{item.value}</div>
                  </td>
                ))}
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