import React from 'react';
import { useLocation } from 'react-router-dom';
import { Check, HelpCircle, X } from 'lucide-react';

const GUIDES = {
  '/': {
    title: 'Salary Table',
    intro: 'Manage your team and how each person\'s salary is allocated across hotels.',
    points: [
      'Allocations are percentages of a person\'s annual salary charged to each hotel.',
      'Click any allocation cell to edit it in place; the row totals update live.',
      'Redaction mode (if enabled) hides salary values from the table and cards.',
      'Suppressed employees are hidden from tables and all calculations, but stay in the org chart.',
    ],
  },
  '/budgets': {
    title: 'Hotel Budgets',
    intro: 'Set each hotel\'s payroll budget for every department and see how allocated salaries compare.',
    points: [
      'Each hotel card holds its own Commercial, Finance, HR, and Engineering budgets for 2027.',
      'Click a card to drill into which employees are allocated to that hotel.',
      'The budget-used bar turns amber near the limit and red when over budget.',
      'Add or remove hotels from the header buttons on this page.',
    ],
  },
  '/analytics': {
    title: 'Analytics',
    intro: 'Hotel-level payroll metrics for the 2027 fiscal year.',
    points: [
      'Charts show payroll and average salary grouped by individual hotel property.',
      'Suppressed employees are excluded from all active-employee calculations.',
      'Use these views to spot hotels carrying the heaviest payroll load.',
    ],
  },
  '/org-chart': {
    title: 'Org Chart',
    intro: 'The full team structure, including employees hidden from the tables.',
    points: [
      'Each branch shows a payroll rollup for everyone beneath it.',
      'Collapse or expand branches, and drag a card to reassign its manager.',
      'Use the search spotlight to find a specific person quickly.',
    ],
  },
  '/alerts': {
    title: 'Alerts',
    intro: 'Attention items across your payroll plan.',
    points: [
      'Over-budget hotels and allocation gaps surface here.',
      'Resolve items by adjusting budgets or allocations on the other pages.',
    ],
  },
  '/compare': {
    title: 'Scenario Comparison',
    intro: 'Compare up to four saved scenarios side by side.',
    points: [
      'Pick which scenarios to compare from the selectors at the top.',
      'Each column shows payroll by hotel, budget variance, and salary rollups.',
      'Scenarios are snapshots; switching views never changes your live data.',
    ],
  },
  dept: {
    title: 'Department Workspace',
    intro: 'Your department\'s staff, allocations, and per-hotel budgets in one place.',
    points: [
      'Each hotel card shows this department\'s budget, allocated payroll, and remaining dollars.',
      'Scenarios you save here are scoped to this department only.',
      'Budgets are set per hotel, just like on the Hotel Budgets page.',
    ],
  },
};

export default function HelpBanner({ open, onToggle }) {
  const location = useLocation();
  const pathname = location.pathname;
  const guide = GUIDES[pathname]
    || (['/finance', '/hr', '/engineering'].some(p => pathname.startsWith(p)) ? GUIDES.dept : null);

  if (!open) return null;

  return (
    <section className="mb-6 rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/70 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2.5">
          <HelpCircle className="w-4 h-4" />
          <h2 className="text-sm font-semibold tracking-tight">
            {guide ? `${guide.title} — how it works` : 'How this app works'}
          </h2>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          title="Hide help section"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="px-5 py-4 space-y-3">
        <p className="text-sm text-muted-foreground">{guide ? guide.intro : 'Use the navigation above to move between the salary table, budgets, analytics, org chart, and comparisons.'}</p>
        {guide && (
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
            {guide.points.map((p, i) => (
              <li key={i} className="flex gap-2.5 items-start text-sm">
                <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}