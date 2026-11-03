import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Building2, TrendingUp, Users, AlertTriangle, Plus } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { Button } from '@/components/ui/button';
import DeptBudgetCard from '@/components/dept/DeptBudgetCard';
import DeptHotelDialog from '@/components/dept/DeptHotelDialog';
import HotelFormDialog from '@/components/budget/HotelFormDialog';
import { DEPT_LABELS, DEPT_BUDGET_FIELDS } from '@/lib/deptConfig';
import { getHotelAllocatedTotal, getTotalAllocation, orderHotelsByRevenue } from '@/lib/helpers';
import { useScenario } from '@/lib/ScenarioContext';

export default function DeptBudgets({ dept }) {
  const deptLabel = DEPT_LABELS[dept] || dept;
  const [drillHotel, setDrillHotel] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Hotel.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hotels'] }); setAddOpen(false); },
  });

  const { data: staff = [] } = useQuery({ queryKey: ['deptstaff', dept], queryFn: () => base44.entities.DeptStaff.filter({ department: dept }) });
  const { data: hotels = [] } = useQuery({ queryKey: ['hotels'], queryFn: () => base44.entities.Hotel.list() });
  const { activeScenario, scenarioData } = useScenario(dept);

  const displayStaff = Array.isArray(scenarioData) ? scenarioData : staff;
  const activeStaff = displayStaff.filter(s => !s.suppressed);
  const sortedHotels = orderHotelsByRevenue(hotels);
  const propertyHotels = sortedHotels.filter(h => h.short_code !== 'CORP');

  const budgetField = DEPT_BUDGET_FIELDS[dept];
  const totalBudget = propertyHotels.reduce((s, h) => s + (h[budgetField] || 0), 0);
  const totalAllocated = propertyHotels.reduce((s, h) => s + getHotelAllocatedTotal(activeStaff, h.short_code), 0);
  const overBudgetHotels = propertyHotels.filter(h => {
    const b = h[budgetField] || 0;
    return b > 0 && getHotelAllocatedTotal(activeStaff, h.short_code) > b;
  });
  const attention = activeStaff.filter(e => {
    const t = getTotalAllocation(e.allocations);
    return t < 0.999 || t > 1.001;
  }).length;

  // Deep link from Alerts: ?focus=<hotel short code> opens that hotel's drill-down
  const handledFocus = useRef(false);
  useEffect(() => {
    if (handledFocus.current) return;
    const focusCode = new URLSearchParams(window.location.search).get('focus');
    if (!focusCode) return;
    const hotel = hotels.find(h => h.short_code === focusCode);
    if (!hotel) return;
    handledFocus.current = true;
    setDrillHotel(hotel);
    window.history.replaceState({}, '', window.location.pathname);
  }, [hotels]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">{deptLabel} Hotel Budgets</h2>
          <p className="text-sm text-muted-foreground mt-1">Per-hotel {deptLabel} payroll budgets vs. allocated salaries · 2027</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Hotel
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label={`${deptLabel} Budget`} value={totalBudget} prefix="$" icon={DollarSign} color="blue" />
        <StatCard label="Allocated to Properties" value={totalAllocated} prefix="$" icon={TrendingUp} color="teal" />
        <StatCard label="Headcount" value={activeStaff.length} suffix=" members" icon={Users} color="purple" />
        <StatCard label="Over-Budget Hotels" value={overBudgetHotels.length} icon={Building2} color={overBudgetHotels.length > 0 ? 'rose' : 'teal'} />
        <StatCard label="Needs Attention" value={attention} suffix=" members" icon={AlertTriangle} color={attention > 0 ? 'rose' : 'teal'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {propertyHotels.map(hotel => {
          const empCount = activeStaff.filter(e => (e.allocations?.[hotel.short_code] || 0) > 0).length;
          return (
            <DeptBudgetCard
              key={hotel.id}
              hotel={hotel}
              dept={dept}
              deptLabel={deptLabel}
              allocatedTotal={getHotelAllocatedTotal(activeStaff, hotel.short_code)}
              employeeCount={empCount}
              onClick={() => setDrillHotel(hotel)}
            />
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Hotels are shared across all disciplines — a hotel added here is available in every workspace. Budget figures can also be edited from the Commercial workspace's Hotel Budgets page.
      </p>

      <HotelFormDialog
        open={addOpen}
        onClose={setAddOpen}
        onCreate={(data) => createMutation.mutate(data)}
        submitting={createMutation.isPending}
      />

      {drillHotel && (
        <DeptHotelDialog hotel={drillHotel} staff={activeStaff} deptLabel={deptLabel} onClose={() => setDrillHotel(null)} />
      )}
    </div>
  );
}