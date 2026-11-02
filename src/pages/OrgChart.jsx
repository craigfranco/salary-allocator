import React, { useState, useRef, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import EmployeeForm from '@/components/salary/EmployeeForm';
import OrgTreeNode from '@/components/org/OrgTreeNode';
import { getTotalAllocation } from '@/lib/helpers';
import { GitBranch, Download, Image, Search, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useScenario } from '@/lib/ScenarioContext';
import { useRedactedIds } from '@/lib/RedactionContext';

const HOTEL_ORDER = ['AURA', 'HAFA', 'INK48', 'LIFE', 'RENWICK', 'SMYTH', 'CORP'];

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 1.5;
const roundZoom = (z) => Math.round(z * 100) / 100;

export default function OrgChart() {
  const [editEmp, setEditEmp] = useState(null);
  const [exporting, setExporting] = useState(null);
  const [deptFilter, setDeptFilter] = useState([]); // empty = all disciplines
  const [collapsedIds, setCollapsedIds] = useState(new Set());
  const [zoom, setZoom] = useState(1);
  const [search, setSearch] = useState('');
  const [hoverId, setHoverId] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [reassign, setReassign] = useState(null); // { empId, managerId }
  const [chartSize, setChartSize] = useState({ w: 0, h: 0 });
  const chartRef = useRef(null);
  const scrollRef = useRef(null);
  const qc = useQueryClient();
  const { redactedIds } = useRedactedIds();

  const captureCanvas = async () => {
    const el = chartRef.current;
    return html2canvas(el, {
      scale: 2,
      backgroundColor: '#f8fafc',
      useCORS: true,
      scrollX: 0,
      scrollY: 0,
      width: el.scrollWidth,
      height: el.scrollHeight,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
    });
  };

  const runExport = async (kind, filename) => {
    if (!chartRef.current) return;
    setExporting(kind);
    const prevZoom = zoom;
    if (zoom !== 1) setZoom(1); // capture at natural size
    await new Promise(r => setTimeout(r, 200));
    try {
      const canvas = await captureCanvas();
      if (kind === 'pdf') {
        const imgData = canvas.toDataURL('image/png');
        const pdfW = canvas.width / 2;
        const pdfH = canvas.height / 2;
        const pdf = new jsPDF({ orientation: pdfW > pdfH ? 'landscape' : 'portrait', unit: 'pt', format: [pdfW, pdfH] });
        pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
        pdf.save(filename);
      } else {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed: ' + err.message);
    } finally {
      setZoom(prevZoom);
      setExporting(null);
    }
  };

  const { activeScenario, scenarioData, setScenarioData } = useScenario();
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });
  const { data: hotels = [] } = useQuery({ queryKey: ['hotels'], queryFn: () => base44.entities.Hotel.list() });

  // Use scenario data if active, otherwise use DB employees
  const displayEmployees = Array.isArray(scenarioData) ? scenarioData : (Array.isArray(employees) ? employees : []);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setEditEmp(null); },
  });
  const reassignMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });

  const sortedHotels = [...hotels].sort((a, b) => HOTEL_ORDER.indexOf(a.short_code) - HOTEL_ORDER.indexOf(b.short_code));
  const hotelMap = Object.fromEntries(hotels.map(h => [h.short_code, h.name]));

  // Discipline filter: show selected departments plus their management chain up to roots
  const byId = useMemo(() => Object.fromEntries(displayEmployees.map(e => [e.id, e])), [displayEmployees]);
  const ancestorIds = (emp) => {
    const set = new Set();
    let cur = emp.manager_id && emp.manager_id.trim() ? byId[emp.manager_id] : null;
    while (cur && !set.has(cur.id)) {
      set.add(cur.id);
      cur = cur.manager_id && cur.manager_id.trim() ? byId[cur.manager_id] : null;
    }
    return set;
  };
  let allowedIds = null;
  if (deptFilter.length > 0) {
    allowedIds = new Set();
    displayEmployees.forEach(e => {
      if (deptFilter.includes(e.department)) {
        allowedIds.add(e.id);
        ancestorIds(e).forEach(id => allowedIds.add(id));
      }
    });
  }

  // Build manager → children map, subtree stats (payroll + headcount) and descendants
  const { childrenMap, subtreeStats, descendantIds } = useMemo(() => {
    const map = {};
    const active = displayEmployees.filter(e => (!e.suppressed || e.exclude_from_table) && (!allowedIds || allowedIds.has(e.id)));
    active.forEach(emp => {
      const mid = emp.manager_id && emp.manager_id.trim() ? emp.manager_id : null;
      if (!map[mid]) map[mid] = [];
      map[mid].push(emp);
    });

    // Sort children: REVENUE first, then ECOMM, then SALES; within same dept by name
    const DEPT_ORDER = { REVENUE: 0, ECOMM: 1, SALES: 2 };
    Object.keys(map).forEach(k => {
      map[k].sort((a, b) => {
        const deptDiff = (DEPT_ORDER[a.department] ?? 99) - (DEPT_ORDER[b.department] ?? 99);
        if (deptDiff !== 0) return deptDiff;
        return a.name.localeCompare(b.name);
      });
    });

    const stats = {};
    const computeStats = (id) => {
      const children = map[id] || [];
      let payroll = 0, head = 0;
      children.forEach(c => {
        const s = computeStats(c.id);
        payroll += s.payroll;
        head += s.headcount;
      });
      const emp = byId[id];
      if (emp && !emp.suppressed && !emp.exclude_from_table) {
        payroll += emp.annual_salary * getTotalAllocation(emp.allocations);
        head += 1;
      }
      stats[id] = { payroll, headcount: head };
      return stats[id];
    };

    const descendants = {};
    const computeDesc = (id) => {
      const set = new Set();
      (map[id] || []).forEach(c => {
        set.add(c.id);
        computeDesc(c.id).forEach(x => set.add(x));
      });
      descendants[id] = set;
      return set;
    };

    const activeIds = new Set(active.map(e => e.id));
    active.filter(e => !e.manager_id || !e.manager_id.trim() || !activeIds.has(e.manager_id)).forEach(r => {
      computeStats(r.id);
      computeDesc(r.id);
    });

    return { childrenMap: map, subtreeStats: stats, descendantIds: descendants };
  }, [displayEmployees, byId, deptFilter]);

  // Roots = employees with no manager or whose manager isn't in the active list
  const activeEmployees = displayEmployees.filter(e => (!e.suppressed || e.exclude_from_table) && (!allowedIds || allowedIds.has(e.id)));
  const activeIds = new Set(activeEmployees.map(e => e.id));
  const roots = activeEmployees.filter(e => !e.manager_id || !e.manager_id.trim() || !activeIds.has(e.manager_id));

  const suppressedCount = displayEmployees.filter(e => e.suppressed && !e.exclude_from_table).length;

  // Search spotlight
  const q = search.trim().toLowerCase();
  const searchMatchIds = useMemo(() => {
    if (!q) return null;
    return new Set(displayEmployees.filter(e =>
      e.name.toLowerCase().includes(q) || e.title.toLowerCase().includes(q)
    ).map(e => e.id));
  }, [q, displayEmployees]);

  useEffect(() => {
    if (!q || !searchMatchIds || searchMatchIds.size === 0) return;
    const first = [...searchMatchIds][0];
    const t = setTimeout(() => {
      document.querySelector(`[data-emp-id="${first}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, 80);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chain highlight on hover (path from hovered card up to the top)
  const highlightIds = useMemo(() => {
    if (!hoverId || searchMatchIds) return null;
    const set = new Set([hoverId]);
    let cur = byId[hoverId];
    while (cur?.manager_id && byId[cur.manager_id]) {
      set.add(cur.manager_id);
      cur = byId[cur.manager_id];
    }
    return set;
  }, [hoverId, byId, searchMatchIds]);

  // Measure chart size for zoom wrapper
  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const update = () => setChartSize({ w: el.scrollWidth, h: el.scrollHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  });

  const fitToScreen = () => {
    const el = scrollRef.current;
    if (!el || !chartSize.w) return;
    const scale = Math.min(1, (el.clientWidth - 48) / chartSize.w);
    setZoom(Math.max(ZOOM_MIN, roundZoom(scale)));
  };

  // Drag-to-reassign
  const dragHandlers = {
    onDragStart: (e, emp) => {
      setDraggedId(emp.id);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', emp.id);
    },
    onDragEnd: () => { setDraggedId(null); setDropTargetId(null); },
    onDragOver: (e, emp) => {
      if (!draggedId || emp.id === draggedId || descendantIds[draggedId]?.has(emp.id)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dropTargetId !== emp.id) setDropTargetId(emp.id);
    },
    onDrop: (e, emp) => {
      e.preventDefault();
      if (draggedId && emp.id !== draggedId && !descendantIds[draggedId]?.has(emp.id)) {
        setReassign({ empId: draggedId, managerId: emp.id });
      }
      setDraggedId(null);
      setDropTargetId(null);
    },
  };

  const applyReassign = (empId, newManagerId) => {
    if (activeScenario && Array.isArray(scenarioData)) {
      const updated = JSON.parse(JSON.stringify(scenarioData));
      const idx = updated.findIndex(e => e.id === empId);
      if (idx !== -1) {
        updated[idx].manager_id = newManagerId;
        setScenarioData(updated);
      }
    } else {
      reassignMutation.mutate({ id: empId, data: { manager_id: newManagerId } });
    }
  };

  const toggleCollapse = (id) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Organization Chart</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Reporting hierarchy
            {suppressedCount > 0 && <span className="ml-2 text-amber-500 font-medium">· {suppressedCount} suppressed (hidden)</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a person…"
              className="h-9 w-44 pl-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={zoom <= ZOOM_MIN}
              onClick={() => setZoom(z => Math.max(ZOOM_MIN, roundZoom(z - 0.1)))} title="Zoom out">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <button onClick={() => setZoom(1)} title="Reset to 100%"
              className="text-[11px] font-semibold w-10 text-center rounded hover:bg-muted px-1 py-1 tabular-nums">
              {Math.round(zoom * 100)}%
            </button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={zoom >= ZOOM_MAX}
              onClick={() => setZoom(z => Math.min(ZOOM_MAX, roundZoom(z + 0.1)))} title="Zoom in">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fitToScreen} title="Fit to screen">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
            <GitBranch className="w-3.5 h-3.5" />
            Click to edit · Drag onto a manager to reassign
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" disabled={!!exporting}>
                <Download className="w-4 h-4" />
                {exporting ? 'Exporting…' : 'Export'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => runExport('pdf', 'org-chart.pdf')} className="gap-2">
                <Download className="w-4 h-4" /> Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => runExport('img', 'org-chart.png')} className="gap-2">
                <Image className="w-4 h-4" /> Export as Image (PNG)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Legend / discipline filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setDeptFilter([])}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
            deptFilter.length === 0
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-card border-border text-muted-foreground hover:bg-muted/50'
          }`}
        >
          <span className="text-xs font-semibold">All</span>
        </button>
        {['REVENUE', 'ECOMM', 'SALES'].map(key => {
          const val = { REVENUE: { headerBg: 'bg-teal-500', text: 'text-teal-700', dot: 'bg-teal-400', label: 'Revenue' }, ECOMM: { headerBg: 'bg-orange-500', text: 'text-orange-700', dot: 'bg-orange-400', label: 'E-Commerce' }, SALES: { headerBg: 'bg-purple-500', text: 'text-purple-700', dot: 'bg-purple-400', label: 'Sales & Marketing' } }[key];
          const active = deptFilter.includes(key);
          return (
            <button
              key={key}
              onClick={() => setDeptFilter(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                active
                  ? `${val.headerBg} text-white border-transparent shadow-sm`
                  : 'bg-card border-border text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-white/80' : val.dot}`} />
              <span className={`text-xs font-semibold ${active ? 'text-white' : val.text}`}>{val.label}</span>
            </button>
          );
        })}
      </div>

      <div ref={scrollRef} className="overflow-auto rounded-2xl border border-border shadow-sm" style={{ background: '#f8fafc', maxHeight: 'calc(100vh - 240px)' }}>
        {/* Zoom wrapper: outer box sized to scaled content, inner scaled at natural size */}
        <div style={{ width: chartSize.w * zoom || undefined, height: chartSize.h * zoom || undefined }}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: chartSize.w ? chartSize.w : 'max-content' }}>
            <div ref={chartRef} className="inline-flex gap-12 items-start p-8" style={{ background: '#f8fafc' }}>
              {roots.map(root => (
                <OrgTreeNode
                  key={root.id}
                  employee={root}
                  childrenMap={childrenMap}
                  onClick={setEditEmp}
                  hotelMap={hotelMap}
                  redactedIds={redactedIds}
                  subtreeStats={subtreeStats}
                  collapsedIds={collapsedIds}
                  onToggleCollapse={toggleCollapse}
                  highlightIds={highlightIds}
                  searchMatchIds={searchMatchIds}
                  draggedId={draggedId}
                  dropTargetId={dropTargetId}
                  onHover={setHoverId}
                  drag={dragHandlers}
                />
              ))}
              {roots.length === 0 && (
                <p className="text-sm text-muted-foreground py-12">No employees to display.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {editEmp && (
        <EmployeeForm
          open={!!editEmp}
          onClose={() => setEditEmp(null)}
          onSave={(form) => updateMutation.mutate({ id: editEmp.id, data: form })}
          employee={editEmp}
          hotels={sortedHotels}
          allEmployees={displayEmployees}
        />
      )}

      <AlertDialog open={!!reassign} onOpenChange={() => setReassign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Reporting Line</AlertDialogTitle>
            <AlertDialogDescription>
              Make <strong>{reassign && byId[reassign.empId]?.name}</strong> report to{' '}
              <strong>{reassign && byId[reassign.managerId]?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { applyReassign(reassign.empId, reassign.managerId); setReassign(null); }}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}