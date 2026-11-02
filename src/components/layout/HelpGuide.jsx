import React, { useState, useEffect } from 'react';
import {
  HelpCircle, X, BookOpen, TableProperties, Building2, BarChart3, Network,
  AlertTriangle, GitCompare, Users, BookMarked, EyeOff, Lightbulb,
} from 'lucide-react';

const SECTIONS = [
  {
    id: 'salary', icon: TableProperties, label: 'Salary Table', title: 'Salary Table',
    intro: 'The core worksheet: every team member and exactly how their 2027 salary is split across the hotels.',
    blocks: [
      { label: 'What it does —', text: "Each employee's annual salary is charged to hotels as allocation percentages, and every row should total exactly 100%. The footer rolls up allocated payroll, hotel budgets, and payroll as a share of revenue for every property." },
      { label: 'How to use it —', text: 'Click any allocation cell to edit it in place; the row total and the running total indicator update live. Rows that don\'t total 100% show a Fix to 100% button that rescales the remaining percentage across that person\'s hotels, keeping locked hotels fixed. Use the search bar to filter by name, department, hotel, or allocation status.' },
      { label: 'Editing a person —', text: 'Add Employee opens the allocation popup: set a salary, pick hotels, and split with Even Split, By Room Count, or By Revenue. Press Enter in a hotel\'s percentage field to jump straight to the next hotel. Suppress an employee to hide them from tables and calculations while keeping them in the org chart.' },
    ],
    examples: 'Even Split across Aura, HAFA, and Ink 48 · Lock HAFA at 30%, then press By Revenue to spread the remaining 70% by each hotel\'s revenue budget · Filter to Allocation: Issues to see only rows that don\'t total 100%.',
  },
  {
    id: 'budgets', icon: Building2, label: 'Hotel Budgets', title: 'Hotel Budgets',
    intro: 'Per-hotel payroll budgets for every department, and how allocated salaries compare against them.',
    blocks: [
      { label: 'What it does —', text: 'Each hotel card holds its 2027 Total Revenue budget plus its own Commercial (S&M), Finance, HR, and Engineering payroll budgets. Allocated payroll from the salary tables is compared against each budget live.' },
      { label: 'How to use it —', text: "Click a card's edit button to set any budget figure. Click a card to drill into exactly which employees are allocated to that hotel, by department, with subtotals and budget utilization. Adding or removing a hotel keeps employee allocations in sync automatically." },
      { label: 'Reading the cards —', text: 'The usage bar turns amber near the budget limit and red when over. Hotels sort largest revenue first, so the biggest properties are always leftmost.' },
    ],
  },
  {
    id: 'analytics', icon: BarChart3, label: 'Analytics', title: 'Analytics',
    intro: 'Hotel-level payroll metrics for the 2027 fiscal year.',
    blocks: [
      { label: 'What it shows —', text: 'Payroll and average salary grouped by individual hotel property, plus department comparisons, so you can spot which hotels carry the heaviest payroll load.' },
      { label: 'Exclusions —', text: 'Suppressed employees and corporate-only staff are excluded from all active-employee calculations.' },
    ],
  },
  {
    id: 'org', icon: Network, label: 'Org Chart', title: 'Org Chart',
    intro: 'The full team structure, including employees hidden from the tables.',
    blocks: [
      { label: 'What it does —', text: 'Each branch shows a payroll rollup for everyone beneath it. Drag a card onto another person to reassign its manager; collapse or expand branches to focus.' },
      { label: 'Tips —', text: 'Use the search spotlight to find a specific person quickly. Suppressed employees still appear here, marked, so the structure stays complete.' },
    ],
  },
  {
    id: 'alerts', icon: AlertTriangle, label: 'Alerts', title: 'Alerts',
    intro: 'Attention items across your payroll plan, ranked by what to fix first.',
    blocks: [
      { label: 'What it does —', text: 'The Next Actions strip at the top lists the top three fixes: over-budget hotels first, then near-limit budgets, then the most off-target allocations.' },
      { label: 'How to use it —', text: "Each action card jumps straight to the problem: hotel budget drill-downs open on the Hotel Budgets page, and allocation issues open the employee's row on the Salary Table." },
    ],
  },
  {
    id: 'compare', icon: GitCompare, label: 'Scenario Comparison', title: 'Scenario Comparison',
    intro: 'Compare up to four saved scenarios side by side.',
    blocks: [
      { label: 'What it does —', text: 'Each column shows payroll by hotel, budget variance, and salary rollups for one saved scenario, so you can measure the impact of staffing changes before committing them.' },
      { label: 'Good to know —', text: 'Scenarios are read-only snapshots. Comparing or switching never changes your live data.' },
    ],
  },
  {
    id: 'dept', icon: Users, label: 'Department Workspaces', title: 'Department Workspaces',
    intro: 'Finance, HR, and Engineering each get the same full set of pages as Commercial, driven by that department\'s own staff and budgets.',
    blocks: [
      { label: 'How to use it —', text: 'Switch departments with the dropdown in the top header. Every department has its own salary table, hotel budgets, analytics, alerts, and scenario comparison — one department never sees another\'s plan. The Org Chart stays Commercial-only for now.' },
      { label: 'Budgets —', text: 'Each department\'s per-hotel payroll budgets are edited from the Commercial workspace\'s Hotel Budgets page, where all departments\' budgets can be set.' },
    ],
  },
  {
    id: 'scenarios', icon: BookMarked, label: 'Scenarios & Snapshots', title: 'Scenarios & Snapshots',
    intro: 'Plan changes safely before committing them.',
    blocks: [
      { label: 'What it does —', text: 'Save the current salary allocations as a named snapshot. While a scenario is active, every edit you make stays inside the scenario — your saved data is untouched until you apply it.' },
      { label: 'How to use it —', text: 'Use the scenario picker in the top bar to save, restore, or clear a scenario. The Compare page puts up to four of them side by side.' },
    ],
  },
  {
    id: 'redaction', icon: EyeOff, label: 'Salary Redaction', title: 'Salary Redaction',
    intro: 'Hide sensitive salary figures with one switch.',
    blocks: [
      { label: 'What it does —', text: 'When redaction is on, salaries and payroll totals display as blocked characters across the salary table, cards, and reports. Allocation percentages stay visible so planning can continue.' },
      { label: 'Good to know —', text: 'Redacted employees remain fully counted in all calculations — only the display changes.' },
    ],
  },
  {
    id: 'faq', icon: Lightbulb, label: 'FAQ & Tips', title: 'FAQ & Tips',
    intro: 'Quick answers to the most common questions.',
    blocks: [
      { label: 'Row totals —', text: 'A row highlighted amber or red doesn\'t total 100%. Fix to 100% rescales it instantly, respecting locked hotels.' },
      { label: 'Locked hotels —', text: 'In the allocation popup, the padlock holds a hotel\'s percentage fixed while the spread buttons distribute the remainder.' },
      { label: 'Suppressed vs. excluded —', text: 'Suppressed hides an employee from tables and math; the org chart keeps them.' },
      { label: 'Revenue-first ordering —', text: 'Hotels sort by total revenue budget everywhere in the app, so the properties you check most are always leftmost.' },
    ],
  },
];

