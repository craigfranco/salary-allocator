import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const EMPTY_HOTEL = { name: '', short_code: '', total_revenue_budget: 0, sm_payroll_budget: 0, finance_payroll_budget: 0, hr_payroll_budget: 0, engineering_payroll_budget: 0 };

export default function HotelFormDialog({ open, onClose, onCreate, submitting = false }) {
  const [hotel, setHotel] = useState(EMPTY_HOTEL);

  useEffect(() => {
    if (open) setHotel(EMPTY_HOTEL);
  }, [open]);

  const set = (key, value) => setHotel(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Add New Hotel</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Hotel Name</Label><Input value={hotel.name} onChange={(e) => set('name', e.target.value)} /></div>
          <div><Label>Short Code</Label><Input value={hotel.short_code} onChange={(e) => set('short_code', e.target.value.toUpperCase())} /></div>
          <div><Label>Total Revenue Budget</Label><Input type="number" value={hotel.total_revenue_budget} onChange={(e) => set('total_revenue_budget', parseFloat(e.target.value) || 0)} /></div>
          <div><Label>S&M Payroll Budget (Commercial)</Label><Input type="number" value={hotel.sm_payroll_budget} onChange={(e) => set('sm_payroll_budget', parseFloat(e.target.value) || 0)} /></div>
          <div><Label>Finance Payroll Budget</Label><Input type="number" value={hotel.finance_payroll_budget} onChange={(e) => set('finance_payroll_budget', parseFloat(e.target.value) || 0)} /></div>
          <div><Label>HR Payroll Budget</Label><Input type="number" value={hotel.hr_payroll_budget} onChange={(e) => set('hr_payroll_budget', parseFloat(e.target.value) || 0)} /></div>
          <div><Label>Engineering Payroll Budget</Label><Input type="number" value={hotel.engineering_payroll_budget} onChange={(e) => set('engineering_payroll_budget', parseFloat(e.target.value) || 0)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)}>Cancel</Button>
          <Button onClick={() => onCreate(hotel)} disabled={submitting}>Add Hotel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}