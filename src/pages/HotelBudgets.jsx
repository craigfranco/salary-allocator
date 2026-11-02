import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, Building2, TrendingUp, TrendingDown } from 'lucide-react';
import HotelBudgetCard from '@/components/budget/HotelBudgetCard';
import HotelDrillDown from '@/components/budget/HotelDrillDown';
import DeptBreakdownRollup from '@/components/budget/DeptBreakdownRollup';
import StatCard from '@/components/ui/StatCard';
import EmployeeForm from '@/components/salary/EmployeeForm';
import DeptWorkspace from '@/components/dept/DeptWorkspace';
import DeptBudgetPanel from '@/components/dept/DeptBudgetPanel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getHotelAllocatedTotal, formatCurrency } from '@/lib/helpers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useScenario } from '@/lib/ScenarioContext';
import { formatCurrency as fmt } from '@/lib/helpers';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

const HOTEL_ORDER = ['AURA', 'H5A', 'INK48', 'LIFE', 'RENWICK', 'SMYTH', 'CORP'];

export default function HotelBudgets() {
  const [addOpen, setAddOpen] = useState(false);
  const [drillHotel, setDrillHotel] = useState(null);
  const [deleteHotel, setDeleteHotel] = useState(null);
  const [editEmp, setEditEmp] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [newHotel, setNewHotel] = useState({ name: '', short_code: '', room_revenue_budget: 0, sm_payroll_budget: 0 });
  const [dept, setDept] = useState('COMMERCIAL');
  const qc = useQueryClient();
  const { activeScenario, scenarioData, setScenarioData } = useScenario();

  const { data: hotels = [] } = useQuery({ queryKey: ['hotels'], queryFn: () => base44.entities.Hotel.list() });
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: () => base44.entities.Department.list() });
  const { data: deptStaff = [] } = useQuery({ queryKey: ['deptStaff'], queryFn: () => base44.entities.DeptStaff.list() });

  // Use scenario data if active, otherwise use DB employees
  const displayEmployees = Array.isArray(scenarioData) ? scenarioData : (Array.isArray(employees) ? employees : []);
  const activeEmployees = displayEmployees.filter(e => !e.suppressed);
  const suppressedCount = employees.length - activeEmployees.length;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Hotel.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotels'] }),
  });
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Hotel.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hotels'] }); setAddOpen(false); setNewHotel({ name: '', short_code: '', room_revenue_budget: 0, sm_payroll_budget: 0 }); },
  });
  const deptBudgetMutation = useMutation({
    mutationFn: ({ id, data }) => id ? base44.entities.Department.update(id, data) : base44.entities.Department.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });

  const hotelDeleteMutation = useMutation({
    mutationFn: async (hotel) => {
      // Remove the hotel's allocation from all employees, then delete the hotel
      const affected = displayEmployees.filter(e => (e.allocations?.[hotel.short_code] || 0) > 0);
      if (activeScenario && Array.isArray(scenarioData)) {
        const updated = JSON.parse(JSON.stringify(scenarioData));
        updated.forEach(e => {
          if (e.allocations) delete e.allocations[hotel.short_code];
        });
        setScenarioData(updated);
      } else if (affected.length > 0) {
        await base44.entities.Employee.bulkUpdate(
          affected.map(e => {
            const allocs = { ...(e.allocations || {}) };
            delete allocs[hotel.short_code];
            return { id: e.id, allocations: allocs };
          })
        );
        qc.invalidateQueries({ queryKey: ['employees'] });
      }
      return base44.entities.Hotel.delete(hotel.id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hotels'] }); setDeleteHotel(null); },
  });

  const empUpdateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setFormOpen(false); setEditEmp(null); },
  });
  const empCreateMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setFormOpen(false); setEditEmp(null); },
  });

  const handleEditEmployee = (emp) => {
    setEditEmp(emp);
    setFormOpen(true);
  };

  const handleSaveEmployee = (form) => {
    if (activeScenario && Array.isArray(scenarioData)) {
      const updated = JSON.parse(JSON.stringify(scenarioData));
      if (editEmp) {
        const idx = updated.findIndex(e => e.id === editEmp.id);
        if (idx !== -1) updated[idx] = { ...updated[idx], ...form };
      } else {
        updated.push({ ...form, id: 'new_' + Date.now() });
      }
      setScenarioData(updated);
      setFormOpen(false);
      setEditEmp(null);
    } else if (editEmp) {
      empUpdateMutation.mutate({ id: editEmp.id, data: form });
    } else {
      empCreateMutation.mutate(form);
    }
  };

  const sortedHotels = [...hotels].sort((a, b) => HOTEL_ORDER.indexOf(a.short_code) - HOTEL_ORDER.indexOf(b.short_code));
  const propertyHotels = sortedHotels.filter(h => h.short_code !== 'CORP');

  const DEPTS = [
    { key: 'COMMERCIAL', label: 'Commercial' },
    { key: 'FINANCE', label: 'Finance' },
    { key: 'HR', label: 'HR' },
    { key: 'ENGINEERING', label: 'Engineering' },
  ];
  const deptPayroll = {
    FINANCE: deptStaff.filter(s => s.department === 'FINANCE' && !s.suppressed).reduce((s, e) => s + (e.annual_salary || 0), 0),
    HR: deptStaff.filter(s => s.department === 'HR' && !s.suppressed).reduce((s, e) => s + (e.annual_salary || 0), 0),
    ENGINEERING: deptStaff.filter(s => s.department === 'ENGINEERING' && !s.suppressed).reduce((s, e) => s + (e.annual_salary || 0), 0),
  };
  const totalPayroll = activeEmployees.reduce((s, e) => s + (e.annual_salary || 0), 0);
  const totalBudget = propertyHotels.reduce((s, h) => s + (h.sm_payroll_budget || 0), 0);
  const totalAllocated = propertyHotels.reduce((s, h) => s + getHotelAllocatedTotal(activeEmployees, h.short_code), 0);
  const totalRoomRev = propertyHotels.reduce((s, h) => s + (h.room_revenue_budget || 0), 0);
  const overBudgetCount = propertyHotels.filter(h => getHotelAllocatedTotal(activeEmployees, h.short_code) > (h.sm_payroll_budget || 0)).length;
  const corpAllocated = getHotelAllocatedTotal(activeEmployees, 'CORP');
  const corpEmpCount = activeEmployees.filter(e => (e.allocations?.CORP || 0) > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Hotel Budgets</h2>
          <p className="text-sm text-muted-foreground mt-1">
            2027 department budgets & hotel allocations
            {dept === 'COMMERCIAL' && suppressedCount > 0 && <span className="ml-2 text-amber-500 font-medium">· {suppressedCount} employee(s) suppressed</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COMMERCIAL">Commercial</SelectItem>
              <SelectItem value="FINANCE">Finance</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="ENGINEERING">Engineering</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Hotel
          </Button>
        </div>
      </div>

      {dept === 'COMMERCIAL' ? (<>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEPTS.map(({ key, label }) => {
          const rec = departments.find(d => d.department === key);
          return (
            <DeptBudgetPanel
              key={key}
              deptLabel={label}
              budget={rec?.payroll_budget || 0}
              payroll={key === 'COMMERCIAL' ? totalPayroll : (deptPayroll[key] || 0)}
              onSave={(v) => deptBudgetMutation.mutate({ id: rec?.id, data: { department: key, payroll_budget: v } })}
            />
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard label="Total S&M Budget" value={totalBudget} prefix="$" icon={DollarSign} color="blue" />
        <StatCard label="Total Allocated" value={totalAllocated} prefix="$" icon={TrendingUp} color={totalAllocated > totalBudget ? 'rose' : 'teal'} />
        <StatCard label="Allocated to Corp" value={corpAllocated} prefix="$" icon={Building2} color="amber" trend={`${corpEmpCount} employee${corpEmpCount !== 1 ? 's' : ''}`} />
        <StatCard label="Total Room Revenue" value={totalRoomRev} prefix="$" icon={Building2} color="purple" />
        <StatCard label="Over Budget" value={overBudgetCount} suffix=" hotels" icon={TrendingDown} color={overBudgetCount > 0 ? 'rose' : 'teal'} />
        <StatCard
          label="Budget Overage"
          value={totalAllocated > totalBudget ? totalAllocated - totalBudget : 0}
          prefix="$"
          icon={TrendingDown}
          color={totalAllocated > totalBudget ? 'rose' : 'teal'}
          trend={totalAllocated > totalBudget ? `${overBudgetCount} hotel${overBudgetCount !== 1 ? 's' : ''} over budget` : 'Within budget'}
        />
      </div>

      <DeptBreakdownRollup employees={activeEmployees} hotels={sortedHotels} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedHotels.map(hotel => {
          const empCount = activeEmployees.filter(e => (e.allocations?.[hotel.short_code] || 0) > 0).length;
          return (
            <HotelBudgetCard
              key={hotel.id}
              hotel={hotel}
              allocatedTotal={getHotelAllocatedTotal(activeEmployees, hotel.short_code)}
              employeeCount={empCount}
              employees={activeEmployees}
              onUpdate={(data) => updateMutation.mutate({ id: hotel.id, data })}
              onDelete={() => setDeleteHotel(hotel)}
              onClick={() => setDrillHotel(hotel)}
            />
          );
        })}
      </div>

      </>) : (
        <DeptWorkspace dept={dept} />
      )}

      {drillHotel && (
        <HotelDrillDown
          hotel={drillHotel}
          employees={activeEmployees}
          onClose={() => setDrillHotel(null)}
          onEditEmployee={handleEditEmployee}
        />
      )}

      {formOpen && (
        <EmployeeForm
          open={formOpen}
          onClose={setFormOpen}
          onSave={handleSaveEmployee}
          employee={editEmp}
          hotels={sortedHotels}
          allEmployees={displayEmployees}
        />
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Add New Hotel</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Hotel Name</Label><Input value={newHotel.name} onChange={(e) => setNewHotel(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Short Code</Label><Input value={newHotel.short_code} onChange={(e) => setNewHotel(p => ({ ...p, short_code: e.target.value.toUpperCase() }))} /></div>
            <div><Label>Room Revenue Budget</Label><Input type="number" value={newHotel.room_revenue_budget} onChange={(e) => setNewHotel(p => ({ ...p, room_revenue_budget: parseFloat(e.target.value) || 0 }))} /></div>
            <div><Label>S&M Payroll Budget</Label><Input type="number" value={newHotel.sm_payroll_budget} onChange={(e) => setNewHotel(p => ({ ...p, sm_payroll_budget: parseFloat(e.target.value) || 0 }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(newHotel)}>Add Hotel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteHotel} onOpenChange={() => setDeleteHotel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Hotel</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Are you sure you want to remove <strong>{deleteHotel?.name}</strong>?
                {(() => {
                  const affected = activeEmployees.filter(e => (e.allocations?.[deleteHotel?.short_code] || 0) > 0);
                  if (affected.length === 0) return ' No employees currently have allocations to this hotel.';
                  const total = affected.reduce((s, e) => s + (e.allocations[deleteHotel.short_code] || 0) * (e.annual_salary || 0), 0);
                  return ` ${affected.length} employee${affected.length > 1 ? 's' : ''} currently allocate ${fmt(total)} to this hotel — those allocations will be removed.`;
                })()}
                {' '}This action cannot be undone.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => hotelDeleteMutation.mutate(deleteHotel)}
            >
              Remove Hotel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}