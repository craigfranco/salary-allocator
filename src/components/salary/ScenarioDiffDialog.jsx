import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, ArrowRightLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers';

export default function ScenarioDiffDialog({ open, onClose, onConfirm, currentEmployees = [], scenarioName, scenarioSnapshot = [] }) {
  const diff = useMemo(() => {
    const currentMap = new Map(currentEmployees.map(e => [e.id, e]));
    const snapshotMap = new Map(scenarioSnapshot.map(e => [e.id, e]));

    const added = [];
    const removed = [];
    const changed = [];

    snapshotMap.forEach((emp, id) => {
      if (!currentMap.has(id)) {
        added.push(emp);
      } else {
        const curr = currentMap.get(id);
        const salaryChanged = curr.annual_salary !== emp.annual_salary;
        const allocChanged = JSON.stringify(curr.allocations || {}) !== JSON.stringify(emp.allocations || {});
        const deptChanged = curr.department !== emp.department;
        const titleChanged = curr.title !== emp.title;
        if (salaryChanged || allocChanged || deptChanged || titleChanged) {
          changed.push({ name: emp.name, title: emp.title, salaryChanged, allocChanged, deptChanged, titleChanged, oldSalary: curr.annual_salary, newSalary: emp.annual_salary });
        }
      }
    });

    currentMap.forEach((emp, id) => {
      if (!snapshotMap.has(id)) {
        removed.push(emp);
      }
    });

    return { added, removed, changed };
  }, [currentEmployees, scenarioSnapshot]);

  const hasChanges = diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Restore "{scenarioName}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {hasChanges ? (
            <>
              <p className="text-sm text-muted-foreground">
                This will replace the current state with the saved scenario. Here's what will change:
              </p>

              {diff.added.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mb-1.5">
                    <UserPlus className="w-3.5 h-3.5" />
                    Added ({diff.added.length})
                  </div>
                  <div className="space-y-1 pl-5">
                    {diff.added.map(e => (
                      <div key={e.id} className="text-xs text-muted-foreground">
                        {e.name} · <span className="text-foreground font-medium">{e.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diff.removed.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-red-500 mb-1.5">
                    <UserMinus className="w-3.5 h-3.5" />
                    Removed ({diff.removed.length})
                  </div>
                  <div className="space-y-1 pl-5">
                    {diff.removed.map(e => (
                      <div key={e.id} className="text-xs text-muted-foreground">
                        {e.name} · <span className="text-foreground font-medium">{e.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diff.changed.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 mb-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Changed ({diff.changed.length})
                  </div>
                  <div className="space-y-1 pl-5">
                    {diff.changed.map((c, i) => (
                      <div key={i} className="text-xs text-muted-foreground">
                        {c.name}
                        {c.salaryChanged && <span className="text-amber-500 ml-1">· {formatCurrency(c.oldSalary)} → {formatCurrency(c.newSalary)}</span>}
                        {(c.deptChanged || c.titleChanged) && <span className="text-amber-500 ml-1">· {c.titleChanged ? 'title' : 'dept'} updated</span>}
                        {c.allocChanged && !c.salaryChanged && <span className="text-amber-500 ml-1">· allocations updated</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No changes detected — the current state matches this scenario.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm} disabled={!hasChanges} className="bg-primary text-primary-foreground">
            Restore Scenario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}