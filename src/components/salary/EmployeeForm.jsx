import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EmployeeForm({ open, onClose, onSave, employee, hotels, allEmployees = [] }) {
  const [form, setForm] = useState(employee || {
    name: '', title: '', department: 'REVENUE', annual_salary: 0, allocations: {}, manager_id: ''
  });
  const [selectedHotels, setSelectedHotels] = useState(() => {
    if (employee?.allocations) {
      const withAlloc = hotels.filter(h => (employee.allocations[h.short_code] || 0) > 0);
      return new Set(withAlloc.length > 0 ? withAlloc.map(h => h.short_code) : hotels.map(h => h.short_code));
    }
    return new Set(hotels.map(h => h.short_code));
  });

  const toggleHotel = (code) => {
    setSelectedHotels(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const applyEvenSplit = () => {
    const selected = hotels.filter(h => selectedHotels.has(h.short_code));
    if (selected.length === 0) return;
    const even = 1 / selected.length;
    const newAllocs = {};
    hotels.forEach(h => {
      newAllocs[h.short_code] = selectedHotels.has(h.short_code) ? even : 0;
    });
    setForm(prev => ({ ...prev, allocations: newAllocs }));
  };

  const applyRevenueSplit = () => {
    const selected = hotels.filter(h => selectedHotels.has(h.short_code) && (h.room_revenue_budget || 0) > 0);
    const totalRev = selected.reduce((s, h) => s + h.room_revenue_budget, 0);
    if (totalRev === 0) return;
    const newAllocs = {};
    hotels.forEach(h => {
      if (!selectedHotels.has(h.short_code)) {
        newAllocs[h.short_code] = 0;
      } else {
        const rev = h.room_revenue_budget || 0;
        newAllocs[h.short_code] = rev > 0 ? rev / totalRev : 0;
      }
    });
    setForm(prev => ({ ...prev, allocations: newAllocs }));
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAllocChange = (code, value) => {
    setForm(prev => ({
      ...prev,
      allocations: { ...prev.allocations, [code]: parseFloat(value) / 100 || 0 }
    }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.title || !form.annual_salary) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{employee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="John Doe" />
            </div>
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Director..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Department</Label>
              <Select value={form.department} onValueChange={(v) => handleChange('department', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="REVENUE">Revenue</SelectItem>
                  <SelectItem value="ECOMM">E-Commerce</SelectItem>
                  <SelectItem value="SALES">Sales & Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Annual Salary</Label>
              <Input type="number" value={form.annual_salary} onChange={(e) => handleChange('annual_salary', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          {allEmployees.length > 0 && (
            <div>
              <Label>Direct Manager</Label>
              <Select
                value={form.manager_id || 'none'}
                onValueChange={(v) => handleChange('manager_id', v === 'none' ? '' : v)}
              >
                <SelectTrigger><SelectValue placeholder="No manager (top-level)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No manager (top-level) —</SelectItem>
                  {allEmployees
                    .filter(e => e.id !== employee?.id)
                    .map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name} · {e.title}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <Label>Hotel Allocations (%)</Label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={applyEvenSplit}
                  >
                    Even Split ({selectedHotels.size})
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={applyRevenueSplit}
                  >
                    By Room Rev ({selectedHotels.size})
                  </Button>
                </div>
                {(() => {
                  const totalPct = Math.round(Object.values(form.allocations || {}).reduce((s, v) => s + (v || 0), 0) * 100);
                  const color = totalPct === 100 ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' : totalPct > 100 ? 'text-red-500 bg-red-500/10 border-red-500/30' : 'text-amber-500 bg-amber-500/10 border-amber-500/30';
                  return (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
                      Total: {totalPct}%
                    </span>
                  );
                })()}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {hotels.map(h => (
                <div key={h.short_code} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedHotels.has(h.short_code)}
                    onCheckedChange={() => toggleHotel(h.short_code)}
                    className="flex-shrink-0"
                  />
                  <span className={`text-xs w-14 truncate ${selectedHotels.has(h.short_code) ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{h.short_code}</span>
                  <Input
                    type="number"
                    min="0" max="100"
                    className="h-8 text-xs"
                    value={Math.round((form.allocations?.[h.short_code] || 0) * 100)}
                    onChange={(e) => handleAllocChange(h.short_code, e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-primary text-primary-foreground">
            {employee ? 'Save Changes' : 'Add Employee'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}