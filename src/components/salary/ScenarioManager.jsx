import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BookMarked, Save, Trash2, ChevronDown, Check } from 'lucide-react';

export default function ScenarioManager({ employees, onRestore }) {
  const [open, setOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null); // { id, name }
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const qc = useQueryClient();

  const { data: scenarios = [] } = useQuery({
    queryKey: ['scenarios'],
    queryFn: () => base44.entities.Scenario.list('-created_date', 50),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.Scenario.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scenarios'] });
      setSaveOpen(false);
      setName('');
      setDescription('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Scenario.delete(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['scenarios'] });
      if (activeScenario?.id === id) setActiveScenario(null);
    },
  });

  const handleSave = () => {
    if (!name.trim()) return;
    const snapshot = {};
    employees.forEach(emp => {
      snapshot[emp.id] = { allocations: emp.allocations || {}, suppressed: emp.suppressed || false };
    });
    saveMutation.mutate({ name: name.trim(), description: description.trim(), snapshot });
  };

  const handleRestore = (scenario) => {
    onRestore(scenario.snapshot);
    setActiveScenario({ id: scenario.id, name: scenario.name });
    // Keep popover open so user can flip between scenarios
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {activeScenario && (
          <span className="text-xs text-muted-foreground italic flex items-center gap-1">
            <BookMarked className="w-3 h-3" />
            {activeScenario.name}
          </span>
        )}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <BookMarked className="w-4 h-4" />
              Scenarios
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-1" onInteractOutside={() => setOpen(false)}>
            <button
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium rounded-sm hover:bg-accent cursor-pointer"
              onClick={() => { setOpen(false); setSaveOpen(true); }}
            >
              <Save className="w-4 h-4" /> Save Current as Scenario
            </button>

            {scenarios.length > 0 && (
              <>
                <div className="my-1 h-px bg-border" />
                <div className="px-2 py-1 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Saved Scenarios</div>
                {scenarios.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer group"
                    onClick={() => handleRestore(s)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-4 flex-shrink-0 flex items-center justify-center">
                        {activeScenario?.id === s.id
                          ? <Check className="w-3.5 h-3.5 text-primary" />
                          : <div className="w-3.5 h-3.5" />
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{s.name}</div>
                        {s.description && <div className="text-xs text-muted-foreground truncate">{s.description}</div>}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(s.id); }}
                      className="p-1 rounded hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                      title="Delete scenario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </>
            )}

            {scenarios.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground italic">No saved scenarios yet</div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Save Scenario</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Scenario Name</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Base Plan 2026"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Any notes about this scenario…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name.trim() || saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save Scenario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}