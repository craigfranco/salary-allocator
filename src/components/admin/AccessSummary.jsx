import React from 'react';
import { DEPT_LABELS } from '@/lib/deptConfig';

export function ModulesCell({ modules }) {
  const list = modules?.length ? modules : ['ALL'];
  if (list.includes('ALL')) {
    return <span className="text-[12px] text-[#334155]">All modules</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {list.map((m) => (
        <span
          key={m}
          className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] font-semibold text-[#475569]"
        >
          {DEPT_LABELS[m] || m}
        </span>
      ))}
    </div>
  );
}

export function HotelsCell({ hotels }) {
  const list = hotels?.length ? hotels : ['ALL'];
  if (list.includes('ALL')) {
    return <span className="text-[12px] text-[#334155]">All hotels</span>;
  }
  if (list.length === 1) {
    return <span className="text-[12px] text-[#334155]">1 hotel assigned</span>;
  }
  return <span className="text-[12px] text-[#334155]">{list.length} hotels assigned</span>;
}