import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { TableProperties, Building2, Network, AlertTriangle, BarChart3, Moon, Sun, BookMarked } from 'lucide-react';
import { useTheme } from '@/lib/theme.jsx';
import { useScenario } from '@/lib/ScenarioContext';

const navItems = [
  { path: '/', label: 'Salary Table', icon: TableProperties },
  { path: '/budgets', label: 'Hotel Budgets', icon: Building2 },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/org-chart', label: 'Org Chart', icon: Network },
  { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
];

export default function AppLayout() {
  const location = useLocation();
  const { dark, toggle } = useTheme();
  const { activeScenario } = useScenario();

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-white/10" style={{ backgroundColor: '#2d4b5e' }} className="border-b border-white/10">
        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <img
                src="https://media.base44.com/images/public/69fe195adbdd18b7b19462a0/0b464d6d1_d1eb1b4f2_RBLMark-RH_Blue.png"
                alt="Rebel Hotel Company"
                className="h-10 w-auto object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              <div>
                <h1 className="text-lg font-display font-bold text-white leading-tight tracking-tight">Topline Salary</h1>
                <p className="text-[11px] text-white/60 font-inter tracking-wider uppercase">Hotel Management Dashboard</p>
              </div>
            </div>
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200"
              title="Toggle dark/light mode"
            >
              {dark ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-0.5 overflow-x-auto py-1.5">
              {navItems.map(({ path, label, icon: Icon }) => {
                const active = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      active
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}
            </div>
            {activeScenario && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary whitespace-nowrap ml-4">
                <BookMarked className="w-3 h-3" />
                Scenario: {activeScenario.name}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}