import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, AlertCircle } from 'lucide-react';
import SalaryTableRow from '@/components/salary/SalaryTableRow';
import EmployeeForm from '@/components/salary/EmployeeForm';
import { getTotalAllocation, getAllocationStatus, formatCurrency } from '@/lib/helpers';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

export default function SalaryTable() {
  const [formOpen, setFormOpen] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [deleteEmp, setDeleteEmp] = useState(null);
  const qc = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: hotels = [] } = useQuery({
    queryKey: ['hotels'],
    queryFn: () => base44.entities.Hotel.list(),
  });

  const sortedHotels = [...hotels].sort((a, b) => {
    const order = ['AURA', 'H5A', 'INK48', 'LIFE', 'RENWICK', 'SMYTH', 'CORP'];
    return order.indexOf(a.short_code) - order.indexOf(b.short_code);
  });

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
    if (editEmp) {
      updateMutation.mutate({ id: editEmp.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (emp) => { setEditEmp(emp); setFormOpen(true); };

  const issueEmployees = employees.filter(e => {
    const status = getAllocationStatus(getTotalAllocation(e.allocations));
    return status !== 'exact';
  });

  // Compute hotel totals
  const hotelTotals = {};
  sortedHotels.forEach(h => {
    hotelTotals[h.short_code] = employees.reduce((sum, emp) => {
      return sum + ((emp.allocations?.[h.short_code] || 0) * emp.annual_salary);
    }, 0);
  });

  const sortedEmployees = [...employees].sort((a, b) => {
    const deptOrder = ['REVENUE', 'ECOMM', 'SALES'];
    return deptOrder.indexOf(a.department) - deptOrder.indexOf(b.department);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Salary Allocations</h2>
          <p className="text-sm text-muted-foreground mt-1">{employees.length} employees across {hotels.length} properties</p>
        </div>
        <Button onClick={() => { setEditEmp(null); setFormOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Employee
        </Button>
      </div>

      {issueEmployees.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">
            <span className="font-semibold">{issueEmployees.length} employee(s)</span> have allocation issues:
            {' '}{issueEmployees.map(e => e.name).join(', ')}
          </p>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider sticky left-0 bg-primary z-10">Dept</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider">Title</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider">Name</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-right">Salary</th>
                <th className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-center">Total</th>
                {sortedHotels.map(h => (
                  <th key={h.short_code} className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-center min-w-[80px]">
                    {h.short_code}
                  </th>
                ))}
                <th className="px-2 py-3 text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedEmployees.map(emp => (
                <SalaryTableRow
                  key={emp.id}
                  employee={emp}
                  hotels={sortedHotels}
                  onAllocChange={handleAllocChange}
                  onEdit={handleEdit}
                  onDelete={setDeleteEmp}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/60 border-t-2 border-primary/20">
                <td colSpan={4} className="px-3 py-3 text-sm font-bold text-foreground sticky left-0 bg-muted/60 z-10">
                  Hotel Totals
                </td>
                <td className="px-2 py-3" />
                {sortedHotels.map(h => (
                  <td key={h.short_code} className="px-2 py-3 text-center">
                    <span className="text-xs font-bold text-foreground">{formatCurrency(hotelTotals[h.short_code])}</span>
                  </td>
                ))}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {formOpen && (
        <EmployeeForm
          open={formOpen}
          onClose={setFormOpen}
          onSave={handleSave}
          employee={editEmp}
          hotels={sortedHotels}
        />
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