import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

// ── Palette (matches reference PDF) ──────────────────────────────────────────
const NAVY       = [24, 37, 63];       // dark navy background
const NAVY_MID   = [38, 55, 90];       // slightly lighter navy
const NAVY_LIGHT = [55, 75, 115];      // sidebar / accent navy
const WHITE      = [255, 255, 255];
const OFF_WHITE  = [248, 249, 252];
const LIGHT_GRAY = [237, 241, 248];
const MID_GRAY   = [160, 172, 195];
const DARK_TEXT  = [24, 37, 63];
const RED_ACCENT = [200, 16, 46];      // Rebel red

const STATUS_GOOD = [22, 160, 100];   // green – within budget / acceptable
const STATUS_WARN = [200, 140, 30];   // amber – warning
const STATUS_BAD  = [192, 50, 50];    // red – over budget

const DEPT_COLORS = {
  REVENUE: [20, 160, 150],
  ECOMM:   [220, 100, 30],
  SALES:   [120, 80, 200],
};
const DEPT_LABELS = { REVENUE: 'Revenue', ECOMM: 'E-Commerce', SALES: 'Sales & Marketing' };

const HOTEL_ORDER = ['AURA', 'H5A', 'INK48', 'LIFE', 'RENWICK', 'SMYTH', 'CORP'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function sanitize(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\uFEFF|\uFFFD/g, '')
    .replace(/[\u0080-\u009F]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013/g, '-').replace(/\u2014/g, '--')
    .replace(/\u2026/g, '...')
    .trim();
}

function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const abs = Math.abs(Math.round(n));
  return (n < 0 ? '-$' : '$') + abs.toLocaleString('en-US');
}

function fmtShort(n) {
  if (!n && n !== 0) return '—';
  if (Math.abs(n) >= 1_000_000) return (n < 0 ? '-' : '') + '$' + (Math.abs(n) / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n < 0 ? '-' : '') + '$' + (Math.abs(n) / 1_000).toFixed(0) + 'K';
  return fmt(n);
}

function fillRect(doc, x, y, w, h, col) {
  doc.setFillColor(...col);
  doc.rect(x, y, w, h, 'F');
}

function drawLine(doc, x1, y1, x2, y2, col, lw = 0.3) {
  doc.setDrawColor(...col);
  doc.setLineWidth(lw);
  doc.line(x1, y1, x2, y2);
}

// Draw the consistent page footer
function drawFooter(doc, pageW, pageH, margin) {
  fillRect(doc, 0, pageH - 9, pageW, 9, NAVY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...MID_GRAY);
  doc.text('Rebel Hotel Company  —  S&M Payroll Executive Summary  —  Confidential', margin, pageH - 3.2);
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, pageW - margin, pageH - 3.2, { align: 'right' });
}

// Draw the interior page header: navy top bar + section name
function drawPageHeader(doc, sectionLabel, pageTitle, pageW, margin, accentCol) {
  // Top navy bar
  fillRect(doc, 0, 0, pageW, 22, NAVY);
  // Accent left stripe
  fillRect(doc, 0, 0, 4, 22, accentCol || RED_ACCENT);
  // Section label (small caps style)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...MID_GRAY);
  doc.text(sanitize(sectionLabel).toUpperCase(), 8, 9);
  // Page title
  doc.setFontSize(13);
  doc.setTextColor(...WHITE);
  doc.text(sanitize(pageTitle), 8, 18);
}

// Draws a full-width section divider band
function drawSectionBand(doc, y, label, pageW, margin, col) {
  fillRect(doc, 0, y, pageW, 8, col || NAVY_LIGHT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  doc.text(sanitize(label).toUpperCase(), margin, y + 5.5);
  return y + 8;
}

// Draw a status pill badge
function drawBadge(doc, x, y, label, col) {
  const w = 22;
  const h = 5.5;
  fillRect(doc, x - w / 2, y - 4, w, h, col);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...WHITE);
  doc.text(sanitize(label).toUpperCase(), x, y - 0.5, { align: 'center' });
}

