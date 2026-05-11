import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import EmployeeForm from '@/components/salary/EmployeeForm';
import { formatCurrency, HOTEL_COLORS, HOTEL_SHORT_NAMES } from '@/lib/helpers';
import { User, EyeOff, GitBranch, Download, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useScenario } from '@/lib/ScenarioContext';

const HOTEL_ORDER = ['AURA', 'H5A', 'INK48', 'LIFE', 'RENWICK', 'SMYTH', 'CORP'];

const DEPT_STYLES = {
  REVENUE: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-400', headerBg: 'bg-teal-500', label: 'Revenue', dot: 'bg-teal-400' },
  ECOMM:   { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-400', headerBg: 'bg-orange-500', label: 'E-Commerce', dot: 'bg-orange-400' },
  SALES:   { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-400', headerBg: 'bg-purple-500', label: 'Sales & Marketing', dot: 'bg-purple-400' },
};

const CRAIG_STYLE = { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-400', headerBg: 'bg-amber-500', label: 'Head of Commercial', dot: 'bg-amber-400' };

function EmployeeCard({ employee, onClick, hotelMap }) {
  const dept = employee.exclude_from_table ? CRAIG_STYLE : (DEPT_STYLES[employee.department] || {});
  const suppressed = !!employee.suppressed;
  const allocEntries = Object.entries(employee.allocations || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const nonCorpCodes = Object.keys(hotelMap).filter(c => c !== 'CORP');
  const allocedNonCorp = allocEntries.filter(([c]) => c !== 'CORP');
  const isExecDir = /executive director/i.test(employee.title);
  const isAll = isExecDir || allocedNonCorp.length >= nonCorpCodes.length;

  return (
    <div
      onClick={() => onClick(employee)}
      className={`rounded-xl border-2 ${dept.border} bg-white overflow-hidden cursor-pointer transition-all duration-150 select-none w-52 flex-shrink-0 shadow-md ${
        suppressed ? 'opacity-40' : 'hover:shadow-xl hover:scale-[1.03]'
      }`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Colored header bar */}
      <div className={`${dept.headerBg} px-3 py-2 flex items-center gap-2`}>
        <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
          {suppressed ? <EyeOff className="w-3 h-3 text-white" /> : <User className="w-3 h-3 text-white" />}
        </div>
        <p className="text-[11px] font-bold text-white leading-tight flex-1 break-words">{employee.name}</p>
      </div>
      {/* Body */}
      <div className={`px-3 py-2 ${dept.bg}`}>
        <p className={`text-[10px] font-semibold ${dept.text} leading-snug mb-1.5`} style={{ minHeight: '28px' }}>{employee.title}</p>
        {allocEntries.length > 0 && (
          <>
            <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-200 gap-px mb-1.5">
              {allocEntries.map(([code, pct]) => (
                <div key={code} className={`${HOTEL_COLORS[code]?.bg || 'bg-slate-400'}`} style={{ width: `${pct * 100}%` }} title={`${code}: ${Math.round(pct * 100)}%`} />
              ))}
            </div>
            {isAll ? (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-white/70 text-gray-600 border border-gray-200">All Hotels</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {allocEntries.map(([code]) => code !== 'CORP' && (
                  <span key={code} className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${HOTEL_COLORS[code]?.badge || 'bg-gray-100 text-gray-500'}`}>
                    {HOTEL_SHORT_NAMES[code] || hotelMap[code] || code}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const CARD_W = 208; // w-52
const CARD_GAP = 16; // gap-4
const SLOT_W = CARD_W + CARD_GAP; // width per child slot

// Returns total pixel width that a subtree occupies
function subtreeWidth(employeeId, childrenMap) {
  const children = childrenMap[employeeId] || [];
  if (children.length === 0) return CARD_W;
  const total = children.reduce((sum, c) => sum + subtreeWidth(c.id, childrenMap), 0);
  return total + CARD_GAP * (children.length - 1);
}

// Recursive tree node
function OrgNode({ employee, childrenMap, onClick, hotelMap }) {
  const children = childrenMap[employee.id] || [];
  const myWidth = subtreeWidth(employee.id, childrenMap);

  // Compute cumulative widths to find center of each child subtree
  const childWidths = children.map(c => subtreeWidth(c.id, childrenMap));
  let cumulative = 0;
  const childCenters = childWidths.map(w => {
    const center = cumulative + w / 2;
    cumulative += w + CARD_GAP;
    return center;
  });

  const firstCenter = childCenters[0] ?? 0;
  const lastCenter = childCenters[childCenters.length - 1] ?? 0;

  return (
    <div className="flex flex-col items-center" style={{ width: myWidth }}>
      <EmployeeCard employee={employee} onClick={onClick} hotelMap={hotelMap} />
      {children.length > 0 && (
        <>
          {/* Vertical line from parent down */}
          <div className="w-0.5 h-8 bg-gray-300" />
          {/* Horizontal bar spanning first to last child center */}
          {children.length > 1 && (
            <div className="relative h-0.5 bg-transparent" style={{ width: myWidth }}>
              <div
                className="absolute top-0 h-0.5 bg-gray-300"
                style={{ left: firstCenter, width: lastCenter - firstCenter }}
              />
            </div>
          )}
          {/* Children row with vertical drops */}
          <div className="flex items-start" style={{ width: myWidth }}>
            {children.map((child, idx) => (
              <div key={child.id} className="flex flex-col items-center" style={{ width: childWidths[idx], marginRight: idx < children.length - 1 ? CARD_GAP : 0 }}>
                <div className="w-0.5 h-8 bg-gray-300" />
                <OrgNode
                  employee={child}
                  childrenMap={childrenMap}
                  onClick={onClick}
                  hotelMap={hotelMap}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function OrgChart() {
  const [editEmp, setEditEmp] = useState(null);
  const [exporting, setExporting] = useState(null);
  const chartRef = useRef(null);
  const qc = useQueryClient();

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

  const handleExportPDF = async () => {
    if (!chartRef.current) return;
    setExporting('pdf');
    try {
      const canvas = await captureCanvas();
      const imgData = canvas.toDataURL('image/png');
      const pdfW = canvas.width / 2;
      const pdfH = canvas.height / 2;
      const pdf = new jsPDF({ orientation: pdfW > pdfH ? 'landscape' : 'portrait', unit: 'pt', format: [pdfW, pdfH] });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save('org-chart.pdf');
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Export failed: ' + err.message);
    } finally {
      setExporting(null);
    }
  };

  const handleExportImage = async () => {
    if (!chartRef.current) return;
    setExporting('img');
    try {
      const canvas = await captureCanvas();
      const link = document.createElement('a');
      link.download = 'org-chart.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Image export failed:', err);
      alert('Export failed: ' + err.message);
    } finally {
      setExporting(null);
    }
  };

  const { activeScenario, scenarioData } = useScenario();
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });
  const { data: hotels = [] } = useQuery({ queryKey: ['hotels'], queryFn: () => base44.entities.Hotel.list() });

  // Use scenario data if active, otherwise use DB employees
  const displayEmployees = Array.isArray(scenarioData) ? scenarioData : (Array.isArray(employees) ? employees : []);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setEditEmp(null); },
  });

  const sortedHotels = [...hotels].sort((a, b) => HOTEL_ORDER.indexOf(a.short_code) - HOTEL_ORDER.indexOf(b.short_code));
  const hotelMap = Object.fromEntries(hotels.map(h => [h.short_code, h.name]));

  // Build manager → children map
  const childrenMap = {};
  const activeEmployees = displayEmployees.filter(e => !e.suppressed);

  activeEmployees.forEach(emp => {
    const mid = emp.manager_id && emp.manager_id.trim() ? emp.manager_id : null;
    if (!childrenMap[mid]) childrenMap[mid] = [];
    childrenMap[mid].push(emp);
  });

  // Sort children: REVENUE first, then ECOMM, then SALES; within same dept by name
  const DEPT_ORDER = { REVENUE: 0, ECOMM: 1, SALES: 2 };
  Object.keys(childrenMap).forEach(k => {
    childrenMap[k].sort((a, b) => {
      const deptDiff = (DEPT_ORDER[a.department] ?? 99) - (DEPT_ORDER[b.department] ?? 99);
      if (deptDiff !== 0) return deptDiff;
      return a.name.localeCompare(b.name);
    });
  });

  // Roots = employees with no manager or whose manager isn't in the active list
  const activeIds = new Set(activeEmployees.map(e => e.id));
  const roots = activeEmployees.filter(e => !e.manager_id || !e.manager_id.trim() || !activeIds.has(e.manager_id));

  const suppressedCount = displayEmployees.filter(e => e.suppressed).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Organization Chart</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Reporting hierarchy
            {suppressedCount > 0 && <span className="ml-2 text-amber-500 font-medium">· {suppressedCount} suppressed (hidden)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
            <GitBranch className="w-3.5 h-3.5" />
            Click a card to edit
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" disabled={!!exporting}>
                <Download className="w-4 h-4" />
                {exporting ? 'Exporting…' : 'Export'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF} className="gap-2">
                <Download className="w-4 h-4" /> Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportImage} className="gap-2">
                <Image className="w-4 h-4" /> Export as Image (PNG)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(DEPT_STYLES).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border shadow-sm">
            <div className={`w-2.5 h-2.5 rounded-full ${val.dot}`} />
            <span className={`text-xs font-semibold ${val.text}`}>{val.label}</span>
          </div>
        ))}
      </div>

      <div className="overflow-auto rounded-2xl border border-border shadow-sm" style={{ background: '#f8fafc' }}>
        <div ref={chartRef} className="inline-flex gap-12 items-start p-8" style={{ background: '#f8fafc' }}>
          {roots.map(root => (
            <OrgNode
              key={root.id}
              employee={root}
              childrenMap={childrenMap}
              onClick={setEditEmp}
              hotelMap={hotelMap}
            />
          ))}
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
    </div>
  );
}