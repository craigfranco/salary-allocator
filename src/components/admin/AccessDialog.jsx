import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { DEPT_LABELS } from '@/lib/deptConfig';

const MODULES = Object.keys(DEPT_LABELS);

export default function AccessDialog({ open, user, hotels = [], saving, onClose, onSave }) {
  const [modules, setModules] = useState(['ALL']);
  const [hotelCodes, setHotelCodes] = useState(['ALL']);

  useEffect(() => {
    if (open && user) {
      setModules(user.modules?.length ? user.modules : ['ALL']);
      setHotelCodes(user.hotels?.length ? user.hotels : ['ALL']);
    }
  }, [open, user]);

  const allModules = modules.includes('ALL');
  const allHotels = hotelCodes.includes('ALL');

  const toggle = (list, setList, key) =>
    setList(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-bold text-[#0f172a]">Grant access</DialogTitle>
          <DialogDescription className="text-[12px] text-[#64748b]">
            {user?.full_name || user?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label>Modules / disciplines</Label>
              <label className="flex items-center gap-2 text-[12px] font-medium text-[#334155] cursor-pointer">
                <Checkbox checked={allModules} onCheckedChange={(c) => setModules(c ? ['ALL'] : [])} />
                All modules
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {MODULES.map((key) => {
                const on = !allModules && modules.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={allModules}
                    onClick={() => toggle(modules, setModules, key)}
                    className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
                      allModules
                        ? 'border-[#eef2f6] bg-[#f8fafc] text-[#cbd5e1]'
                        : on
                          ? 'border-[#1e293b] bg-[#1e293b] text-white'
                          : 'border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc]'
                    }`}
                  >
                    {DEPT_LABELS[key]}
                  </button>
                );
              })}
            </div>
            {!allModules && modules.length === 0 && (
              <p className="text-[11.5px] text-[#b45309]">No discipline selected — pick at least one.</p>
            )}
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label>Hotels</Label>
              <label className="flex items-center gap-2 text-[12px] font-medium text-[#334155] cursor-pointer">
                <Checkbox checked={allHotels} onCheckedChange={(c) => setHotelCodes(c ? ['ALL'] : [])} />
                All hotels
              </label>
            </div>
            <div className={`grid grid-cols-2 gap-1.5 ${allHotels ? 'opacity-40 pointer-events-none' : ''}`}>
              {hotels.map((h) => (
                <label
                  key={h.short_code}
                  className="flex items-center gap-2 rounded-lg border border-[#eef2f6] px-2.5 py-1.5 text-[12px] text-[#334155] cursor-pointer hover:bg-[#f8fafc]"
                >
                  <Checkbox
                    checked={hotelCodes.includes(h.short_code)}
                    onCheckedChange={() => toggle(hotelCodes, setHotelCodes, h.short_code)}
                  />
                  <span className="truncate">{h.name}</span>
                </label>
              ))}
            </div>
            {!allHotels && hotelCodes.length === 0 && (
              <p className="text-[11.5px] text-[#b45309]">No hotel selected — pick at least one.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            className="bg-[#1e293b] hover:bg-[#0f172a] text-white"
            disabled={saving || (!allModules && modules.length === 0) || (!allHotels && hotelCodes.length === 0)}
            onClick={() => onSave({ modules, hotels: hotelCodes })}
          >
            {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>) : 'Save access'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}