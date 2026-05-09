import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, Building2, TrendingUp, TrendingDown } from 'lucide-react';
import HotelBudgetCard from '@/components/budget/HotelBudgetCard';
import HotelDrillDown from '@/components/budget/HotelDrillDown';
import StatCard from '@/components/ui/StatCard';
import { getHotelAllocatedTotal, formatCurrency } from '@/lib/helpers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const HOTEL_ORDER = ['AURA', 'H5A', 'INK48', 'LIFE', 'RENWICK', 'SMYTH', 'CORP'];

export default function HotelBudgets() {
  const [addOpen, setAddOpen] = useState(false);
  const [drillHotel, setDrillHotel] = useState(null);
  const [newHotel, setNewHotel] = useState({ name: '', short_code: '', room_revenue_budget: 0, sm_payroll_budget: 0 });
  const qc = useQueryClient();

  const { data: hotels = [] } = useQuery({ queryKey: ['hotels'], queryFn: () => base44.entities.Hotel.list() });
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });

  const activeEmployees = employees.filter(e => !e.suppressed);
  const suppressedCount = employees.length - activeEmployees.length;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Hotel.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotels'] }),
  });
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Hotel.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hotels'] }); setAddOpen(false); setNewHotel({ name: '', short_code: '', room_revenue_budget: 0, sm_payroll_budget: 0 }); },
  });

  const sortedHotels = [...hotels].sort((a, b) => HOTEL_ORDER.indexOf(a.short_code) - HOTEL_ORDER.indexOf(b.short_code));
  const propertyHotels = sortedHotels.filter(h => h.short_code !== 'CORP');

  const totalBudget = propertyHotels.reduce((s, h) => s + (h.sm_payroll_budget || 0), 0);
  const totalAllocated = propertyHotels.reduce((s, h) => s + getHotelAllocatedTotal(activeEmployees, h.short_code), 0);
  const totalRoomRev = propertyHotels.reduce((s, h) => s + (h.room_revenue_budget || 0), 0);
  const overBudgetCount = propertyHotels.filter(h => getHotelAllocatedTotal(activeEmployees, h.short_code) > (h.sm_payroll_budget || 0)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Hotel Budgets</h2>
          <p className="text-sm text-muted-foreground mt-1">
            2026 Room Revenue & S&M Payroll Budgets
            {suppressedCount > 0 && <span className="ml-2 text-amber-500 font-medium">· {suppressedCount} employee(s) suppressed</span>}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Hotel
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total S&M Budget" value={totalBudget} prefix="$" icon={DollarSign} color="blue" />
        <StatCard label="Total Allocated" value={totalAllocated} prefix="$" icon={TrendingUp} color={totalAllocated > totalBudget ? 'rose' : 'teal'} />
        <StatCard label="Total Room Revenue" value={totalRoomRev} prefix="$" icon={Building2} color="purple" />
        <StatCard label="Over Budget" value={overBudgetCount} suffix=" hotels" icon={TrendingDown} color={overBudgetCount > 0 ? 'rose' : 'teal'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedHotels.map(hotel => {
          const empCount = activeEmployees.filter(e => (e.allocations?.[hotel.short_code] || 0) > 0).length;
          return (
            <HotelBudgetCard
              key={hotel.id}
              hotel={hotel}
              allocatedTotal={getHotelAllocatedTotal(activeEmployees, hotel.short_code)}
              employeeCount={empCount}
              onUpdate={(data) => updateMutation.mutate({ id: hotel.id, data })}
              onClick={() => setDrillHotel(hotel)}
            />
          );
        })}
      </div>

      {drillHotel && (
        <HotelDrillDown
          hotel={drillHotel}
          employees={activeEmployees}
          onClose={() => setDrillHotel(null)}
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
    </div>
  );
}