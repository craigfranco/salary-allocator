export function getTotalAllocation(allocations) {
  if (!allocations) return 0;
  return Object.values(allocations).reduce((sum, val) => sum + (val || 0), 0);
}

export function getAllocationStatus(total) {
  const rounded = Math.round(total * 1000) / 1000;
  if (rounded === 1) return 'exact';
  if (rounded >= 0.95 && rounded < 1) return 'close-under';
  if (rounded > 1 && rounded <= 1.05) return 'close-over';
  if (rounded < 0.95) return 'under';
  return 'over';
}

export function getAllocationColor(status) {
  switch (status) {
    case 'exact': return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30';
    case 'close-under':
    case 'close-over': return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30';
    case 'under':
    case 'over': return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30';
    default: return '';
  }
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

export function getHotelAllocatedTotal(employees, hotelCode) {
  return employees.reduce((sum, emp) => {
    const pct = emp.allocations?.[hotelCode] || 0;
    return sum + (pct * emp.annual_salary);
  }, 0);
}

export function getDeptColor(dept) {
  switch (dept) {
    case 'REVENUE': return 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-700';
    case 'ECOMM': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700';
    case 'SALES': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700';
    default: return 'bg-muted text-muted-foreground';
  }
}

export function getDeptBgColor(dept) {
  switch (dept) {
    case 'REVENUE': return 'from-teal-600 to-teal-800';
    case 'ECOMM': return 'from-orange-500 to-orange-700';
    case 'SALES': return 'from-purple-600 to-purple-800';
    default: return 'from-muted to-muted';
  }
}

export function getDeptAccent(dept) {
  switch (dept) {
    case 'REVENUE': return '#0d9488';
    case 'ECOMM': return '#f97316';
    case 'SALES': return '#9333ea';
    default: return '#6b7280';
  }
}

export const HOTEL_SHORT_NAMES = {
  AURA:    'Aura',
  HAFA:    'HAFA',
  INK48:   'Ink 48',
  LIFE:    'Life',
  RENWICK: 'Renwick',
  SMYTH:   'Smyth',
  CORP:    'Corp',
};

export const HOTEL_COLORS = {
  AURA:    { bg: 'bg-blue-500',    text: 'text-blue-600',    badge: 'bg-blue-100 text-blue-700',    hex: '#3b82f6' },
  HAFA:    { bg: 'bg-indigo-500',  text: 'text-indigo-600',  badge: 'bg-indigo-100 text-indigo-700',  hex: '#6366f1' },
  INK48:   { bg: 'bg-violet-500',  text: 'text-violet-600',  badge: 'bg-violet-100 text-violet-700',  hex: '#8b5cf6' },
  LIFE:    { bg: 'bg-emerald-500', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', hex: '#10b981' },
  RENWICK: { bg: 'bg-amber-500',   text: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700',    hex: '#f59e0b' },
  SMYTH:   { bg: 'bg-rose-500',    text: 'text-rose-600',    badge: 'bg-rose-100 text-rose-700',      hex: '#f43f5e' },
  CORP:    { bg: 'bg-slate-400',   text: 'text-slate-600',   badge: 'bg-slate-100 text-slate-700',    hex: '#94a3b8' },
};