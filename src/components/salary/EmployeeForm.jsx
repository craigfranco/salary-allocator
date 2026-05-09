import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EmployeeForm({ open, onClose, onSave, employee, hotels, allEmployees = [] }) {
  const [form, setForm] = useState(employee || {
    name: '', title: '', department: 'REVENUE', annual_salary: 0, allocations: {}, manager_id: ''
  });

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
            <Label className="mb-2 block">Hotel Allocations (%)</Label>
            <div className="grid grid-cols-2 gap-3">
              {hotels.filter(h => h.short_code !== 'CORP').map(h => (
                <div key={h.short_code} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16 truncate">{h.short_code}</span>
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