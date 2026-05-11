import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

const BRAND_DARK   = [45, 55, 72];
const BRAND_MID    = [74, 85, 104];
const WHITE        = [255, 255, 255];
const LIGHT_GRAY   = [248, 250, 252];
const BORDER_GRAY  = [226, 232, 240];
const BRAND_ACCENT = [200, 16, 46];

const DEPT_COLORS = {
  REVENUE: [20, 184, 166],
  ECOMM:   [249, 115, 22],
  SALES:   [139, 92, 246],
};

const HOTEL_ORDER = ['AURA', 'H5A', 'INK48', 'LIFE', 'RENWICK', 'SMYTH', 'CORP'];

function sanitize(str) {
  if (!str) return '';
  return str
    .replace(/\uFEFF/g, '').replace(/\uFFFD/g, '').replace(/[\u0080-\u009F]/g, '')
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013/g, '-').replace(/\u2014/g, '--').replace(/\u2026/g, '...')
    .trim();
}

function fmt(n) {
  if (!n && n !== 0) return '$0';
  return '$' + Math.round(n).toLocaleString('en-US');
}

function pct(n) {
  return (n * 100).toFixed(1) + '%';
}

function drawRect(doc, x, y, w, h, r, g, b) {
  doc.setFillColor(r, g, b);
  doc.rect(x, y, w, h, 'F');
}

function checkPage(doc, yPos, needed, pageH, margin) {
  if (yPos + needed > pageH - margin - 12) {
    doc.addPage();
    return margin + 10;
  }
  return yPos;
}

function drawPageHeader(doc, title, subtitle, pageW, margin, accentColor) {
  drawRect(doc, 0, 0, pageW, 28, ...BRAND_DARK);
  drawRect(doc, 0, 0, pageW, 3, ...(accentColor || BRAND_ACCENT));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.text(sanitize(title), margin, 18);
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(160, 170, 190);
    doc.text(sanitize(subtitle), margin, 25);
  }
}