function checkNewPage(doc, y, needed, pageH, margin, drawHeaderFn) {
  if (y + needed > pageH - 14) {
    doc.addPage();
    if (drawHeaderFn) drawHeaderFn(doc);
    return margin + 28;
  }
  return y;
}

// ── Main export function ──────────────────────────────────────────────────────
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
    const margin = 14;
    const contentW = pageW - margin * 2;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PAGE 1 — COVER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    fillRect(doc, 0, 0, pageW, pageH, NAVY);
    // Red accent top bar
    fillRect(doc, 0, 0, pageW, 3.5, RED_ACCENT);

    // Try to embed logo
    try {
      const logoUrl = 'https://media.base44.com/images/public/69cc85b631fba1e402b42659/cbde62a6d_RBLMark-RH_Blue.png';
      const logoResp = await fetch(logoUrl);
      const logoBuf = await logoResp.arrayBuffer();
      const bytes = new Uint8Array(logoBuf);
      const { PNG } = await import('npm:pngjs@7.0.0');
      const png = PNG.sync.read(Buffer.from(bytes));
      const { width, height, data } = png;
      // Invert to white-on-transparent for dark bg
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 10) {
          data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
        }
      }
      const outPng = new PNG({ width, height });
      outPng.data = data;
      const outBuf = PNG.sync.write(outPng);
      const outBytes = new Uint8Array(outBuf);
      let b64 = '';
      const chunk = 8192;
      for (let i = 0; i < outBytes.length; i += chunk) {
        b64 += String.fromCharCode(...outBytes.subarray(i, i + chunk));
      }
      doc.addImage(`data:image/png;base64,${btoa(b64)}`, 'PNG', margin, 12, 22, 22);
    } catch (_e) { /* skip logo on error */ }

    // "S&M Payroll" label (small, above title — like "Leadership Feedback Survey")
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MID_GRAY);
    doc.text('S&M Payroll', margin, 46);

    // Main title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(...WHITE);
    doc.text('Executive Summary', margin, 60);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 195, 220);
    doc.text('Rebel Hotel Company  ·  2026', margin, 69);

    // Thin red divider
    drawLine(doc, margin, 74, margin + 60, 74, RED_ACCENT, 0.8);

    // ── 3 Key Stats (like reference PDF: RESPONSES / DEPT SCORE / COMPLETION) ──
    const totalPayroll = activeEmployees.reduce((sum, emp) =>
      sum + propertyHotels.reduce((s, h) => s + ((emp.allocations?.[h.short_code] || 0) * emp.annual_salary), 0), 0);
    const totalSmBudget = propertyHotels.reduce((s, h) => s + (h.sm_payroll_budget || 0), 0);
    const budgetDiff = totalSmBudget > 0 ? totalPayroll - totalSmBudget : null;
    const budgetPctVal = totalSmBudget > 0 ? (totalPayroll / totalSmBudget) * 100 : null;
    const isOver = budgetDiff !== null && budgetDiff > 0;

    const stats = [
      { big: String(activeEmployees.length), label: 'EMPLOYEES' },
      { big: fmtShort(totalPayroll), label: 'TOTAL PAYROLL' },
      { big: budgetPctVal != null ? budgetPctVal.toFixed(0) + '%' : '—', label: 'OF S&M BUDGET' },
    ];

    const statBlockY = 84;
    const statBlockH = 40;
    const statW = contentW / stats.length;

    fillRect(doc, margin, statBlockY, contentW, statBlockH, NAVY_MID);

    stats.forEach((s, i) => {
      const x = margin + i * statW + statW / 2;
      // Vertical divider between stats
      if (i > 0) drawLine(doc, margin + i * statW, statBlockY + 6, margin + i * statW, statBlockY + statBlockH - 6, NAVY_LIGHT, 0.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(...WHITE);
      doc.text(sanitize(s.big), x, statBlockY + 22, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...MID_GRAY);
      doc.text(s.label, x, statBlockY + 30, { align: 'center' });
    });

    // Budget status badge (like "Warning" / "Acceptable" in reference)
    const badgeY = statBlockY + statBlockH + 8;
    const badgeCol = isOver ? STATUS_BAD : STATUS_GOOD;
    const badgeText = isOver
      ? `OVER BUDGET    +${fmt(budgetDiff)}`
      : `WITHIN BUDGET    ${fmt(Math.abs(budgetDiff || 0))} remaining`;
    fillRect(doc, margin, badgeY, contentW, 10, badgeCol);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.text(sanitize(badgeText), pageW / 2, badgeY + 6.8, { align: 'center' });

    // Dept summary pills (Revenue / E-Commerce / Sales & Marketing)
    const depts = ['REVENUE', 'ECOMM', 'SALES'];
    const pillY = badgeY + 18;
    const pillW = (contentW - 6) / 3;

    depts.forEach((dept, i) => {
      const emps = activeEmployees.filter(e => e.department === dept);
      const dp = emps.reduce((sum, emp) =>
        sum + propertyHotels.reduce((s, h) => s + ((emp.allocations?.[h.short_code] || 0) * emp.annual_salary), 0), 0);
      const col = DEPT_COLORS[dept];
      const px = margin + i * (pillW + 3);

      fillRect(doc, px, pillY, pillW, 30, NAVY_MID);
      fillRect(doc, px, pillY, pillW, 2.5, col);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...col);
      doc.text(DEPT_LABELS[dept].toUpperCase(), px + pillW / 2, pillY + 9, { align: 'center' });

      doc.setFontSize(7.5);
      doc.setTextColor(...WHITE);
      doc.text(`${emps.length} employees`, px + pillW / 2, pillY + 16, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...col);
      doc.text(fmtShort(dp), px + pillW / 2, pillY + 25, { align: 'center' });
    });

    // Confidential footer on cover
    const confY = pageH - 20;
    drawLine(doc, margin, confY, pageW - margin, confY, NAVY_LIGHT, 0.4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MID_GRAY);
    doc.text('CONFIDENTIAL — AUTHORIZED PERSONNEL ONLY', pageW / 2, confY + 7, { align: 'center' });
    doc.setFontSize(6.5);
    doc.text(
      `Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
      pageW / 2, confY + 13, { align: 'center' }
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PAGE 2 — PROPERTY BENCHMARK  (like "Department Benchmark" page)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    doc.addPage();
    drawPageHeader(doc, 'S&M Payroll', 'Property Benchmark', pageW, margin, RED_ACCENT);
    drawFooter(doc, pageW, pageH, margin);

    let y = 30;

    // Big score display (like "3.41 / 5.00" in reference)
    fillRect(doc, margin, y, contentW, 28, NAVY_MID);
    // Left accent stripe inside the block
    fillRect(doc, margin, y, 4, 28, isOver ? RED_ACCENT : STATUS_GOOD);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(...WHITE);
    doc.text(fmt(totalPayroll), margin + 10, y + 16);

    doc.setFontSize(10);
    doc.setTextColor(...MID_GRAY);
    doc.text('TOTAL ALLOCATED PAYROLL  (Property Hotels)', margin + 10, y + 23);

    // Status badge on right side of block
    const statusText = isOver ? 'Over Budget' : 'Within Budget';
    const statusCol = isOver ? STATUS_BAD : STATUS_GOOD;
    fillRect(doc, pageW - margin - 38, y + 8, 38, 12, statusCol);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...WHITE);
    doc.text(statusText, pageW - margin - 19, y + 16, { align: 'center' });
    y += 34;

    // Score vs budget comparison table (like "SCORE VS. ALL DEPARTMENTS" table)
    y = drawSectionBand(doc, y, 'Budget vs. Allocated Payroll — By Property', pageW, margin, NAVY_LIGHT);
    y += 3;

    // Table header
    fillRect(doc, margin, y, contentW, 7.5, LIGHT_GRAY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...DARK_TEXT);
    doc.text('Property',          margin + 3,                y + 5.2);
    doc.text('Allocated',         margin + contentW * 0.44,  y + 5.2, { align: 'center' });
    doc.text('S&M Budget',        margin + contentW * 0.61,  y + 5.2, { align: 'center' });
    doc.text('Variance',          margin + contentW * 0.78,  y + 5.2, { align: 'center' });
    doc.text('Status',            margin + contentW,          y + 5.2, { align: 'right' });
    y += 7.5;
    drawLine(doc, margin, y, margin + contentW, y, LIGHT_GRAY, 0.4);

    propertyHotels.forEach((hotel, idx) => {
      const allocated = activeEmployees.reduce((s, e) => s + ((e.allocations?.[hotel.short_code] || 0) * e.annual_salary), 0);
      const budget = hotel.sm_payroll_budget || 0;
      const variance = budget > 0 ? allocated - budget : null;
      const overHotel = variance !== null && variance > 0;
      const rowCol = overHotel ? STATUS_BAD : STATUS_GOOD;
      const statusLabel = budget > 0 ? (overHotel ? 'Over Budget' : 'Within Budget') : 'No Budget';

      if (idx % 2 === 0) fillRect(doc, margin, y, contentW, 7.5, OFF_WHITE);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...DARK_TEXT);
      doc.text(sanitize(hotel.name),         margin + 3,               y + 5.2);
      doc.text(fmt(allocated),               margin + contentW * 0.44, y + 5.2, { align: 'center' });
      doc.text(budget > 0 ? fmt(budget) : '—', margin + contentW * 0.61, y + 5.2, { align: 'center' });

      if (variance !== null) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...rowCol);
        doc.text((variance > 0 ? '+' : '') + fmt(variance), margin + contentW * 0.78, y + 5.2, { align: 'center' });
      } else {
        doc.setTextColor(...MID_GRAY);
        doc.text('—', margin + contentW * 0.78, y + 5.2, { align: 'center' });
      }

      // Status pill (right aligned, like reference)
      const pillX = margin + contentW - 28;
      fillRect(doc, pillX, y + 1, 28, 5.5, budget === 0 ? NAVY_MID : rowCol);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(...WHITE);
      doc.text(statusLabel.toUpperCase(), pillX + 14, y + 5, { align: 'center' });

      y += 7.5;
      drawLine(doc, margin, y, margin + contentW, y, LIGHT_GRAY, 0.2);
    });

    // Totals row
    y += 1;
    fillRect(doc, margin, y, contentW, 8, NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...WHITE);
    doc.text('Overall Total',    margin + 3,               y + 5.5);
    doc.text(fmt(totalPayroll),  margin + contentW * 0.44, y + 5.5, { align: 'center' });
    doc.text(totalSmBudget > 0 ? fmt(totalSmBudget) : '—', margin + contentW * 0.61, y + 5.5, { align: 'center' });
    const totalVarCol = isOver ? [255, 140, 140] : [100, 220, 160];
    doc.setTextColor(...totalVarCol);
    doc.text((budgetDiff > 0 ? '+' : '') + fmt(budgetDiff || 0), margin + contentW * 0.78, y + 5.5, { align: 'center' });
    y += 14;

    // % of budget bars section
    y = checkNewPage(doc, y, 12 + propertyHotels.length * 10 + 10, pageH, margin, null);
    y = drawSectionBand(doc, y, 'Allocated Payroll as % of S&M Budget', pageW, margin, NAVY_LIGHT);
    y += 4;

    const barZoneW = contentW * 0.55;
    const labelW   = contentW * 0.28;

    propertyHotels.forEach((hotel) => {
      const allocated = activeEmployees.reduce((s, e) => s + ((e.allocations?.[hotel.short_code] || 0) * e.annual_salary), 0);
      const budget = hotel.sm_payroll_budget || 0;
      if (budget === 0) return;
      const ratio = Math.min(allocated / budget, 1.5);
      const overH = allocated > budget;
      const barCol = overH ? STATUS_BAD : ratio > 0.9 ? STATUS_WARN : STATUS_GOOD;
      const barW = barZoneW * Math.min(ratio, 1);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...DARK_TEXT);
      doc.text(sanitize(hotel.name), margin, y + 4.5);

      fillRect(doc, margin + labelW, y, barZoneW, 5, LIGHT_GRAY);
      fillRect(doc, margin + labelW, y, barW, 5, barCol);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...DARK_TEXT);
      doc.text(`${(ratio * 100).toFixed(1)}%`, margin + labelW + barZoneW + 3, y + 4.5);

      y += 9;
    });
    y += 6;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PAGES 3+ — DEPARTMENT DETAIL  (like "DEPARTMENT DETAIL" pages)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    depts.forEach((dept) => {
      const deptEmps = activeEmployees
        .filter(e => e.department === dept)
        .sort((a, b) => b.annual_salary - a.annual_salary);
      if (deptEmps.length === 0) return;

      const col = DEPT_COLORS[dept];
      const deptPayroll = deptEmps.reduce((sum, emp) =>
        sum + propertyHotels.reduce((s, h) => s + ((emp.allocations?.[h.short_code] || 0) * emp.annual_salary), 0), 0);
      const deptBudget = propertyHotels.reduce((s, h) => s + (h.sm_payroll_budget || 0), 0);
      const deptOver = deptPayroll > deptBudget;

      doc.addPage();
      drawPageHeader(doc, 'Department Detail', DEPT_LABELS[dept], pageW, margin, col);
      drawFooter(doc, pageW, pageH, margin);

      y = 30;

      // Dept summary block (like the score/status block)
      fillRect(doc, margin, y, contentW, 24, NAVY_MID);
      fillRect(doc, margin, y, 4, 24, col);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(...WHITE);
      doc.text(fmt(deptPayroll), margin + 10, y + 13);

      doc.setFontSize(8.5);
      doc.setTextColor(...MID_GRAY);
      doc.text(`${DEPT_LABELS[dept].toUpperCase()} ALLOCATED PAYROLL  ·  ${deptEmps.length} employees`, margin + 10, y + 20);

      y += 30;

      // Hotel allocation breakdown for this dept
      y = drawSectionBand(doc, y, `Hotel Allocation — ${DEPT_LABELS[dept]}`, pageW, margin, col);
      y += 3;

      // Table header
      fillRect(doc, margin, y, contentW, 7.5, LIGHT_GRAY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...DARK_TEXT);
      doc.text('Hotel',            margin + 3,               y + 5.2);
      doc.text('Headcount',        margin + contentW * 0.38, y + 5.2, { align: 'center' });
      doc.text('Allocated',        margin + contentW * 0.58, y + 5.2, { align: 'center' });
      doc.text('% of Dept Total',  margin + contentW * 0.78, y + 5.2, { align: 'center' });
      doc.text('% of Rooms Rev',   margin + contentW,         y + 5.2, { align: 'right' });
      y += 7.5;

      sortedHotels.forEach((hotel, idx) => {
        const allocated = deptEmps.reduce((s, e) => s + ((e.allocations?.[hotel.short_code] || 0) * e.annual_salary), 0);
        if (allocated === 0) return;
        const hc = deptEmps.filter(e => (e.allocations?.[hotel.short_code] || 0) > 0).length;
        const sharePct = deptPayroll > 0 ? (allocated / deptPayroll) * 100 : 0;
        const roomRev = hotel.room_revenue_budget || 0;
        const revPct = roomRev > 0 ? (allocated / roomRev) * 100 : null;

        if (idx % 2 === 0) fillRect(doc, margin, y, contentW, 7.5, OFF_WHITE);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...DARK_TEXT);
        doc.text(sanitize(hotel.name),   margin + 3,               y + 5.2);
        doc.text(String(hc),             margin + contentW * 0.38, y + 5.2, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...col);
        doc.text(fmt(allocated),         margin + contentW * 0.58, y + 5.2, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK_TEXT);
        doc.text(`${sharePct.toFixed(1)}%`, margin + contentW * 0.78, y + 5.2, { align: 'center' });
        const revColor = revPct !== null && revPct > 5 ? STATUS_BAD : revPct !== null && revPct > 3 ? STATUS_WARN : DARK_TEXT;
      doc.setTextColor(...revColor);
        doc.text(revPct !== null ? `${revPct.toFixed(2)}%` : '—', margin + contentW, y + 5.2, { align: 'right' });
        y += 7.5;
        drawLine(doc, margin, y, margin + contentW, y, LIGHT_GRAY, 0.2);
      });
      y += 6;

      // Employee roster (like the question-by-question table in reference)
      const headerFn = (d) => {
        drawPageHeader(d, 'Department Detail', DEPT_LABELS[dept], pageW, margin, col);
        drawFooter(d, pageW, pageH, margin);
      };

      y = checkNewPage(doc, y, 20, pageH, margin, headerFn);
      y = drawSectionBand(doc, y, `Employee Roster  (${deptEmps.length})`, pageW, margin, NAVY_LIGHT);
      y += 3;

      // Table header row
      fillRect(doc, margin, y, contentW, 7.5, LIGHT_GRAY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...DARK_TEXT);
      doc.text('#',             margin + 3,               y + 5.2);
      doc.text('Name',          margin + 12,              y + 5.2);
      doc.text('Title',         margin + contentW * 0.30, y + 5.2);
      doc.text('Salary',        margin + contentW * 0.58, y + 5.2, { align: 'center' });
      doc.text('Total Alloc',   margin + contentW * 0.74, y + 5.2, { align: 'center' });
      doc.text('Alloc Payroll', margin + contentW,         y + 5.2, { align: 'right' });
      y += 7.5;
      drawLine(doc, margin, y, margin + contentW, y, LIGHT_GRAY, 0.4);

      deptEmps.forEach((emp, idx) => {
        y = checkNewPage(doc, y, 9, pageH, margin, headerFn);

        const allocPayroll = propertyHotels.reduce((s, h) => s + ((emp.allocations?.[h.short_code] || 0) * emp.annual_salary), 0);
        const totalAlloc = Object.values(emp.allocations || {}).reduce((s, v) => s + (v || 0), 0);
        const allocOk = Math.abs(totalAlloc - 1) < 0.015;
        const allocOver = totalAlloc > 1.015;
        const allocCol = allocOk ? STATUS_GOOD : allocOver ? STATUS_BAD : STATUS_WARN;
        const allocLabel = allocOk ? 'OK' : allocOver ? 'OVER' : 'PARTIAL';

        if (idx % 2 === 0) fillRect(doc, margin, y, contentW, 7.5, OFF_WHITE);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...MID_GRAY);
        doc.text(String(idx + 1), margin + 3, y + 5.2);

        doc.setTextColor(...DARK_TEXT);
        doc.text(sanitize(emp.name), margin + 12, y + 5.2);

        // Title — truncate to fit
        const titleFull = sanitize(emp.title);
        const titleLines = doc.splitTextToSize(titleFull, contentW * 0.27);
        doc.setFontSize(7);
        doc.text(titleLines[0], margin + contentW * 0.30, y + 5.2);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK_TEXT);
        doc.text(fmt(emp.annual_salary), margin + contentW * 0.58, y + 5.2, { align: 'center' });

        // Alloc status pill
        const pillX2 = margin + contentW * 0.74 - 11;
        fillRect(doc, pillX2, y + 1.5, 22, 4.5, allocCol);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(...WHITE);
        doc.text(`${(totalAlloc * 100).toFixed(0)}%  ${allocLabel}`, pillX2 + 11, y + 5, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...col);
        doc.text(fmt(allocPayroll), margin + contentW, y + 5.2, { align: 'right' });

        y += 7.5;
        drawLine(doc, margin, y, margin + contentW, y, LIGHT_GRAY, 0.2);
      });

      y += 6;
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PAGE NUMBERS on all interior pages
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 2; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...MID_GRAY);
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