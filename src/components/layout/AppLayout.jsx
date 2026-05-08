import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { TableProperties, Building2, Network, AlertTriangle, Hotel } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Salary Table', icon: TableProperties },
  { path: '/budgets', label: 'Hotel Budgets', icon: Building2 },
  { path: '/org-chart', label: 'Org Chart', icon: Network },
  { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground border-b border-primary/20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <Hotel className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-display font-semibold leading-tight">Topline Salary</h1>
                <p className="text-xs text-primary-foreground/60 font-inter">Management Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-card border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}