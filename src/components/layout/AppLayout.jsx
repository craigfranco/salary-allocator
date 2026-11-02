import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { TableProperties, Building2, Network, AlertTriangle, BarChart3, Moon, Sun, BookMarked, GitCompare, ChevronDown, X, DollarSign, Users, Wrench } from 'lucide-react';
import { useTheme } from '@/lib/theme.jsx';
import { useScenario } from '@/lib/ScenarioContext';
import ExecPDFButton from '@/components/layout/ExecPDFButton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/', label: 'Salary Table', icon: TableProperties },
  { path: '/budgets', label: 'Hotel Budgets', icon: Building2 },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/org-chart', label: 'Org Chart', icon: Network },
  { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { path: '/compare', label: 'Compare', icon: GitCompare },
  { path: '/finance', label: 'Finance', icon: DollarSign },
  { path: '/hr', label: 'Human Resources', icon: Users },
  { path: '/engineering', label: 'Engineering', icon: Wrench },
];

export default function AppLayout() {
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const location = useLocation();
  const { dark, toggle } = useTheme();
  const { activeScenario, scenarioData, restoreScenario, clearScenario } = useScenario();

  const { data: scenarios = [] } = useQuery({
    queryKey: ['scenarios'],
    queryFn: () => base44.entities.Scenario.list('-updated_date', 50),
  });

  const autoLoaded = useRef(false);
  useEffect(() => {
    if (!autoLoaded.current && scenarios.length > 0 && !activeScenario) {
      autoLoaded.current = true;
      doRestore(scenarios[0]);
    }
  }, [scenarios]);

  const doRestore = (scenario) => {
    restoreScenario(scenario);
    setScenarioOpen(false);
  };

  const handleClearScenario = () => {
    clearScenario();
    setScenarioOpen(false);
  };

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
                <h1 className="text-lg font-display font-bold text-white leading-tight tracking-tight">Commercial Talent</h1>
                <p className="text-[11px] text-white/60 font-inter tracking-wider uppercase">Salary Allocations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ExecPDFButton />
              <button
                onClick={toggle}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200"
                title="Toggle dark/light mode"
              >
                {dark ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-white" />}
              </button>
            </div>
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
            <Popover open={scenarioOpen} onOpenChange={setScenarioOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`gap-1.5 ml-4 ${activeScenario ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20' : ''}`}
                >
                  <BookMarked className="w-3.5 h-3.5" />
                  {activeScenario ? `Scenario: ${activeScenario.name}` : 'No Scenario'}
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-1">
                {activeScenario && (
                  <>
                    <button
                      className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent cursor-pointer text-destructive"
                      onClick={handleClearScenario}
                    >
                      <X className="w-4 h-4" /> Clear Scenario
                    </button>
                    <div className="my-1 h-px bg-border" />
                  </>
                )}
                <div className="px-2 py-1 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Saved Scenarios</div>
                {scenarios.length > 0 ? (
                  scenarios.map(s => (
                    <button
                      key={s.id}
                      className={`flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent ${
                        activeScenario?.id === s.id ? 'bg-primary/10 text-primary font-medium' : ''
                      }`}
                      onClick={() => doRestore(s)}
                    >
                      <div className="text-left min-w-0">
                        <div className="truncate">{s.name}</div>
                        {s.description && <div className="text-[10px] text-muted-foreground truncate">{s.description}</div>}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-2 py-2 text-xs text-muted-foreground italic">No saved scenarios</div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}