// Executive PDF Generator for Rebel Hotel Co.

const HOTEL_ORDER = ['AURA', 'H5A', 'INK48', 'LIFE', 'RENWICK', 'SMYTH', 'CORP'];
const PROPERTY_HOTELS = ['AURA', 'H5A', 'INK48', 'LIFE', 'RENWICK', 'SMYTH'];

const HOTEL_NAMES = {
  AURA: 'Aura', H5A: 'H5A', INK48: 'Ink 48', LIFE: 'Life',
  RENWICK: 'Renwick', SMYTH: 'Smyth', CORP: 'Corp'
};

const HOTEL_COLORS_HEX = {
  AURA: '#2d4b5e', H5A: '#3d6b84', INK48: '#4a7d96',
  LIFE: '#5a8fa8', RENWICK: '#6aa1ba', SMYTH: '#7ab3cc', CORP: '#94a3b8'
};

const DEPT_COLORS = {
  REVENUE: { border: '#0d9488', badge: '#ccf0ed', text: '#0d9488', label: 'Revenue' },
  ECOMM:   { border: '#f97316', badge: '#fde8d4', text: '#f97316', label: 'E-Commerce' },
  SALES:   { border: '#9333ea', badge: '#ede9fe', text: '#9333ea', label: 'Sales' },
};

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
}

function fmtK(n) {
  if (!n) return '$0';
  if (Math.abs(n) >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1000) return '$' + Math.round(n / 1000) + 'K';
  return '$' + Math.round(n);
}

const LOGO_URL = 'https://media.base44.com/images/public/69fe195adbdd18b7b19462a0/64c6f20fe_d1eb1b4f2_RBLMark-RH_Blue.png';

const RH_WATERMARK = `<img src="${LOGO_URL}" style="position:absolute;bottom:40px;right:40px;width:260px;height:260px;opacity:0.08;filter:brightness(0) invert(1);" />`;

const RH_MARK_SMALL = `<img src="${LOGO_URL}" style="width:20px;height:20px;opacity:0.7;object-fit:contain;" />`;

const RH_MARK_WHITE = `<img src="${LOGO_URL}" style="width:28px;height:28px;opacity:0.6;filter:brightness(0) invert(1);object-fit:contain;" />`;

function pageHeader(title, pageNum) {
  return `<div style="background:#2d4b5e;height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 0.75in;flex-shrink:0;">
    <span style="font-family:Inter,Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.7);">${title}</span>
    <div style="display:flex;align-items:center;gap:16px;">
      ${RH_MARK_WHITE}
      <span style="font-family:Inter,Arial,sans-serif;font-size:10px;color:rgba(255,255,255,0.4);">Page ${pageNum}</span>
    </div>
  </div>`;
}

function pageFooter(pageNum) {
  return `<div style="position:absolute;bottom:0;left:0;right:0;border-top:1px solid #e2e7ed;display:flex;align-items:center;justify-content:space-between;padding:8px 0.75in;background:#fff;">
    <div style="display:flex;align-items:center;gap:8px;">
      ${RH_MARK_SMALL}
      <span style="font-family:Inter,Arial,sans-serif;font-size:8px;color:#6b7280;">Rebel Hotel Co. — Topline Salary Report 2026</span>
    </div>
    <span style="font-family:Inter,Arial,sans-serif;font-size:7px;font-weight:600;letter-spacing:0.1em;color:#fff;background:#2d4b5e;padding:2px 8px;border-radius:20px;">CONFIDENTIAL</span>
    <span style="font-family:Inter,Arial,sans-serif;font-size:8px;color:#9ca3af;">${pageNum}</span>
  </div>`;
}

// ─── PAGE 1: COVER ────────────────────────────────────────────────────────────
function buildCover(employees, hotels, date) {
  const active = employees.filter(e => !e.suppressed && !e.exclude_from_table);
  const totalPayroll = active.reduce((s, e) => s + (e.annual_salary || 0), 0);
  const propHotels = hotels.filter(h => PROPERTY_HOTELS.includes(h.short_code));

  return `<div class="page" style="background:#2d4b5e;display:flex;flex-direction:column;justify-content:space-between;position:relative;">
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 60px 40px;">
      <span style="font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.18em;color:rgba(255,255,255,0.6);text-transform:uppercase;">REBEL HOTEL CO.</span>
      <div style="width:60px;height:2px;background:#fff;margin:28px auto;opacity:0.35;"></div>
      <div style="font-family:'Playfair Display',Georgia,serif;font-size:52px;font-weight:400;color:#fff;letter-spacing:0.02em;text-align:center;line-height:1.1;">Topline Salary</div>
      <div style="font-family:Inter,Arial,sans-serif;font-size:18px;font-weight:300;color:rgba(255,255,255,0.75);margin-top:10px;">Executive Dashboard</div>
      <div style="width:60px;height:2px;background:#fff;margin:28px auto;opacity:0.35;"></div>
      <div style="font-family:Inter,Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.45);margin-top:20px;">2026 &nbsp;·&nbsp; Prepared ${date}</div>
    </div>
    ${RH_WATERMARK}
    <div style="background:#1a3347;height:100px;display:flex;align-items:center;justify-content:space-around;padding:0 60px;flex-shrink:0;">
      ${[
        { label: 'Total Employees', value: active.length },
        { label: 'Total Payroll', value: fmtK(totalPayroll) },
        { label: 'Hotels', value: propHotels.length },
        { label: 'Departments', value: 3 },
      ].map((s, i, arr) => `
        <div style="text-align:center;${i < arr.length - 1 ? 'border-right:1px solid rgba(255,255,255,0.15);padding-right:40px;margin-right:40px;' : ''}">
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:28px;color:#fff;">${s.value}</div>
          <div style="font-family:Inter,Arial,sans-serif;font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.08em;margin-top:4px;">${s.label}</div>
        </div>`).join('')}
    </div>
    <div style="text-align:center;padding-bottom:16px;background:#1a3347;">
      <span style="font-family:Inter,Arial,sans-serif;font-size:9px;color:rgba(255,255,255,0.35);">CONFIDENTIAL — FOR INTERNAL USE ONLY</span>
    </div>
  </div>`;
}

