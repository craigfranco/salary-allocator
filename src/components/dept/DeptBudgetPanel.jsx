import React, { useState } from 'react';
import { Wallet, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/helpers';

export default function DeptBudgetPanel({ deptLabel, budget = 0, payroll = 0, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(budget);

  const remaining = budget - payroll;
  const pct = budget > 0 ? (payroll / budget) * 100 : 0;
  const over = budget > 0 && payroll > budget;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-20px_rgba(15,23,42,0.15)] p-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{deptLabel} Department Budget</h3>
            <p className="text-xs text-muted-foreground">2027 payroll budget for the {deptLabel} department</p>
          </div>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              className="h-9 w-40"
              value={value}
              onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
              autoFocus
            />
            <Button
              size="icon"
              className="h-9 w-9"
              onClick={() => { onSave(value); setEditing(false); }}
              title="Save budget"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9"
              onClick={() => setEditing(false)}
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tabular-nums">{formatCurrency(budget)}</span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => { setValue(budget); setEditing(true); }}
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          </div>
        )}
      </div>
      {budget > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">
              Department payroll: <strong className="text-foreground">{formatCurrency(payroll)}</strong>
            </span>
            <span className={over ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
              {over ? `${formatCurrency(-remaining)} over budget` : `${formatCurrency(remaining)} remaining`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${over ? 'bg-destructive' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}