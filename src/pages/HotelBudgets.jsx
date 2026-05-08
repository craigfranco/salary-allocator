import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import HotelBudgetCard from '@/components/budget/HotelBudgetCard';
import { getHotelAllocatedTotal, formatCurrency } from '@/lib/helpers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function HotelBudgets() {
  const [addOpen, setAddOpen] = useState(false);
  const [newHotel, setNewHotel] = useState({ name: '', short_code: '', room_revenue_budget: 0, sm_payroll_budget: 0 });
  const qc = useQueryClient();

  const { data: hotels = [] } = useQuery({ queryKey: ['hotels'], queryFn: () => base44.entities.Hotel.list() });
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });

  const activeEmployees = employees.filter(e => !e.suppressed);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Hotel.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotels'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Hotel.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hotels'] }); setAddOpen(false); setNewHotel({ name: '', short_code: '', room_revenue_budget: 0, sm_payroll_budget: 0 }); },
  });

  const sortedHotels = [...hotels].sort((a, b) => {
    const order = ['AURA', 'H5A', 'INK48', 'LIFE', 'RENWICK', 'SMYTH', 'CORP'];
    return order.indexOf(a.short_code) - order.indexOf(b.short_code);
  });

  const totalBudget = hotels.reduce((s, h) => s + (h.sm_payroll_budget || 0), 0);
  const totalAllocated = hotels.reduce((s, h) => s + getHotelAllocatedTotal(activeEmployees, h.short_code), 0);
  const suppressedCount = employees.length - activeEmployees.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Hotel Budgets</h2>
          <p className="text-sm text-muted-foreground mt-1">
            2026 Room Revenue & S&M Payroll Budgets
            {suppressedCount > 0 && <span className="ml-2 text-amber-600 font-medium">· {suppressedCount} employee(s) suppressed</span>}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Hotel
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-primary rounded-xl">
        <div>
          <p className="text-xs text-primary-foreground/60 uppercase tracking-wider font-semibold">Total S&M Budget</p>
          <p className="text-2xl font-bold text-primary-foreground font-display mt-1">{formatCurrency(totalBudget)}</p>
        </div>
        <div>
          <p className="text-xs text-primary-foreground/60 uppercase tracking-wider font-semibold">Total Allocated</p>
          <p className={`text-2xl font-bold font-display mt-1 ${totalAllocated > totalBudget ? 'text-red-300' : 'text-emerald-300'}`}>
            {formatCurrency(totalAllocated)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedHotels.map(hotel => (
          <HotelBudgetCard
            key={hotel.id}
            hotel={hotel}
            allocatedTotal={getHotelAllocatedTotal(activeEmployees, hotel.short_code)}
            onUpdate={(data) => updateMutation.mutate({ id: hotel.id, data })}
          />
        ))}
      </div>

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