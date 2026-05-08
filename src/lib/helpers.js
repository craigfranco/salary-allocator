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
    case 'exact': return 'text-emerald-600 bg-emerald-50';
    case 'close-under':
    case 'close-over': return 'text-amber-600 bg-amber-50';
    case 'under':
    case 'over': return 'text-red-600 bg-red-50';
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
    case 'REVENUE': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'ECOMM': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'SALES': return 'bg-amber-100 text-amber-800 border-amber-200';
    default: return 'bg-muted text-muted-foreground';
  }
}

export function getDeptBgColor(dept) {
  switch (dept) {
    case 'REVENUE': return 'from-blue-600 to-blue-800';
    case 'ECOMM': return 'from-purple-600 to-purple-800';
    case 'SALES': return 'from-amber-600 to-amber-800';
    default: return 'from-muted to-muted';
  }
}