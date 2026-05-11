import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { generateExecPDF } from '@/lib/generateExecPDF';
import { FileDown } from 'lucide-react';

export default function ExecPDFButton() {
  const [loading, setLoading] = useState(false);

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });
  const { data: hotels = [] } = useQuery({ queryKey: ['hotels'], queryFn: () => base44.entities.Hotel.list() });

  const handleClick = () => {
    if (loading || !employees.length) return;
    setLoading(true);
    try {
      generateExecPDF(employees, hotels);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', gap: '7px',
        background: loading ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.15)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: '8px',
        padding: '7px 14px',
        fontFamily: 'Inter, Arial, sans-serif',
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = loading ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.15)'; }}
    >
      <FileDown size={15} />
      {loading ? 'Preparing…' : 'Export PDF'}
    </button>
  );
}