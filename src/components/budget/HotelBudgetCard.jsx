import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, Pencil, Check, X } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers';

export default function HotelBudgetCard({ hotel, allocatedTotal, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [roomRev, setRoomRev] = useState(hotel.room_revenue_budget);
  const [payroll, setPayroll] = useState(hotel.sm_payroll_budget);

  const budget = hotel.sm_payroll_budget || 0;
  const remaining = budget - allocatedTotal;
  const pctUsed = budget > 0 ? (allocatedTotal / budget) * 100 : 0;

  let statusColor = 'bg-emerald-100 text-emerald-700 border-emerald-200';
  let progressColor = 'bg-emerald-500';
  if (pctUsed > 100) { statusColor = 'bg-red-100 text-red-700 border-red-200'; progressColor = 'bg-red-500'; }
  else if (pctUsed > 95) { statusColor = 'bg-amber-100 text-amber-700 border-amber-200'; progressColor = 'bg-amber-500'; }

  const handleSave = () => {
    onUpdate({ room_revenue_budget: roomRev, sm_payroll_budget: payroll });
    setEditing(false);
  };

  if (hotel.short_code === 'CORP') return null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-base font-display">{hotel.name}</CardTitle>
          </div>
          {!editing ? (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={handleSave}>
                <Check className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(false)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Room Revenue Budget</label>
              <Input type="number" value={roomRev} onChange={(e) => setRoomRev(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">S&M Payroll Budget</label>
              <Input type="number" value={payroll} onChange={(e) => setPayroll(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Room Revenue</p>
                <p className="text-sm font-bold mt-0.5">{formatCurrency(hotel.room_revenue_budget)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">S&M Budget</p>
                <p className="text-sm font-bold mt-0.5">{formatCurrency(budget)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Allocated</p>
                <p className="text-sm font-bold mt-0.5">{formatCurrency(allocatedTotal)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Remaining</p>
                <p className={`text-sm font-bold mt-0.5 ${remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatCurrency(remaining)}
                </p>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Budget Used</span>
                <Badge variant="outline" className={`text-[10px] ${statusColor}`}>
                  {Math.round(pctUsed)}%
                </Badge>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${Math.min(pctUsed, 100)}%` }} />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}