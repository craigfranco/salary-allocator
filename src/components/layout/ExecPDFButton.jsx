import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { generateExecPDF } from '@/lib/generateExecPDF';
import { FileDown, EyeOff } from 'lucide-react';
import SalaryRedactionManager, { useRedactedIds } from '@/components/salary/SalaryRedactionManager';

export default function ExecPDFButton() {
  const [loading, setLoading] = useState(false);
  const [redactionOpen, setRedactionOpen] = useState(false);
  const { redactedIds } = useRedactedIds();

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });
  const { data: hotels = [] } = useQuery({ queryKey: ['hotels'], queryFn: () => base44.entities.Hotel.list() });

  const handleClick = () => {
    if (loading || !employees.length) return;
    setLoading(true);
    try {
      generateExecPDF(employees, hotels, redactedIds);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const btnBase = {
    display: 'flex', alignItems: 'center', gap: '7px',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '8px',
    padding: '7px 14px',
    fontFamily: 'Inter, Arial, sans-serif',
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.02em',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => setRedactionOpen(true)}
          title="Manage salary redaction"
          style={{
            ...btnBase,
            padding: '7px 10px',
            background: redactedIds.size > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.12)',
            borderColor: redactedIds.size > 0 ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.25)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = redactedIds.size > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.12)'; }}
        >
          <EyeOff size={15} />
          {redactedIds.size > 0 && (
            <span style={{ fontSize: '11px', background: 'rgba(245,158,11,0.6)', borderRadius: '10px', padding: '1px 6px' }}>
              {redactedIds.size}
            </span>
          )}
        </button>

        <button
          onClick={handleClick}
          disabled={loading}
          style={{
            ...btnBase,
            background: loading ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.15)',
            cursor: loading ? 'wait' : 'pointer',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = loading ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.15)'; }}
        >
          <FileDown size={15} />
          {loading ? 'Preparing…' : 'Export PDF'}
        </button>
      </div>

      <SalaryRedactionManager open={redactionOpen} onOpenChange={setRedactionOpen} />
    </>
  );
}