// ─── PAGE 2: EXECUTIVE SUMMARY ────────────────────────────────────────────────
function buildExecSummary(employees, hotels) {
  const active = employees.filter(e => !e.suppressed && !e.exclude_from_table);
  const totalPayroll = active.reduce((s, e) => s + (e.annual_salary || 0), 0);
  const avgSalary = active.length ? totalPayroll / active.length : 0;
  const propHotels = hotels.filter(h => PROPERTY_HOTELS.includes(h.short_code))
    .sort((a, b) => HOTEL_ORDER.indexOf(a.short_code) - HOTEL_ORDER.indexOf(b.short_code));

  // Hotel payroll totals
  const hotelTotals = {};
  PROPERTY_HOTELS.forEach(code => {
    hotelTotals[code] = active.reduce((s, e) => s + ((e.allocations?.[code] || 0) * e.annual_salary), 0);
  });
  const maxHotelTotal = Math.max(...Object.values(hotelTotals));

  // Dept breakdowns
  const depts = ['REVENUE', 'ECOMM', 'SALES'];
  const deptData = depts.map(d => {
    const emps = active.filter(e => e.department === d);
    const total = emps.reduce((s, e) => s + e.annual_salary, 0);
    return { dept: d, count: emps.length, total, pct: totalPayroll ? (total / totalPayroll * 100).toFixed(1) : '0' };
  });

  // Budget table
  const budgetRows = propHotels.map(h => {
    const allocated = hotelTotals[h.short_code] || 0;
    const variance = h.sm_payroll_budget ? allocated - h.sm_payroll_budget : null;
    const pctUsed = h.sm_payroll_budget ? (allocated / h.sm_payroll_budget * 100).toFixed(1) : null;
    return { name: HOTEL_NAMES[h.short_code], roomRev: h.room_revenue_budget, smBudget: h.sm_payroll_budget, allocated, variance, pctUsed };
  });

  return `<div class="page" style="display:flex;flex-direction:column;position:relative;">
    ${pageHeader('Executive Summary', 2)}
    <div class="inner-page" style="flex:1;overflow:hidden;padding:0.3in 0.5in 60px;">
      <!-- KPI cards -->
      <div style="display:flex;gap:20px;margin-bottom:16px;">
        ${[
          { label: 'Total Payroll', value: fmt(totalPayroll) },
          { label: 'Average Salary', value: fmt(avgSalary) },
          { label: 'Total Headcount', value: active.length },
        ].map(c => `<div style="flex:1;border-left:3px solid #2d4b5e;padding:14px 18px;background:#f8fafb;border-radius:0 6px 6px 0;">
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:26px;color:#2d4b5e;font-weight:600;">${c.value}</div>
          <div style="font-family:Inter,Arial,sans-serif;font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-top:4px;">${c.label}</div>
        </div>`).join('')}
      </div>

      <!-- Payroll by Hotel -->
      <div style="margin-bottom:14px;" class="no-break">
        <div style="font-family:Inter,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#2d4b5e;margin-bottom:8px;border-bottom:2px solid #e2e7ed;padding-bottom:4px;">Payroll by Hotel</div>
        ${PROPERTY_HOTELS.map(code => {
          const total = hotelTotals[code] || 0;
          const pct = maxHotelTotal ? (total / maxHotelTotal * 100) : 0;
          return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
            <div style="width:70px;font-family:Inter,Arial,sans-serif;font-size:9px;font-weight:600;color:#374151;">${HOTEL_NAMES[code]}</div>
            <div style="flex:1;background:#f0f4f7;border-radius:3px;height:16px;overflow:hidden;">
              <div style="width:${pct}%;background:${HOTEL_COLORS_HEX[code]};height:100%;border-radius:3px;"></div>
            </div>
            <div style="width:80px;font-family:Inter,Arial,sans-serif;font-size:9px;font-weight:600;color:#2d4b5e;text-align:right;">${fmt(total)}</div>
          </div>`;
        }).join('')}
      </div>

      <!-- Payroll by Dept -->
      <div style="margin-bottom:14px;" class="no-break">
        <div style="font-family:Inter,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#2d4b5e;margin-bottom:8px;border-bottom:2px solid #e2e7ed;padding-bottom:4px;">Payroll by Department</div>
        <div style="display:flex;gap:16px;">
          ${deptData.map(d => `<div style="flex:1;border-radius:8px;padding:14px;background:#f8fafb;border:1px solid #e2e7ed;">
            <div style="display:inline-block;padding:2px 10px;border-radius:20px;background:${DEPT_COLORS[d.dept]?.badge};color:${DEPT_COLORS[d.dept]?.text};font-family:Inter,Arial,sans-serif;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">${DEPT_COLORS[d.dept]?.label}</div>
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1d1f1c;">${fmt(d.total)}</div>
            <div style="font-family:Inter,Arial,sans-serif;font-size:9px;color:#6b7280;margin-top:4px;">${d.count} employees &nbsp;·&nbsp; ${d.pct}% of payroll</div>
          </div>`).join('')}
        </div>
      </div>

      <!-- Budget vs Actual -->
      <div class="no-break">
        <div style="font-family:Inter,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#2d4b5e;margin-bottom:8px;border-bottom:2px solid #e2e7ed;padding-bottom:4px;">Budget vs. Actual</div>
        <table style="width:100%;border-collapse:collapse;font-family:Inter,Arial,sans-serif;font-size:9px;">
          <thead>
            <tr style="background:#2d4b5e;">
              ${['Hotel','Room Rev Budget','S&M Payroll Budget','Salary Allocated','Variance','% Used'].map(h =>
                `<th style="padding:7px 10px;color:rgba(255,255,255,0.85);font-weight:600;text-align:${h==='Hotel'?'left':'right'};letter-spacing:0.05em;">${h}</th>`
              ).join('')}
            </tr>
          </thead>
          <tbody>
            ${budgetRows.map((r, i) => `<tr style="background:${i%2?'#f9f7f6':'#fff'};">
              <td style="padding:6px 10px;font-weight:600;color:#1d1f1c;">${r.name}</td>
              <td style="padding:6px 10px;text-align:right;color:#6b7280;">${r.roomRev ? fmt(r.roomRev) : '—'}</td>
              <td style="padding:6px 10px;text-align:right;color:#6b7280;">${r.smBudget ? fmt(r.smBudget) : '—'}</td>
              <td style="padding:6px 10px;text-align:right;font-weight:600;color:#1d1f1c;">${fmt(r.allocated)}</td>
              <td style="padding:6px 10px;text-align:right;font-weight:700;color:${r.variance === null ? '#9ca3af' : r.variance > 0 ? '#dc2626' : '#16a34a'};">${r.variance === null ? '—' : (r.variance > 0 ? '+' : '') + fmt(r.variance)}</td>
              <td style="padding:6px 10px;text-align:right;font-weight:700;color:${r.pctUsed === null ? '#9ca3af' : parseFloat(r.pctUsed) > 100 ? '#dc2626' : parseFloat(r.pctUsed) > 95 ? '#d97706' : '#16a34a'};">${r.pctUsed !== null ? r.pctUsed + '%' : '—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ${pageFooter(2)}
  </div>`;
}

// ─── PAGE 3: SALARY ALLOCATION TABLE ─────────────────────────────────────────
function buildSalaryTable(employees, hotels) {
  const hotelOrder = hotels
    .sort((a, b) => HOTEL_ORDER.indexOf(a.short_code) - HOTEL_ORDER.indexOf(b.short_code));
  const cols = hotelOrder.filter(h => h.short_code !== 'CORP');
  const corpHotel = hotelOrder.find(h => h.short_code === 'CORP');
  const allCols = [...cols, ...(corpHotel ? [corpHotel] : [])];

  const active = employees.filter(e => !e.suppressed && !e.exclude_from_table);
  const deptOrder = ['REVENUE', 'ECOMM', 'SALES'];

  let rows = '';
  const colTotals = {};
  allCols.forEach(h => { colTotals[h.short_code] = 0; });

  deptOrder.forEach(dept => {
    const deptEmps = active.filter(e => e.department === dept).sort((a, b) => b.annual_salary - a.annual_salary);
    if (!deptEmps.length) return;

    const dc = DEPT_COLORS[dept];
    const deptTotal = deptEmps.reduce((s, e) => s + e.annual_salary, 0);

    // dept header
    rows += `<tr style="background:#e8f0f5;">
      <td colspan="${3 + allCols.length * 2 + 1}" style="padding:5px 8px;font-family:Inter,Arial,sans-serif;font-size:8px;font-weight:700;color:${dc.text};text-transform:uppercase;letter-spacing:0.08em;border-left:3px solid ${dc.border};">
        ${dc.label} — ${deptEmps.length} employees &nbsp;|&nbsp; ${fmt(deptTotal)}
      </td>
    </tr>`;

    deptEmps.forEach((emp, i) => {
      const totalPct = Math.round(Object.values(emp.allocations || {}).reduce((s, v) => s + (v || 0), 0) * 100);
      const isExact = totalPct === 100;
      rows += `<tr style="background:${i%2?'#f9f7f6':'#fff'};border-left:3px solid ${dc.border};">
        <td style="padding:4px 6px;font-family:Inter,Arial,sans-serif;font-size:7.5px;">
          <span style="background:${dc.badge};color:${dc.text};padding:1px 5px;border-radius:3px;font-weight:700;font-size:7px;">${dc.label.substring(0,3).toUpperCase()}</span>
        </td>
        <td style="padding:4px 6px;font-family:Inter,Arial,sans-serif;font-size:8px;font-weight:600;color:#1d1f1c;white-space:nowrap;">${emp.name}</td>
        <td style="padding:4px 6px;font-family:Inter,Arial,sans-serif;font-size:7.5px;color:#6b7280;white-space:nowrap;max-width:120px;overflow:hidden;">${emp.title}</td>
        <td style="padding:4px 6px;font-family:Inter,Arial,sans-serif;font-size:8px;font-weight:700;text-align:right;color:#1d1f1c;">${fmt(emp.annual_salary)}</td>
        ${allCols.map(h => {
          const pct = emp.allocations?.[h.short_code] || 0;
          const dollar = pct * emp.annual_salary;
          if (h.short_code !== 'CORP') colTotals[h.short_code] += dollar;
          return `<td style="padding:4px 3px;font-family:Inter,Arial,sans-serif;font-size:7.5px;text-align:center;color:#6b7280;">${pct ? Math.round(pct*100)+'%' : ''}</td>
          <td style="padding:4px 3px;font-family:Inter,Arial,sans-serif;font-size:7.5px;text-align:right;color:#374151;">${dollar > 0 ? fmtK(dollar) : ''}</td>`;
        }).join('')}
        <td style="padding:4px 6px;font-family:Inter,Arial,sans-serif;font-size:8px;font-weight:700;text-align:center;color:${isExact ? '#16a34a' : '#dc2626'};">${totalPct}%</td>
      </tr>`;
    });

    // dept subtotal
    const deptSubtotals = allCols.map(h => {
      const t = deptEmps.reduce((s, e) => s + ((e.allocations?.[h.short_code] || 0) * e.annual_salary), 0);
      return t;
    });
    rows += `<tr style="background:#e8f0f5;font-weight:700;">
      <td colspan="4" style="padding:5px 8px;font-family:Inter,Arial,sans-serif;font-size:8px;font-weight:700;color:${dc.text};border-left:3px solid ${dc.border};">Subtotal ${dc.label}</td>
      ${allCols.map((h, i) => `<td style="padding:5px 3px;font-size:7.5px;text-align:center;"></td>
        <td style="padding:5px 3px;font-family:Inter,Arial,sans-serif;font-size:8px;font-weight:700;text-align:right;color:#2d4b5e;">${deptSubtotals[i] > 0 ? fmtK(deptSubtotals[i]) : ''}</td>`).join('')}
      <td></td>
    </tr>`;
  });

  // totals row
  rows += `<tr style="background:#2d4b5e;">
    <td colspan="4" style="padding:6px 8px;font-family:Inter,Arial,sans-serif;font-size:8.5px;font-weight:700;color:#fff;letter-spacing:0.08em;">TOTAL ALLOCATED</td>
    ${allCols.map(h => `<td></td><td style="padding:6px 3px;font-family:Inter,Arial,sans-serif;font-size:8.5px;font-weight:700;text-align:right;color:#fff;">${colTotals[h.short_code] > 0 ? fmt(colTotals[h.short_code]) : '—'}</td>`).join('')}
    <td></td>
  </tr>`;

  const headerCols = allCols.map(h =>
    `<th colspan="2" style="padding:6px 4px;color:rgba(255,255,255,0.85);font-weight:600;text-align:center;font-size:8px;letter-spacing:0.05em;border-left:1px solid rgba(255,255,255,0.15);">${HOTEL_NAMES[h.short_code]}</th>`
  ).join('');

  return `<div class="page" style="display:flex;flex-direction:column;position:relative;">
    ${pageHeader('Salary Allocation Table', 3)}
    <div style="flex:1;overflow:hidden;padding:8px 0.4in 60px;font-size:7.5px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#2d4b5e;">
            <th style="padding:6px 8px;color:rgba(255,255,255,0.85);font-weight:600;text-align:left;font-size:8px;letter-spacing:0.05em;font-family:Inter,Arial,sans-serif;">Dept</th>
            <th style="padding:6px 8px;color:rgba(255,255,255,0.85);font-weight:600;text-align:left;font-size:8px;font-family:Inter,Arial,sans-serif;">Name</th>
            <th style="padding:6px 8px;color:rgba(255,255,255,0.85);font-weight:600;text-align:left;font-size:8px;font-family:Inter,Arial,sans-serif;">Title</th>
            <th style="padding:6px 8px;color:rgba(255,255,255,0.85);font-weight:600;text-align:right;font-size:8px;font-family:Inter,Arial,sans-serif;">Salary</th>
            ${headerCols}
            <th style="padding:6px 8px;color:rgba(255,255,255,0.85);font-weight:600;text-align:center;font-size:8px;font-family:Inter,Arial,sans-serif;border-left:1px solid rgba(255,255,255,0.15);">Total%</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${pageFooter(3)}
  </div>`;
}

// ─── PAGE 4: HOTEL BUDGET BREAKDOWN ──────────────────────────────────────────
function buildHotelBreakdown(employees, hotels) {
  const active = employees.filter(e => !e.suppressed && !e.exclude_from_table);
  const propHotels = hotels
    .filter(h => PROPERTY_HOTELS.includes(h.short_code))
    .sort((a, b) => HOTEL_ORDER.indexOf(a.short_code) - HOTEL_ORDER.indexOf(b.short_code));

  const hotelSections = propHotels.map(h => {
    const code = h.short_code;
    const allocated = active.reduce((s, e) => s + ((e.allocations?.[code] || 0) * e.annual_salary), 0);
    const remaining = h.sm_payroll_budget ? h.sm_payroll_budget - allocated : null;
    const pctUsed = h.sm_payroll_budget ? (allocated / h.sm_payroll_budget * 100) : null;
    const barColor = pctUsed === null ? '#9ca3af' : pctUsed > 100 ? '#dc2626' : pctUsed > 80 ? '#d97706' : '#16a34a';
    const barWidth = pctUsed !== null ? Math.min(pctUsed, 100).toFixed(1) : 0;

    const deptOrder = ['REVENUE', 'ECOMM', 'SALES'];
    let empRows = '';
    deptOrder.forEach(dept => {
      const deptEmps = active.filter(e => e.department === dept && (e.allocations?.[code] || 0) > 0);
      if (!deptEmps.length) return;
      const dc = DEPT_COLORS[dept];
      const deptTotal = deptEmps.reduce((s, e) => s + ((e.allocations?.[code] || 0) * e.annual_salary), 0);
      empRows += `<tr><td colspan="4" style="padding:4px 6px;background:#f0f4f7;font-family:Inter,Arial,sans-serif;font-size:7.5px;font-weight:700;color:${dc.text};text-transform:uppercase;">${dc.label}</td></tr>`;
      deptEmps.forEach(e => {
        const pct = e.allocations?.[code] || 0;
        empRows += `<tr>
          <td style="padding:3px 6px 3px 12px;font-family:Inter,Arial,sans-serif;font-size:7.5px;color:#374151;">${e.name}</td>
          <td style="padding:3px 6px;font-family:Inter,Arial,sans-serif;font-size:7px;color:#6b7280;">${e.title}</td>
          <td style="padding:3px 6px;font-family:Inter,Arial,sans-serif;font-size:7.5px;text-align:right;color:#6b7280;">${Math.round(pct*100)}%</td>
          <td style="padding:3px 6px;font-family:Inter,Arial,sans-serif;font-size:7.5px;text-align:right;font-weight:600;color:#2d4b5e;">${fmt(pct * e.annual_salary)}</td>
        </tr>`;
      });
      empRows += `<tr style="background:#e8f0f5;"><td colspan="3" style="padding:3px 6px;font-family:Inter,Arial,sans-serif;font-size:7.5px;font-weight:700;color:${dc.text};">Subtotal ${dc.label}</td><td style="padding:3px 6px;font-family:Inter,Arial,sans-serif;font-size:7.5px;font-weight:700;text-align:right;color:#2d4b5e;">${fmt(deptTotal)}</td></tr>`;
    });

    return `<div style="padding:14px;background:#fff;border:1px solid #e2e7ed;border-radius:8px;page-break-inside:avoid;">
      <div style="font-family:'Playfair Display',Georgia,serif;font-size:16px;color:#2d4b5e;font-weight:600;border-bottom:2px solid #e2e7ed;padding-bottom:8px;margin-bottom:12px;">${HOTEL_NAMES[code]}</div>
      <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
        ${[
          { l: 'Room Rev Budget', v: h.room_revenue_budget ? fmt(h.room_revenue_budget) : '—' },
          { l: 'S&M Payroll Budget', v: h.sm_payroll_budget ? fmt(h.sm_payroll_budget) : '—' },
          { l: 'Salary Allocated', v: fmt(allocated) },
          { l: 'Remaining Budget', v: remaining !== null ? fmt(remaining) : '—', color: remaining !== null ? (remaining < 0 ? '#dc2626' : '#16a34a') : '#6b7280' },
        ].map(s => `<div style="flex:1;min-width:80px;">
          <div style="font-family:Inter,Arial,sans-serif;font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;">${s.l}</div>
          <div style="font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;color:${s.color || '#1d1f1c'};margin-top:2px;">${s.v}</div>
        </div>`).join('')}
      </div>
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;font-family:Inter,Arial,sans-serif;font-size:8px;color:#6b7280;margin-bottom:4px;">
          <span>Budget Used</span><span style="font-weight:700;color:${barColor};">${pctUsed !== null ? pctUsed.toFixed(1) + '%' : '—'}</span>
        </div>
        <div style="background:#f0f4f7;border-radius:4px;height:8px;overflow:hidden;">
          <div style="width:${barWidth}%;background:${barColor};height:100%;border-radius:4px;"></div>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        ${empRows}
        <tr style="background:#2d4b5e;">
          <td colspan="3" style="padding:4px 6px;font-family:Inter,Arial,sans-serif;font-size:8px;font-weight:700;color:#fff;">HOTEL TOTAL</td>
          <td style="padding:4px 6px;font-family:Inter,Arial,sans-serif;font-size:8px;font-weight:700;text-align:right;color:#fff;">${fmt(allocated)}</td>
        </tr>
      </table>
    </div>`;
  });

  const left = hotelSections.slice(0, 3);
  const right = hotelSections.slice(3);

  return `<div class="page" style="display:flex;flex-direction:column;position:relative;">
    ${pageHeader('Hotel Budget Breakdown', 4)}
    <div class="inner-page" style="flex:1;overflow:hidden;padding:0.3in 0.5in 60px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div style="display:flex;flex-direction:column;gap:16px;">${left.join('')}</div>
        <div style="display:flex;flex-direction:column;gap:16px;">${right.join('')}</div>
      </div>
    </div>
    ${pageFooter(4)}
  </div>`;
}

// ─── PAGE 5: ORG CHART ────────────────────────────────────────────────────────
function buildOrgChart(employees) {
  const active = employees.filter(e => !e.suppressed);

  // Build children map
  const childrenMap = {};
  const activeIds = new Set(active.map(e => e.id));
  active.forEach(emp => {
    const mid = emp.manager_id && emp.manager_id.trim() && activeIds.has(emp.manager_id) ? emp.manager_id : 'root';
    if (!childrenMap[mid]) childrenMap[mid] = [];
    childrenMap[mid].push(emp);
  });

  const DEPT_DOT = { REVENUE: '#0d9488', ECOMM: '#f97316', SALES: '#9333ea' };

  function renderNode(emp, level = 0) {
    const children = childrenMap[emp.id] || [];
    const dot = DEPT_DOT[emp.department] || '#6b7280';
    const card = `<div style="display:inline-block;border:1px solid #e2e7ed;border-radius:4px;background:#fff;padding:7px 10px;position:relative;min-width:120px;max-width:160px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="position:absolute;top:6px;right:6px;width:6px;height:6px;border-radius:50%;background:${dot};"></div>
      <div style="font-family:Inter,Arial,sans-serif;font-size:8.5px;font-weight:600;color:#1d1f1c;padding-right:12px;">${emp.name}</div>
      <div style="font-family:Inter,Arial,sans-serif;font-size:7px;color:#6b7280;margin-top:2px;">${emp.title}</div>
      <div style="font-family:Inter,Arial,sans-serif;font-size:7.5px;color:#2d4b5e;font-weight:600;margin-top:3px;">${fmt(emp.annual_salary)}</div>
    </div>`;

    if (!children.length) return `<div style="display:flex;flex-direction:column;align-items:center;">${card}</div>`;

    return `<div style="display:flex;flex-direction:column;align-items:center;">
      ${card}
      <div style="width:1px;height:16px;background:#c8d8e4;"></div>
      <div style="display:flex;align-items:flex-start;gap:24px;position:relative;">
        ${children.length > 1 ? `<div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:calc(100% - 160px);height:1px;background:#c8d8e4;"></div>` : ''}
        ${children.map(c => `<div style="display:flex;flex-direction:column;align-items:center;">
          <div style="width:1px;height:16px;background:#c8d8e4;"></div>
          ${renderNode(c, level + 1)}
        </div>`).join('')}
      </div>
    </div>`;
  }

  const roots = active.filter(e => !e.manager_id || !e.manager_id.trim() || !activeIds.has(e.manager_id));

  return `<div class="page" style="display:flex;flex-direction:column;position:relative;width:100%;">
    ${pageHeader('Organization Chart', 5)}
    <div class="inner-page" style="flex:1;overflow:hidden;padding:0.2in 0.3in 60px;display:flex;align-items:center;justify-content:center;">
      <div style="transform:scale(0.75);transform-origin:top center;display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
        ${roots.map(r => renderNode(r)).join('')}
      </div>
    </div>
    ${pageFooter(5)}
  </div>`;
}

// ─── PAGE 6: ALERTS & ANALYTICS ──────────────────────────────────────────────
function buildAlertsAnalytics(employees, hotels) {
  const active = employees.filter(e => !e.suppressed && !e.exclude_from_table);
  const totalPayroll = active.reduce((s, e) => s + e.annual_salary, 0);

  // Allocation status
  const allocRows = active.map(e => {
    const total = Object.values(e.allocations || {}).reduce((s, v) => s + (v || 0), 0);
    const pct = Math.round(total * 100);
    const isExact = pct === 100;
    const isOver = pct > 100;
    const badge = isExact ? '✅ 100%' : isOver ? `⚠️ Over (${pct}%)` : `❌ Under (${pct}%)`;
    const badgeColor = isExact ? '#16a34a' : isOver ? '#d97706' : '#dc2626';
    const dc = DEPT_COLORS[e.department];
    return `<tr style="background:${active.indexOf(e)%2?'#f9f7f6':'#fff'};">
      <td style="padding:5px 8px;font-family:Inter,Arial,sans-serif;font-size:8.5px;font-weight:600;color:#1d1f1c;">${e.name}</td>
      <td style="padding:5px 8px;"><span style="background:${dc?.badge};color:${dc?.text};padding:1px 6px;border-radius:3px;font-family:Inter,Arial,sans-serif;font-size:7.5px;font-weight:700;">${dc?.label}</span></td>
      <td style="padding:5px 8px;font-family:Inter,Arial,sans-serif;font-size:8.5px;text-align:center;font-weight:700;color:${badgeColor};">${badge}</td>
    </tr>`;
  }).join('');

  // Budget alerts
  const propHotels = hotels.filter(h => PROPERTY_HOTELS.includes(h.short_code));
  const alertRows = propHotels.map(h => {
    const allocated = active.reduce((s, e) => s + ((e.allocations?.[h.short_code] || 0) * e.annual_salary), 0);
    const budget = h.sm_payroll_budget || 0;
    const over = budget > 0 && allocated > budget;
    if (!over) return '';
    const variance = allocated - budget;
    return `<tr style="background:#fff5f5;">
      <td style="padding:5px 8px;font-family:Inter,Arial,sans-serif;font-size:8.5px;font-weight:700;color:#1d1f1c;">${HOTEL_NAMES[h.short_code]}</td>
      <td style="padding:5px 8px;font-family:Inter,Arial,sans-serif;font-size:8.5px;color:#6b7280;">${fmt(budget)}</td>
      <td style="padding:5px 8px;font-family:Inter,Arial,sans-serif;font-size:8.5px;font-weight:600;color:#1d1f1c;">${fmt(allocated)}</td>
      <td style="padding:5px 8px;font-family:Inter,Arial,sans-serif;font-size:8.5px;font-weight:700;color:#dc2626;">+${fmt(variance)}</td>
    </tr>`;
  }).join('');

  // Dept analytics
  const depts = ['REVENUE', 'ECOMM', 'SALES'];
  const deptRows = depts.map(dept => {
    const emps = active.filter(e => e.department === dept);
    const total = emps.reduce((s, e) => s + e.annual_salary, 0);
    const avg = emps.length ? total / emps.length : 0;
    const pct = totalPayroll ? (total / totalPayroll * 100).toFixed(1) : '0';
    const dc = DEPT_COLORS[dept];
    return `<tr>
      <td style="padding:6px 8px;"><span style="background:${dc.badge};color:${dc.text};padding:2px 8px;border-radius:3px;font-family:Inter,Arial,sans-serif;font-size:7.5px;font-weight:700;">${dc.label}</span></td>
      <td style="padding:6px 8px;font-family:Inter,Arial,sans-serif;font-size:8.5px;text-align:center;">${emps.length}</td>
      <td style="padding:6px 8px;font-family:Inter,Arial,sans-serif;font-size:8.5px;text-align:right;font-weight:600;">${fmt(total)}</td>
      <td style="padding:6px 8px;font-family:Inter,Arial,sans-serif;font-size:8.5px;text-align:right;">${fmt(avg)}</td>
      <td style="padding:6px 8px;font-family:Inter,Arial,sans-serif;font-size:8.5px;text-align:right;font-weight:700;color:#2d4b5e;">${pct}%</td>
    </tr>`;
  }).join('');

  // Top earners
  const topEarners = [...active].sort((a, b) => b.annual_salary - a.annual_salary).slice(0, 5);
  const earnerRows = topEarners.map((e, i) => {
    const dc = DEPT_COLORS[e.department];
    return `<tr style="background:${i%2?'#f9f7f6':'#fff'};">
      <td style="padding:6px 8px;font-family:'Playfair Display',Georgia,serif;font-size:14px;color:#c0c4c8;font-weight:600;">${i+1}</td>
      <td style="padding:6px 8px;font-family:Inter,Arial,sans-serif;font-size:8.5px;font-weight:700;color:#1d1f1c;">${e.name}</td>
      <td style="padding:6px 8px;font-family:Inter,Arial,sans-serif;font-size:8px;color:#6b7280;">${e.title}</td>
      <td style="padding:6px 8px;"><span style="background:${dc?.badge};color:${dc?.text};padding:1px 6px;border-radius:3px;font-family:Inter,Arial,sans-serif;font-size:7.5px;font-weight:700;">${dc?.label}</span></td>
      <td style="padding:6px 8px;font-family:Inter,Arial,sans-serif;font-size:8.5px;font-weight:700;text-align:right;color:#2d4b5e;">${fmt(e.annual_salary)}</td>
    </tr>`;
  }).join('');

  const sectionTitle = (t) => `<div style="font-family:Inter,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#2d4b5e;margin:12px 0 6px;border-bottom:2px solid #e2e7ed;padding-bottom:4px;">${t}</div>`;

  return `<div class="page" style="display:flex;flex-direction:column;position:relative;">
    ${pageHeader('Allocation Alerts & Analytics', 6)}
    <div class="inner-page" style="flex:1;overflow:hidden;padding:0.3in 0.4in 60px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
        <div>
          ${sectionTitle('Allocation Status')}
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:#2d4b5e;">
              <th style="padding:6px 8px;color:rgba(255,255,255,0.85);font-size:8px;text-align:left;font-family:Inter,Arial,sans-serif;">Name</th>
              <th style="padding:6px 8px;color:rgba(255,255,255,0.85);font-size:8px;font-family:Inter,Arial,sans-serif;">Dept</th>
              <th style="padding:6px 8px;color:rgba(255,255,255,0.85);font-size:8px;text-align:center;font-family:Inter,Arial,sans-serif;">Status</th>
            </tr></thead>
            <tbody>${allocRows}</tbody>
          </table>

          ${alertRows ? `${sectionTitle('Budget Alerts')}
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:#dc2626;">
              <th style="padding:6px 8px;color:#fff;font-size:8px;text-align:left;font-family:Inter,Arial,sans-serif;">Hotel</th>
              <th style="padding:6px 8px;color:#fff;font-size:8px;text-align:right;font-family:Inter,Arial,sans-serif;">Budget</th>
              <th style="padding:6px 8px;color:#fff;font-size:8px;text-align:right;font-family:Inter,Arial,sans-serif;">Allocated</th>
              <th style="padding:6px 8px;color:#fff;font-size:8px;text-align:right;font-family:Inter,Arial,sans-serif;">Over By</th>
            </tr></thead>
            <tbody>${alertRows}</tbody>
          </table>` : `${sectionTitle('Budget Alerts')}<div style="font-family:Inter,Arial,sans-serif;font-size:9px;color:#16a34a;padding:12px 0;">✅ All hotels are within S&M payroll budget.</div>`}
        </div>

        <div>
          ${sectionTitle('Salary Analytics by Department')}
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:#2d4b5e;">
              ${['Department','Count','Total','Avg Salary','% of Payroll'].map(h =>
                `<th style="padding:6px 8px;color:rgba(255,255,255,0.85);font-size:8px;text-align:${h==='Department'?'left':'right'};font-family:Inter,Arial,sans-serif;">${h}</th>`
              ).join('')}
            </tr></thead>
            <tbody>${deptRows}</tbody>
          </table>

          ${sectionTitle('Top 5 Earners')}
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:#2d4b5e;">
              <th style="padding:6px 8px;color:rgba(255,255,255,0.85);font-size:8px;font-family:Inter,Arial,sans-serif;">#</th>
              ${['Name','Title','Dept','Salary'].map(h =>
                `<th style="padding:6px 8px;color:rgba(255,255,255,0.85);font-size:8px;text-align:${h==='Salary'?'right':'left'};font-family:Inter,Arial,sans-serif;">${h}</th>`
              ).join('')}
            </tr></thead>
            <tbody>${earnerRows}</tbody>
          </table>
        </div>
      </div>
    </div>
    ${pageFooter(6)}
  </div>`;
}

// ─── MAIN EXPORT FUNCTION ─────────────────────────────────────────────────────
export function generateExecPDF(employees, hotels) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Rebel Hotel Co. — Topline Salary Executive Report 2026</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', Arial, sans-serif; color: #1d1f1c; background: #fff; }
  @page { size: letter portrait; margin: 0; }
  .page { width: 8.5in; min-height: 11in; page-break-after: always; position: relative; overflow: hidden; }
  .page:last-child { page-break-after: avoid; }
  .inner-page { padding: 0.5in 0.75in 0.75in; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { page-break-after: always; }
    .no-break { page-break-inside: avoid; }
  }
</style>
</head>
<body>
${buildCover(employees, hotels, dateStr)}
${buildExecSummary(employees, hotels)}
${buildSalaryTable(employees, hotels)}
${buildHotelBreakdown(employees, hotels)}
${buildOrgChart(employees)}
${buildAlertsAnalytics(employees, hotels)}
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 800);
}