import React from 'react';
import { Plus, Minus, Users, EyeOff } from 'lucide-react';
import { HOTEL_COLORS, HOTEL_SHORT_NAMES } from '@/lib/helpers';

export const CARD_W = 208;
export const CARD_GAP = 16;

const DEPT_STYLES = {
  REVENUE: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-400', headerBg: 'bg-teal-500', label: 'Revenue', dot: 'bg-teal-400' },
  ECOMM:   { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-400', headerBg: 'bg-orange-500', label: 'E-Commerce', dot: 'bg-orange-400' },
  SALES:   { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-400', headerBg: 'bg-purple-500', label: 'Sales & Marketing', dot: 'bg-purple-400' },
  FINANCE: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-400', headerBg: 'bg-sky-500', label: 'Finance', dot: 'bg-sky-400' },
  HR:      { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-400', headerBg: 'bg-rose-500', label: 'Human Resources', dot: 'bg-rose-400' },
  ENGINEERING: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-400', headerBg: 'bg-slate-500', label: 'Engineering', dot: 'bg-slate-400' },
};

const HEAD_STYLE = { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-400', headerBg: 'bg-amber-500', label: 'Department Head', dot: 'bg-amber-400' };

// Total pixel width a subtree occupies (collapsed branches count as one card)
export function subtreeWidth(employeeId, childrenMap, collapsedIds) {
  if (collapsedIds.has(employeeId)) return CARD_W;
  const children = childrenMap[employeeId] || [];
  if (children.length === 0) return CARD_W;
  const total = children.reduce((sum, c) => sum + subtreeWidth(c.id, childrenMap, collapsedIds), 0);
  return total + CARD_GAP * (children.length - 1);
}

function initialsOf(name) {
  return (name || '').split(/\s+/).filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

function EmployeeCard({
  employee, stats, childCount, isCollapsed, onClick, hotelMap, redactedIds,
  isHighlighted, isSearchMatch, isDropTarget, isDragged, onToggleCollapse, onHover, drag,
}) {
  const dept = employee.exclude_from_table ? HEAD_STYLE : (DEPT_STYLES[employee.department] || {});
  const suppressed = !!employee.suppressed && !employee.exclude_from_table;
  const allocEntries = Object.entries(employee.allocations || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const nonCorpCodes = Object.keys(hotelMap).filter(c => c !== 'CORP');
  const allocedNonCorp = allocEntries.filter(([c]) => c !== 'CORP');
  const isExecDir = /executive director/i.test(employee.title);
  const isAll = isExecDir || allocedNonCorp.length >= nonCorpCodes.length;
  const showRollup = childCount > 0 && stats && stats.headcount > 0;

  return (
    <div
      data-emp-id={employee.id}
      draggable
      onDragStart={(e) => drag.onDragStart(e, employee)}
      onDragEnd={drag.onDragEnd}
      onDragOver={(e) => drag.onDragOver(e, employee)}
      onDrop={(e) => drag.onDrop(e, employee)}
      onMouseEnter={() => onHover(employee.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(employee)}
      className={`rounded-xl border-2 ${dept.border} bg-white overflow-hidden cursor-pointer transition-all duration-150 select-none w-52 flex-shrink-0 shadow-md
        ${isDragged ? 'opacity-40 rotate-1' : ''}
        ${isDropTarget ? 'ring-4 ring-emerald-400/70 scale-[1.04]' : ''}
        ${isSearchMatch ? 'ring-4 ring-amber-400/80' : ''}
        ${isHighlighted && !isSearchMatch && !isDropTarget ? 'ring-2 ring-primary/50' : ''}
        ${suppressed ? 'opacity-40' : 'hover:shadow-xl hover:scale-[1.03]'}`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Colored header bar */}
      <div className={`${dept.headerBg} px-3 py-2 flex items-center gap-2`}>
        <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
          {suppressed
            ? <EyeOff className="w-3 h-3 text-white" />
            : <span className="text-[9px] font-bold text-white">{initialsOf(employee.name)}</span>}
        </div>
        <p className="text-[11px] font-bold text-white leading-tight flex-1 break-words">{employee.name}</p>
        {isCollapsed && childCount > 0 && (
          <span className="text-[9px] font-bold bg-white/25 text-white rounded-full px-1.5 py-0.5 flex-shrink-0">
            {stats?.headcount ?? childCount}
          </span>
        )}
        {childCount > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(employee.id); }}
            title={isCollapsed ? 'Expand branch' : 'Collapse branch'}
            className="w-4 h-4 rounded bg-white/25 hover:bg-white/40 flex items-center justify-center flex-shrink-0 text-white transition-colors"
          >
            {isCollapsed ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          </button>
        )}
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
      {/* Headcount rollup footer (salaries intentionally not shown in the org chart) */}
      {showRollup && (
        <div className="flex items-center justify-end px-3 py-1.5 bg-white/85 border-t border-gray-100">
          <span className="flex items-center gap-1 text-[9px] font-semibold text-gray-500 tabular-nums" title="Headcount in this branch">
            <Users className="w-2.5 h-2.5" />
            {stats.headcount}
          </span>
        </div>
      )}
    </div>
  );
}

// Recursive tree node
export default function OrgTreeNode({
  employee, childrenMap, onClick, hotelMap, redactedIds, subtreeStats, collapsedIds,
  onToggleCollapse, highlightIds, searchMatchIds, draggedId, dropTargetId, onHover, drag,
}) {
  const allChildren = childrenMap[employee.id] || [];
  const isCollapsed = collapsedIds.has(employee.id);
  const children = isCollapsed ? [] : allChildren;
  const myWidth = subtreeWidth(employee.id, childrenMap, collapsedIds);

  const childWidths = children.map(c => subtreeWidth(c.id, childrenMap, collapsedIds));
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
      <EmployeeCard
        employee={employee}
        stats={subtreeStats[employee.id]}
        childCount={allChildren.length}
        isCollapsed={isCollapsed}
        onClick={onClick}
        hotelMap={hotelMap}
        redactedIds={redactedIds}
        isHighlighted={!!highlightIds?.has(employee.id)}
        isSearchMatch={!!searchMatchIds?.has(employee.id)}
        isDropTarget={dropTargetId === employee.id}
        isDragged={draggedId === employee.id}
        onToggleCollapse={onToggleCollapse}
        onHover={onHover}
        drag={drag}
      />
      {children.length > 0 && (
        <>
          {/* Vertical line from parent down */}
          <div className="w-0.5 h-8 bg-gray-300 rounded-full" />
          {/* Horizontal bar spanning first to last child center */}
          {children.length > 1 && (
            <div className="relative h-0.5 bg-transparent" style={{ width: myWidth }}>
              <div
                className="absolute top-0 h-0.5 bg-gray-300 rounded-full"
                style={{ left: firstCenter, width: lastCenter - firstCenter }}
              />
            </div>
          )}
          {/* Children row with vertical drops */}
          <div className="flex items-start" style={{ width: myWidth }}>
            {children.map((child, idx) => (
              <div key={child.id} className="flex flex-col items-center" style={{ width: childWidths[idx], marginRight: idx < children.length - 1 ? CARD_GAP : 0 }}>
                <div className="w-0.5 h-8 bg-gray-300 rounded-full" />
                <OrgTreeNode
                  employee={child}
                  childrenMap={childrenMap}
                  onClick={onClick}
                  hotelMap={hotelMap}
                  redactedIds={redactedIds}
                  subtreeStats={subtreeStats}
                  collapsedIds={collapsedIds}
                  onToggleCollapse={onToggleCollapse}
                  highlightIds={highlightIds}
                  searchMatchIds={searchMatchIds}
                  draggedId={draggedId}
                  dropTargetId={dropTargetId}
                  onHover={onHover}
                  drag={drag}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}