function drawSectionLabel(doc, text, yPos, pageW, r, g, b) {
  drawRect(doc, 0, yPos, pageW, 10, r, g, b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(sanitize(text).toUpperCase(), 15, yPos + 6.5);
  return yPos + 10;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [employees, hotels] = await Promise.all([
      base44.entities.Employee.list(),
      base44.entities.Hotel.list(),
    ]);

    const sortedHotels = [...hotels].sort((a, b) => HOTEL_ORDER.indexOf(a.short_code) - HOTEL_ORDER.indexOf(b.short_code));
    const propertyHotels = sortedHotels.filter(h => h.short_code !== 'CORP');
    const activeEmployees = employees.filter(e => !e.suppressed && !e.exclude_from_table);

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentW = pageW - margin * 2;

    // ─── COVER PAGE ───
    drawRect(doc, 0, 0, pageW, pageH, ...BRAND_DARK);
    drawRect(doc, 0, 0, pageW, 4, ...BRAND_ACCENT);

    // Logo
    try {
      const logoUrl = 'https://media.base44.com/images/public/69cc85b631fba1e402b42659/cbde62a6d_RBLMark-RH_Blue.png';
      const logoResp = await fetch(logoUrl);
      const logoBuf = await logoResp.arrayBuffer();
      const bytes = new Uint8Array(logoBuf);
      const { PNG } = await import('npm:pngjs@7.0.0');
      const png = PNG.sync.read(Buffer.from(bytes));
      const { width, height, data } = png;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 10) {
          data[i] = 255 - data[i];
          data[i + 1] = 255 - data[i + 1];
          data[i + 2] = 255 - data[i + 2];
        }
      }
      const outPng = new PNG({ width, height });
      outPng.data = data;
      const outBuf = PNG.sync.write(outPng);
      const outBytes = new Uint8Array(outBuf);
      let logoBase64 = '';
      const chunkSize = 8192;
      for (let i = 0; i < outBytes.length; i += chunkSize) {
        logoBase64 += String.fromCharCode(...outBytes.subarray(i, i + chunkSize));
      }
      logoBase64 = btoa(logoBase64);
      doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', margin, 30, 28, 28);
    } catch (_e) { /* skip */ }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(...WHITE);
    doc.text('Rebel Hotel Co.', margin, 72);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 190, 210);
    doc.text('Sales & Marketing Payroll', margin, 81);

    drawRect(doc, margin, 88, 50, 1, ...BRAND_ACCENT);

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text('Executive Summary Report', margin, 100);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 170, 200);
    doc.text(`2026 Headcount & Allocation Overview`, margin, 110);

    // Stats box
    const totalPayroll = activeEmployees.reduce((sum, emp) =>
      sum + propertyHotels.reduce((s, h) => s + ((emp.allocations?.[h.short_code] || 0) * emp.annual_salary), 0), 0);
    const totalSmBudget = propertyHotels.reduce((s, h) => s + (h.sm_payroll_budget || 0), 0);
    const budgetDiff = totalSmBudget > 0 ? totalPayroll - totalSmBudget : null;
    const budgetPct = totalSmBudget > 0 ? (totalPayroll / totalSmBudget) * 100 : null;

    drawRect(doc, margin, 124, contentW, 48, 30, 42, 60);
    const cols = [
      { label: 'ACTIVE EMPLOYEES', value: String(activeEmployees.length) },
      { label: 'TOTAL PAYROLL',    value: fmt(totalPayroll) },
      { label: 'S&M BUDGET',       value: fmt(totalSmBudget) },
      { label: '% OF BUDGET',      value: budgetPct != null ? budgetPct.toFixed(1) + '%' : '-' },
    ];
    const colW = contentW / cols.length;
    cols.forEach((c, i) => {
      const cx = margin + colW * i + colW / 2;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(140, 160, 190);
      doc.text(c.label, cx, 134, { align: 'center' });
      doc.setFontSize(budgetPct != null && i > 0 ? 16 : 22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...WHITE);
      doc.text(c.value, cx, 152, { align: 'center' });
    });

    // Budget status badge
    const isOver = budgetDiff > 0;
    const badgeColor = isOver ? [160, 50, 50] : [5, 120, 85];
    const badgeLabel = isOver
      ? `OVER BUDGET  +${fmt(budgetDiff)}`
      : `WITHIN BUDGET  ${fmt(budgetDiff)}`;
    drawRect(doc, margin, 180, 80, 13, ...badgeColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...WHITE);
    doc.text(sanitize(badgeLabel), margin + 40, 188.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 115, 140);
    doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, pageH - 18);
    doc.text('CONFIDENTIAL', pageW - margin, pageH - 18, { align: 'right' });

    // ─── PAGE 2: EXECUTIVE OVERVIEW ───
    doc.addPage();
    drawPageHeader(doc, 'Executive Overview', '2026 S&M Payroll Summary', pageW, margin);
    let y = 38;

    // Department score cards
    const depts = ['REVENUE', 'ECOMM', 'SALES'];
    const deptLabels = { REVENUE: 'Revenue', ECOMM: 'E-Commerce', SALES: 'Sales & Marketing' };
    const cardW = (contentW - 6) / 3;
    depts.forEach((dept, i) => {
      const emps = activeEmployees.filter(e => e.department === dept);
      const deptPayroll = emps.reduce((sum, emp) =>
        sum + propertyHotels.reduce((s, h) => s + ((emp.allocations?.[h.short_code] || 0) * emp.annual_salary), 0), 0);
      const cx = margin + i * (cardW + 3);
      const col = DEPT_COLORS[dept];

      drawRect(doc, cx, y, cardW, 36, ...LIGHT_GRAY);
      drawRect(doc, cx, y, cardW, 3, ...col);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...BRAND_MID);
      doc.text(deptLabels[dept].toUpperCase(), cx + cardW / 2, y + 10, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(...BRAND_DARK);
      doc.text(`${emps.length} employees`, cx + cardW / 2, y + 17, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(...col);
      doc.text(fmt(deptPayroll), cx + cardW / 2, y + 27, { align: 'center' });
      doc.setFontSize(6.5);
      doc.setTextColor(...BRAND_MID);
      doc.text('ALLOCATED PAYROLL', cx + cardW / 2, y + 33, { align: 'center' });
    });
    y += 42;

    // Overall payroll bar
    drawRect(doc, margin, y, contentW, 14, ...LIGHT_GRAY);
    const barFill = totalSmBudget > 0 ? Math.min((totalPayroll / totalSmBudget) * contentW, contentW) : 0;
    const barColor = isOver ? [160, 50, 50] : [5, 150, 105];
    drawRect(doc, margin, y, barFill, 14, ...barColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text(
      `TOTAL ALLOCATED PAYROLL: ${fmt(totalPayroll)}  /  S&M BUDGET: ${fmt(totalSmBudget)}  -  ${budgetPct != null ? budgetPct.toFixed(1) + '% of Budget' : ''}`,
      margin + 4, y + 9
    );
    y += 20;

    // Hotel breakdown table
    y = checkPage(doc, y, 14 + propertyHotels.length * 8 + 10, pageH, margin);
    y = drawSectionLabel(doc, 'Breakdown by Property', y, pageW, ...BRAND_MID);
    y += 4;

    drawRect(doc, margin, y, contentW, 7, ...BORDER_GRAY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND_DARK);
    doc.text('Property',           margin + 3,                y + 5);
    doc.text('Headcount',          margin + contentW * 0.35,  y + 5, { align: 'center' });
    doc.text('Allocated Payroll',  margin + contentW * 0.55,  y + 5, { align: 'center' });
    doc.text('S&M Budget',         margin + contentW * 0.72,  y + 5, { align: 'center' });
    doc.text('Variance',           margin + contentW * 0.87,  y + 5, { align: 'center' });
    doc.text('% of Budget',        margin + contentW,         y + 5, { align: 'right' });
    y += 7;

    propertyHotels.forEach((hotel, idx) => {
      const allocated = activeEmployees.reduce((s, e) => s + ((e.allocations?.[hotel.short_code] || 0) * e.annual_salary), 0);
      const budget = hotel.sm_payroll_budget || 0;
      const variance = budget > 0 ? allocated - budget : null;
      const budgetPctH = budget > 0 ? (allocated / budget) * 100 : null;
      const headcount = activeEmployees.filter(e => (e.allocations?.[hotel.short_code] || 0) > 0).length;
      const varColor = variance > 0 ? [160, 50, 50] : [5, 120, 85];

      if (idx % 2 === 0) drawRect(doc, margin, y, contentW, 7, ...LIGHT_GRAY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...BRAND_DARK);
      doc.text(sanitize(hotel.name),          margin + 3,                y + 5);
      doc.text(String(headcount),             margin + contentW * 0.35,  y + 5, { align: 'center' });
      doc.text(fmt(allocated),                margin + contentW * 0.55,  y + 5, { align: 'center' });
      doc.text(budget > 0 ? fmt(budget) : '—', margin + contentW * 0.72, y + 5, { align: 'center' });

      if (variance !== null) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...varColor);
        doc.text((variance > 0 ? '+' : '') + fmt(variance), margin + contentW * 0.87, y + 5, { align: 'center' });
        doc.text(budgetPctH.toFixed(1) + '%', margin + contentW, y + 5, { align: 'right' });
      } else {
        doc.setTextColor(...BRAND_MID);
        doc.text('—', margin + contentW * 0.87, y + 5, { align: 'center' });
        doc.text('—', margin + contentW,        y + 5, { align: 'right' });
      }
      y += 7;
    });
    y += 8;

    // ─── PAGE 3: DEPARTMENT DEEP DIVES ───
    depts.forEach((dept) => {
      const deptEmps = activeEmployees.filter(e => e.department === dept).sort((a, b) => b.annual_salary - a.annual_salary);
      if (deptEmps.length === 0) return;

      doc.addPage();
      const col = DEPT_COLORS[dept];
      const deptPayroll = deptEmps.reduce((sum, emp) =>
        sum + propertyHotels.reduce((s, h) => s + ((emp.allocations?.[h.short_code] || 0) * emp.annual_salary), 0), 0);

      drawPageHeader(doc, deptLabels[dept], `${deptEmps.length} employees  ·  ${fmt(deptPayroll)} allocated payroll`, pageW, margin, col);
      y = 38;

      // Hotel allocation heatmap for this dept
      y = drawSectionLabel(doc, 'Hotel Allocation Summary', y, pageW, ...col);
      y += 4;

      drawRect(doc, margin, y, contentW, 7, ...BORDER_GRAY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...BRAND_DARK);
      doc.text('Hotel', margin + 3, y + 5);
      doc.text('Headcount', margin + contentW * 0.38, y + 5, { align: 'center' });
      doc.text('Allocated $', margin + contentW * 0.6,  y + 5, { align: 'center' });
      doc.text('% of Total', margin + contentW,          y + 5, { align: 'right' });
      y += 7;

      sortedHotels.forEach((hotel, idx) => {
        const allocated = deptEmps.reduce((s, e) => s + ((e.allocations?.[hotel.short_code] || 0) * e.annual_salary), 0);
        if (allocated === 0) return;
        const hc = deptEmps.filter(e => (e.allocations?.[hotel.short_code] || 0) > 0).length;
        const share = deptPayroll > 0 ? (allocated / deptPayroll) * 100 : 0;

        if (idx % 2 === 0) drawRect(doc, margin, y, contentW, 7, ...LIGHT_GRAY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...BRAND_DARK);
        doc.text(sanitize(hotel.name),    margin + 3,                y + 5);
        doc.text(String(hc),              margin + contentW * 0.38,  y + 5, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...col);
        doc.text(fmt(allocated),          margin + contentW * 0.6,   y + 5, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...BRAND_MID);
        doc.text(share.toFixed(1) + '%',  margin + contentW,          y + 5, { align: 'right' });
        y += 7;
      });
      y += 8;

      // Employee roster
      y = checkPage(doc, y, 14 + deptEmps.length * 8 + 10, pageH, margin);
      y = drawSectionLabel(doc, `Employee Roster (${deptEmps.length})`, y, pageW, ...BRAND_MID);
      y += 4;

      drawRect(doc, margin, y, contentW, 7, ...BORDER_GRAY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...BRAND_DARK);
      doc.text('Name',            margin + 3,               y + 5);
      doc.text('Title',           margin + contentW * 0.3,  y + 5);
      doc.text('Salary',          margin + contentW * 0.65, y + 5, { align: 'center' });
      doc.text('Total Alloc',     margin + contentW * 0.8,  y + 5, { align: 'center' });
      doc.text('Alloc Payroll',   margin + contentW,         y + 5, { align: 'right' });
      y += 7;

      deptEmps.forEach((emp, idx) => {
        const allocPayroll = propertyHotels.reduce((s, h) => s + ((emp.allocations?.[h.short_code] || 0) * emp.annual_salary), 0);
        const totalAlloc = Object.values(emp.allocations || {}).reduce((s, v) => s + v, 0);
        const allocColor = Math.abs(totalAlloc - 1) < 0.01 ? [5, 120, 85] : totalAlloc > 1 ? [160, 50, 50] : [245, 158, 11];

        if (idx % 2 === 0) drawRect(doc, margin, y, contentW, 7, ...LIGHT_GRAY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...BRAND_DARK);
        doc.text(sanitize(emp.name),             margin + 3,               y + 5);
        const titleLines = doc.splitTextToSize(sanitize(emp.title), contentW * 0.3);
        doc.text(titleLines[0],                  margin + contentW * 0.3,  y + 5);
        doc.text(fmt(emp.annual_salary),         margin + contentW * 0.65, y + 5, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...allocColor);
        doc.text(pct(totalAlloc),                margin + contentW * 0.8,  y + 5, { align: 'center' });
        doc.setTextColor(...col);
        doc.text(fmt(allocPayroll),              margin + contentW,         y + 5, { align: 'right' });
        y += 7;
      });
      y += 8;
    });

    // ─── PAGE NUMBERS ───
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 2; p <= totalPages; p++) {
      doc.setPage(p);
      drawRect(doc, 0, pageH - 10, pageW, 10, ...BRAND_DARK);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(140, 155, 180);
      doc.text('Rebel Hotel Co.  |  S&M Payroll Executive Summary  |  CONFIDENTIAL', margin, pageH - 3.5);
      doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 3.5, { align: 'right' });
    }

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=sm-payroll-executive-summary-${new Date().toISOString().slice(0, 10)}.pdf`,
      },
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});