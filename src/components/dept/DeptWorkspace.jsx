import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, DollarSign, Building2, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import EmployeeForm from '@/components/salary/EmployeeForm';
import DeptBudgetCard from '@/components/dept/DeptBudgetCard';
import DeptStaffRow from '@/components/dept/DeptStaffRow';
import DeptHotelDialog from '@/components/dept/DeptHotelDialog';
import DeptBudgetPanel from '@/components/dept/DeptBudgetPanel';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { getHotelAllocatedTotal, getTotalAllocation } from '@/lib/helpers';
import ScenarioManager from '@/components/salary/ScenarioManager';
import { useScenario } from '@/lib/ScenarioContext';

const HOTEL_ORDER = ['AURA', 'H5A', 'INK48', 'LIFE', 'RENWICK', 'SMYTH', 'CORP'];

const DEPT_CONFIG = {
  FINANCE: { title: 'Finance Team', deptLabel: 'Finance' },
  HR: { title: 'Human Resources Team', deptLabel: 'HR' },
  ENGINEERING: { title: 'Engineering Team', deptLabel: 'Engineering' },
};

export default function DeptWorkspace({ dept }) {
  const config = DEPT_CONFIG[dept] || { title: dept, deptLabel: dept };
  const [formOpen, setFormOpen] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [deleteStaff, setDeleteStaff] = useState(null);
  const [drillHotel, setDrillHotel] = useState(null);
  const [showSuppressed, setShowSuppressed] = useState(false);
  const qc = useQueryClient();

  const { data: staff = [] } = useQuery({ queryKey: ['deptstaff', dept], queryFn: () => base44.entities.DeptStaff.filter({ department: dept }) });
  const { data: hotels = [] } = useQuery({ queryKey: ['hotels'], queryFn: () => base44.entities.Hotel.list() });
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: () => base44.entities.Department.list() });
  const deptRecord = departments.find(d => d.department === dept);
  const { activeScenario, scenarioData, setScenarioData } = useScenario(dept);
  const inScenario = activeScenario && Array.isArray(scenarioData);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['deptstaff', dept] });
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DeptStaff.create(data),
    onSuccess: () => { invalidate(); setFormOpen(false); setEditStaff(null); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DeptStaff.update(id, data),
    onSuccess: () => { invalidate(); setFormOpen(false); setEditStaff(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DeptStaff.delete(id),
    onSuccess: () => { invalidate(); setDeleteStaff(null); },
  });
  const deptBudgetMutation = useMutation({
    mutationFn: ({ id, data }) => id ? base44.entities.Department.update(id, data) : base44.entities.Department.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });

  const displayStaff = Array.isArray(scenarioData) ? scenarioData : staff;
  const sortedStaff = [...displayStaff].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const activeStaff = sortedStaff.filter(s => !s.suppressed);
  const suppressedCount = sortedStaff.length - activeStaff.length;
  const tableStaff = showSuppressed ? sortedStaff : activeStaff;

  const sortedHotels = [...hotels].sort((a, b) => HOTEL_ORDER.indexOf(a.short_code) - HOTEL_ORDER.indexOf(b.short_code));
  const propertyHotels = sortedHotels.filter(h => h.short_code !== 'CORP');

  const totalPayroll = activeStaff.reduce((s, e) => s + (e.annual_salary || 0), 0);
  const totalAllocated = propertyHotels.reduce((s, h) => s + getHotelAllocatedTotal(activeStaff, h.short_code), 0);
  const corpAllocated = getHotelAllocatedTotal(activeStaff, 'CORP');
  const corpEmpCount = activeStaff.filter(e => (e.allocations?.CORP || 0) > 0).length;
  const needsAttention = activeStaff.filter(e => {
    const t = getTotalAllocation(e.allocations);
    return t < 0.999 || t > 1.001;
  }).length;

  const handleSave = (form) => {
    const { manager_id, ...payload } = form;
    const data = { ...payload, department: dept };
    if (inScenario) {
      const updated = JSON.parse(JSON.stringify(scenarioData));
      if (editStaff) {
        const idx = updated.findIndex(s => s.id === editStaff.id);
        if (idx !== -1) updated[idx] = { ...updated[idx], ...data };
      } else {
        updated.push({ ...data, id: 'new_' + Date.now() });
      }
      setScenarioData(updated);
      setFormOpen(false);
      setEditStaff(null);
    } else if (editStaff) updateMutation.mutate({ id: editStaff.id, data });
    else createMutation.mutate(data);
  };

  const handleAllocChange = (staffRec, code, value) => {
    if (inScenario) {
      const updated = JSON.parse(JSON.stringify(scenarioData));
      const idx = updated.findIndex(s => s.id === staffRec.id);
      if (idx !== -1) {
        const newAllocs = { ...(updated[idx].allocations || {}), [code]: value };
        if (value === 0) delete newAllocs[code];
        updated[idx].allocations = newAllocs;
        setScenarioData(updated);
      }
    } else {
      updateMutation.mutate({
        id: staffRec.id,
        data: { allocations: { ...(staffRec.allocations || {}), [code]: value } },
      });
    }
  };

  const handleDelete = () => {
    if (!deleteStaff) return;
    if (inScenario) {
      setScenarioData(scenarioData.filter(s => s.id !== deleteStaff.id));
      setDeleteStaff(null);
    } else {
      deleteMutation.mutate(deleteStaff.id);
    }
  };

  const handleToggleSuppress = (staffRec) => {
    if (inScenario) {
      const updated = JSON.parse(JSON.stringify(scenarioData));
      const idx = updated.findIndex(s => s.id === staffRec.id);
      if (idx !== -1) {
        updated[idx].suppressed = !updated[idx].suppressed;
        setScenarioData(updated);
      }
    } else {
      updateMutation.mutate({ id: staffRec.id, data: { suppressed: !staffRec.suppressed } });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">{config.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Payroll allocation across hotels · 2026 room revenue budgets
            {suppressedCount > 0 && <span className="ml-2 text-amber-500 font-medium">· {suppressedCount} suppressed</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ScenarioManager employees={staff} department={dept} />
          <Button onClick={() => { setEditStaff(null); setFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Add Team Member
          </Button>
        </div>
      </div>

      <DeptBudgetPanel
        deptLabel={config.deptLabel}
        budget={deptRecord?.payroll_budget || 0}
        payroll={totalPayroll}
        onSave={(v) => deptBudgetMutation.mutate({ id: deptRecord?.id, data: { department: dept, payroll_budget: v } })}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Payroll" value={totalPayroll} prefix="$" icon={DollarSign} color="blue" />
        <StatCard label="Allocated to Properties" value={totalAllocated} prefix="$" icon={TrendingUp} color="teal" />
        <StatCard
          label="Allocated to Corp" value={corpAllocated} prefix="$" icon={Building2} color="amber"
          trend={`${corpEmpCount} member${corpEmpCount !== 1 ? 's' : ''}`}
        />
        <StatCard label="Headcount" value={activeStaff.length} suffix=" members" icon={Users} color="purple" />
        <StatCard
          label="Needs Attention" value={needsAttention} suffix=" members" icon={AlertTriangle}
          color={needsAttention > 0 ? 'rose' : 'teal'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {propertyHotels.map(hotel => {
          const empCount = activeStaff.filter(e => (e.allocations?.[hotel.short_code] || 0) > 0).length;
          return (
            <DeptBudgetCard
              key={hotel.id}
              hotel={hotel}
              deptLabel={config.deptLabel}
              allocatedTotal={getHotelAllocatedTotal(activeStaff, hotel.short_code)}
              employeeCount={empCount}
              onClick={() => setDrillHotel(hotel)}
            />
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
          <h3 className="text-sm font-semibold">Allocation Table</h3>
          {suppressedCount > 0 && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <Checkbox checked={showSuppressed} onCheckedChange={(v) => setShowSuppressed(!!v)} />
              Show suppressed ({suppressedCount})
            </label>
          )}
        </div>
        {tableStaff.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Team Member</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Salary</th>
                  {sortedHotels.map(h => (
                    <th key={h.short_code} className="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{h.short_code}</th>
                  ))}
                  <th className="px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {tableStaff.map(s => (
                  <DeptStaffRow
                    key={s.id}
                    staff={s}
                    hotels={sortedHotels}
                    onAllocChange={(code, v) => handleAllocChange(s, code, v)}
                    onEdit={() => { setEditStaff(s); setFormOpen(true); }}
                    onDelete={() => setDeleteStaff(s)}
                    onToggleSuppress={() => handleToggleSuppress(s)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">No {config.deptLabel} team members yet.</p>
            <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => { setEditStaff(null); setFormOpen(true); }}>
              <Plus className="w-4 h-4" /> Add your first member
            </Button>
          </div>
        )}
      </div>

      {drillHotel && (
        <DeptHotelDialog
          hotel={drillHotel}
          staff={activeStaff}
          deptLabel={config.deptLabel}
          onClose={() => setDrillHotel(null)}
        />
      )}

      {formOpen && (
        <EmployeeForm
          open={formOpen}
          onClose={(v) => { setFormOpen(!!v); if (!v) setEditStaff(null); }}
          onSave={handleSave}
          employee={editStaff}
          hotels={sortedHotels}
          fixedDepartment={dept}
        />
      )}

      <AlertDialog open={!!deleteStaff} onOpenChange={() => setDeleteStaff(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Are you sure you want to remove <strong>{deleteStaff?.name}</strong> ({deleteStaff?.title})?
                Their allocations across all hotels will be deleted. This action cannot be undone.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={handleDelete}
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}