export default function HelpGuide() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const active = SECTIONS.find(s => s.id === activeId) || SECTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200"
        title="Help & User Guide"
      >
        <HelpCircle className="w-4 h-4 text-white" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-5xl h-[82vh] rounded-2xl bg-card shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ backgroundColor: '#2d4b5e' }}>
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-white" />
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">Help &amp; User Guide</h2>
                  <p className="text-[11px] text-white/60 uppercase tracking-wider">REBEL Hotel Co. — Salary Allocations · 2027</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-white/15 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 min-h-0">
              {/* Sidebar */}
              <div className="flex md:flex-col flex-shrink-0 overflow-x-auto md:overflow-x-visible md:overflow-y-auto md:w-56 bg-muted/40 border-b md:border-b-0 md:border-r border-border p-2 gap-1">
                {SECTIONS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveId(s.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-left whitespace-nowrap flex-shrink-0 transition-colors ${
                      activeId === s.id
                        ? 'bg-card text-foreground shadow-sm border-l-4 border-blue-500'
                        : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
                    }`}
                  >
                    <s.icon className={`w-4 h-4 flex-shrink-0 ${activeId === s.id ? 'text-primary' : ''}`} />
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div key={active.id} className="flex-1 overflow-y-auto p-6 md:p-8">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2.5">
                  <active.icon className="w-5 h-5 text-primary" />
                  {active.title}
                </h3>
                <div className="h-px bg-border my-4" />
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{active.intro}</p>
                <div className="space-y-3.5">
                  {active.blocks.map(b => (
                    <p key={b.label} className="text-sm text-foreground/90 leading-relaxed">
                      <strong className="font-semibold">{b.label}</strong> {b.text}
                    </p>
                  ))}
                </div>
                {active.examples && (
                  <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3.5 text-[13px] leading-relaxed text-emerald-800 dark:text-emerald-300">
                    <strong>Examples:</strong> {active.examples}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-4 px-6 py-3 border-t border-border bg-muted/30 flex-shrink-0">
              <p className="text-xs text-muted-foreground">Need further assistance? Contact your REBEL administrator.</p>
              <button
                onClick={() => setOpen(false)}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#2d4b5e' }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}