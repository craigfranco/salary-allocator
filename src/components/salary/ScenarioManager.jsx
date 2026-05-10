import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { BookMarked, Save, Trash2, RotateCcw, ChevronDown } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export default function ScenarioManager({ employees, onRestore }) {
  const [saveOpen, setSaveOpen] = useState(false);
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scenarios'] }),
  });

  const handleSave = () => {
    if (!name.trim()) return;
    const snapshot = {};
    employees.forEach(emp => {
      snapshot[emp.id] = emp.allocations || {};
    });
    saveMutation.mutate({ name: name.trim(), description: description.trim(), snapshot });
  };

  const handleRestore = (scenario) => {
    onRestore(scenario.snapshot);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <BookMarked className="w-4 h-4" />
            Scenarios
            <ChevronDown className="w-3 h-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem onClick={() => setSaveOpen(true)} className="gap-2 font-medium">
            <Save className="w-4 h-4" /> Save Current as Scenario
          </DropdownMenuItem>
          {scenarios.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Saved Scenarios</div>
              {scenarios.map(s => (
                <div key={s.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm group">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleRestore(s)}>
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    {s.description && <div className="text-xs text-muted-foreground truncate">{s.description}</div>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button
                      onClick={() => handleRestore(s)}
                      className="p-1 rounded hover:bg-primary/10 text-primary"
                      title="Restore this scenario"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(s.id)}
                      className="p-1 rounded hover:bg-destructive/10 text-destructive"
                      title="Delete scenario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
          {scenarios.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground italic">No saved scenarios yet</div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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