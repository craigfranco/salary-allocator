import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, Unlock } from 'lucide-react';

const DEPARTMENT_LABELS = { FINANCE: 'Finance', HR: 'Human Resources', ENGINEERING: 'Engineering' };

export default function EmployeeForm({ open, onClose, onSave, employee, hotels, allEmployees = [], fixedDepartment }) {
  const [form, setForm] = useState(employee || {
    name: '', title: '', department: fixedDepartment || 'REVENUE', annual_salary: 0, allocations: {}, manager_id: '', suppressed: false, locked_hotels: []
  });
  const [selectedHotels, setSelectedHotels] = useState(() => {
    if (employee?.allocations) {
      const withAlloc = hotels.filter(h => (employee.allocations[h.short_code] || 0) > 0);
      return new Set(withAlloc.length > 0 ? withAlloc.map(h => h.short_code) : hotels.map(h => h.short_code));
    }
    return new Set(hotels.map(h => h.short_code));
  });
  const [lockedHotels, setLockedHotels] = useState(new Set(employee?.locked_hotels || []));
  const pctRefs = useRef({});

  // Spread the remainder (1 - lockedSum) evenly across unlocked, selected hotels.
  const spreadRemainderEvenly = (lockedSet) => {
    const lockedSum = hotels.filter(h => lockedSet.has(h.short_code)).reduce((s, h) => s + (form.allocations?.[h.short_code] || 0), 0);
    const remainder = Math.max(0, 1 - lockedSum);
    const unlocked = hotels.filter(h => !lockedSet.has(h.short_code) && selectedHotels.has(h.short_code));
    const each = unlocked.length > 0 ? remainder / unlocked.length : 0;
    const newAllocs = {};
    hotels.forEach(h => {
      if (lockedSet.has(h.short_code)) newAllocs[h.short_code] = form.allocations?.[h.short_code] || 0;
      else newAllocs[h.short_code] = selectedHotels.has(h.short_code) ? each : 0;
    });
    setForm(prev => ({ ...prev, allocations: newAllocs }));
  };

  const toggleLock = (code) => {
    const willLock = !lockedHotels.has(code);
    const next = new Set(lockedHotels);
    if (willLock) next.add(code); else next.delete(code);
    setLockedHotels(next);
    if (willLock) spreadRemainderEvenly(next);
  };

  const toggleHotel = (code) => {
    setSelectedHotels(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const applyEvenSplit = () => {
    if (lockedHotels.size > 0) { spreadRemainderEvenly(lockedHotels); return; }
    const selected = hotels.filter(h => selectedHotels.has(h.short_code));
    if (selected.length === 0) return;
    const even = 1 / selected.length;
    const newAllocs = {};
    hotels.forEach(h => {
      newAllocs[h.short_code] = selectedHotels.has(h.short_code) ? even : 0;
    });
    setForm(prev => ({ ...prev, allocations: newAllocs }));
  };

  const applyRoomCountSplit = () => {
    const locked = hotels.filter(h => lockedHotels.has(h.short_code));
    const lockedSum = locked.reduce((s, h) => s + (form.allocations?.[h.short_code] || 0), 0);
    const remainder = locked.length > 0 ? Math.max(0, 1 - lockedSum) : 1;
    const unlocked = hotels.filter(h => !lockedHotels.has(h.short_code) && selectedHotels.has(h.short_code) && (h.room_count || 0) > 0);
    const totalRooms = unlocked.reduce((s, h) => s + h.room_count, 0);
    if (locked.length === 0 && totalRooms === 0) return;
    const newAllocs = {};
    hotels.forEach(h => {
      if (lockedHotels.has(h.short_code)) {
        newAllocs[h.short_code] = form.allocations?.[h.short_code] || 0;
      } else if (!selectedHotels.has(h.short_code)) {
        newAllocs[h.short_code] = 0;
      } else {
        const rooms = h.room_count || 0;
        newAllocs[h.short_code] = (totalRooms > 0 && rooms > 0) ? (rooms / totalRooms) * remainder : 0;
      }
    });
    setForm(prev => ({ ...prev, allocations: newAllocs }));
  };

  const applyRevenueSplit = () => {
    const locked = hotels.filter(h => lockedHotels.has(h.short_code));
    const lockedSum = locked.reduce((s, h) => s + (form.allocations?.[h.short_code] || 0), 0);
    const remainder = locked.length > 0 ? Math.max(0, 1 - lockedSum) : 1;
    const unlocked = hotels.filter(h => !lockedHotels.has(h.short_code) && selectedHotels.has(h.short_code) && (h.total_revenue_budget || 0) > 0);
    const totalRev = unlocked.reduce((s, h) => s + h.total_revenue_budget, 0);
    if (locked.length === 0 && totalRev === 0) return;
    const newAllocs = {};
    hotels.forEach(h => {
      if (lockedHotels.has(h.short_code)) {
        newAllocs[h.short_code] = form.allocations?.[h.short_code] || 0;
      } else if (!selectedHotels.has(h.short_code)) {
        newAllocs[h.short_code] = 0;
      } else {
        const rev = h.total_revenue_budget || 0;
        newAllocs[h.short_code] = (totalRev > 0 && rev > 0) ? (rev / totalRev) * remainder : 0;
      }
    });
    setForm(prev => ({ ...prev, allocations: newAllocs }));
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAllocChange = (code, value) => {
    const v = parseFloat(value) / 100 || 0;
    if (lockedHotels.has(code)) {
      // Locked hotel: hold this value, spread the remainder evenly across unlocked selected.
      const lockedValues = {};
      hotels.forEach(h => { lockedValues[h.short_code] = (h.short_code === code) ? v : (form.allocations?.[h.short_code] || 0); });
      const lockedSum = hotels.filter(h => lockedHotels.has(h.short_code)).reduce((s, h) => s + lockedValues[h.short_code], 0);
      const remainder = Math.max(0, 1 - lockedSum);
      const unlocked = hotels.filter(h => !lockedHotels.has(h.short_code) && selectedHotels.has(h.short_code));
      const each = unlocked.length > 0 ? remainder / unlocked.length : 0;
      const newAllocs = {};
      hotels.forEach(h => {
        if (lockedHotels.has(h.short_code)) newAllocs[h.short_code] = lockedValues[h.short_code];
        else newAllocs[h.short_code] = selectedHotels.has(h.short_code) ? each : 0;
      });
      setForm(prev => ({ ...prev, allocations: newAllocs }));
      return;
    }
    setForm(prev => ({
      ...prev,
      allocations: { ...prev.allocations, [code]: v }
    }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.title) return;
    if (!form.exclude_from_table && !form.annual_salary) return;
    const payload = form.exclude_from_table ? { ...form, annual_salary: 0, allocations: {} } : form;
    onSave({ ...payload, locked_hotels: Array.from(lockedHotels) });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              {fixedDepartment ? (
                <Input value={DEPARTMENT_LABELS[fixedDepartment] || fixedDepartment} disabled />
              ) : (
                <Select value={form.department} onValueChange={(v) => handleChange('department', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REVENUE">Revenue</SelectItem>
                    <SelectItem value="ECOMM">E-Commerce</SelectItem>
                    <SelectItem value="SALES">Sales & Marketing</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label>Annual Salary</Label>
              {form.exclude_from_table ? (
                <div className="flex h-9 items-center px-3 rounded-md border border-dashed border-input bg-muted/30 text-sm text-muted-foreground">Not required</div>
              ) : (
                <Input type="number" value={form.annual_salary} onChange={(e) => handleChange('annual_salary', parseFloat(e.target.value) || 0)} />
              )}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/30">
            <div>
              <Label className="cursor-pointer">Department Head</Label>
              <p className="text-xs text-muted-foreground mt-0.5">No salary required — excluded from the salary table and calculations, shown only in the org chart</p>
            </div>
            <Checkbox
              checked={!!form.exclude_from_table}
              onCheckedChange={(v) => handleChange('exclude_from_table', !!v)}
            />
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
          {!form.exclude_from_table && (
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <Label>Hotel Allocations (%)</Label>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 text-muted-foreground"
                    onClick={() => {
                      const all = new Set(hotels.filter(h => h.short_code !== 'CORP').map(h => h.short_code));
                      setSelectedHotels(all);
                    }}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 text-muted-foreground"
                    onClick={() => setSelectedHotels(new Set())}
                  >
                    Deselect All
                  </Button>
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
                    onClick={applyRoomCountSplit}
                  >
                    By Room Count ({selectedHotels.size})
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={applyRevenueSplit}
                  >
                    By Revenue ({selectedHotels.size})
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
            {lockedHotels.size > 0 && (
              <p className="text-xs text-muted-foreground mb-2">
                {lockedHotels.size} hotel{lockedHotels.size > 1 ? 's' : ''} locked — spread buttons distribute the remainder across the rest.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {hotels.map(h => {
                const isLocked = lockedHotels.has(h.short_code);
                const isSelected = selectedHotels.has(h.short_code);
                return (
                  <div
                    key={h.short_code}
                    className={`rounded-xl border p-3 space-y-2 transition-colors ${
                      isSelected ? 'border-border bg-muted/30' : 'border-border/50 bg-muted/10 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleHotel(h.short_code)}
                        className="flex-shrink-0"
                      />
                      <div className={`flex-1 min-w-0 text-sm font-semibold truncate ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>{h.name}</div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">{h.short_code}</span>
                    </div>
                    <div className="flex items-center gap-2 pl-7">
                      <Input
                        type="number"
                        min="0" max="100"
                        className={`h-8 text-xs text-right ${isLocked ? 'border-primary/40 bg-primary/5 font-semibold' : ''}`}
                        value={Math.round((form.allocations?.[h.short_code] || 0) * 100)}
                        onChange={(e) => handleAllocChange(h.short_code, e.target.value)}
                        ref={(el) => { pctRefs.current[h.short_code] = el; }}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter') return;
                          e.preventDefault();
                          const codes = hotels.map(x => x.short_code);
                          const nextCode = codes[codes.indexOf(h.short_code) + 1];
                          if (nextCode) pctRefs.current[nextCode]?.focus();
                        }}
                      />
                      <span className="text-xs text-muted-foreground flex-shrink-0">%</span>
                      <button
                        type="button"
                        onClick={() => toggleLock(h.short_code)}
                        title={isLocked ? 'Unlock this hotel' : 'Lock this % and spread the rest'}
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        {isLocked
                          ? <Lock className="w-3.5 h-3.5 text-primary" />
                          : <Unlock className="w-3.5 h-3.5 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}
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