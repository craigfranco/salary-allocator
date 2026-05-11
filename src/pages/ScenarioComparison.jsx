import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { formatCurrency, HOTEL_COLORS, HOTEL_SHORT_NAMES } from '@/lib/helpers';

const HOTEL_ORDER = ['AURA', 'H5A', 'INK48', 'LIFE', 'RENWICK', 'SMYTH', 'CORP'];

export default function ScenarioComparison() {
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const qc = useQueryClient();

  const { data: scenarios = [] } = useQuery({
    queryKey: ['scenarios'],
    queryFn: () => base44.entities.Scenario.list(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: hotels = [] } = useQuery({
    queryKey: ['hotels'],
    queryFn: () => base44.entities.Hotel.list(),
  });

  // Calculate metrics for a scenario snapshot
  const calculateMetrics = (snapshot) => {
    const hotelMetrics = {};
    let totalSalary = 0;
    
    hotels.forEach(h => {
      hotelMetrics[h.short_code] = {
        name: h.name,
        totalPayroll: 0,
        employeeCount: 0,
        allocations: {},
      };
    });

    // Handle array-based snapshots
    if (Array.isArray(snapshot)) {
      snapshot.forEach(emp => {
        if (emp.suppressed || emp.exclude_from_table) return;

        const salary = emp.annual_salary;
        totalSalary += salary;
        
        Object.entries(emp.allocations || {}).forEach(([hotelCode, pct]) => {
          if (hotelCode in hotelMetrics && pct > 0) {
            hotelMetrics[hotelCode].totalPayroll += salary * pct;
            hotelMetrics[hotelCode].employeeCount += pct;
            hotelMetrics[hotelCode].allocations[emp.id] = pct;
          }
        });
      });
    }

    return { hotelMetrics, totalSalary };
  };

  const toggleScenario = (scenario) => {
    if (selectedScenarios.find(s => s.id === scenario.id)) {
      setSelectedScenarios(selectedScenarios.filter(s => s.id !== scenario.id));
    } else if (selectedScenarios.length < 4) {
      setSelectedScenarios([...selectedScenarios, scenario]);
    }
  };

  const getVariance = (scenario, hotelCode) => {
    const { hotelMetrics } = calculateMetrics(scenario.snapshot);
    const hotel = hotels.find(h => h.short_code === hotelCode);
    if (!hotel) return { variance: 0, pct: 0 };
    
    const payroll = hotelMetrics[hotelCode]?.totalPayroll || 0;
    const budget = hotel.sm_payroll_budget || 0;
    const variance = payroll - budget;
    const pct = budget > 0 ? (variance / budget) * 100 : 0;
    
    return { variance, pct, payroll, budget };
  };

  const sortedHotels = HOTEL_ORDER.map(code => hotels.find(h => h.short_code === code)).filter(Boolean);

  // Filter to only hotels with changes across selected scenarios
  const getHotelsWithChanges = () => {
    if (selectedScenarios.length < 2) return sortedHotels;

    return sortedHotels.filter(hotel => {
      const payrolls = selectedScenarios.map(s => {
        const { hotelMetrics } = calculateMetrics(s.snapshot);
        return hotelMetrics[hotel.short_code]?.totalPayroll || 0;
      });
      
      // Check if any payroll value differs from the first
      return payrolls.some(p => p !== payrolls[0]);
    });
  };

  const hotelsWithChanges = getHotelsWithChanges();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Scenario Comparison</h2>
        <p className="text-sm text-muted-foreground mt-1">Select up to 4 scenarios to compare metrics side-by-side</p>
      </div>

      {/* Scenario selector with dropdowns */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Select Scenarios to Compare</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(idx => (
            <div key={idx}>
              <label className="text-xs text-muted-foreground block mb-2">Scenario {idx + 1}</label>
              <Select 
                value={selectedScenarios[idx]?.id || ''}
                onValueChange={(scenarioId) => {
                  const scenario = scenarios.find(s => s.id === scenarioId);
                  if (scenario) {
                    const updated = [...selectedScenarios];
                    updated[idx] = scenario;
                    setSelectedScenarios(updated.filter(s => s));
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>— Clear —</SelectItem>
                  {scenarios.map(scenario => (
                    <SelectItem key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </Card>

      {selectedScenarios.length === 0 ? (
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">Select scenarios to compare</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Payroll by Hotel */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Total Payroll by Hotel</h3>
            <div className="grid gap-4">
              {hotelsWithChanges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No changes across selected scenarios</p>
              ) : (
                <>
                  {hotelsWithChanges.map(hotel => {
                    const payrolls = selectedScenarios.map(s => {
                      const { hotelMetrics } = calculateMetrics(s.snapshot);
                      return hotelMetrics[hotel.short_code]?.totalPayroll || 0;
                    });

                    return (
                      <div key={hotel.short_code} className="border border-border rounded-lg p-4">
                        <h4 className="font-medium text-sm mb-3">{hotel.name}</h4>
                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${selectedScenarios.length}, 1fr)` }}>
                          {selectedScenarios.map((scenario, idx) => {
                            const payroll = payrolls[idx];
                            const prevPayroll = idx > 0 ? payrolls[idx - 1] : null;
                            const change = prevPayroll !== null ? payroll - prevPayroll : null;

                            return (
                              <div key={scenario.id} className="bg-muted/40 rounded p-3">
                                <p className="text-xs text-muted-foreground mb-1">{scenario.name}</p>
                                <p className="font-bold text-sm">{formatCurrency(payroll)}</p>
                                {change !== null && (
                                  <p className={`text-xs font-medium mt-1 ${change < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {change < 0 ? '' : '+'}{formatCurrency(change)}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Payroll Total Line */}
                  <div className="border-2 border-primary rounded-lg p-4 bg-primary/5 font-semibold">
                    <h4 className="text-sm mb-3">Total Payroll (All Properties)</h4>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${selectedScenarios.length}, 1fr)` }}>
                      {selectedScenarios.map((scenario, idx) => {
                        const total = hotelsWithChanges.reduce((sum, hotel) => {
                          const { hotelMetrics } = calculateMetrics(scenario.snapshot);
                          return sum + (hotelMetrics[hotel.short_code]?.totalPayroll || 0);
                        }, 0);
                        const prevTotal = idx > 0 ? hotelsWithChanges.reduce((sum, hotel) => {
                          const { hotelMetrics } = calculateMetrics(selectedScenarios[idx - 1].snapshot);
                          return sum + (hotelMetrics[hotel.short_code]?.totalPayroll || 0);
                        }, 0) : null;
                        const change = prevTotal !== null ? total - prevTotal : null;

                        return (
                          <div key={scenario.id} className="bg-primary/10 rounded p-3">
                            <p className="text-xs text-muted-foreground mb-1">{scenario.name}</p>
                            <p className="font-bold text-base">{formatCurrency(total)}</p>
                            {change !== null && (
                               <p className={`text-xs font-semibold mt-1 ${change < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                 {change < 0 ? '' : '+'}{formatCurrency(change)}
                               </p>
                             )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Budget Variance */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Budget Variance by Hotel</h3>
            <div className="grid gap-4">
              {hotelsWithChanges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No changes across selected scenarios</p>
              ) : (
                <>
                  {hotelsWithChanges.map(hotel => (
                    <div key={hotel.short_code} className="border border-border rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-3">{hotel.name}</h4>
                      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${selectedScenarios.length}, 1fr)` }}>
                        {selectedScenarios.map(scenario => {
                          const { variance, pct, payroll, budget } = getVariance(scenario, hotel.short_code);
                          const isOver = variance > 0;
                          return (
                            <div key={scenario.id} className="bg-muted/40 rounded p-3">
                              <p className="text-xs text-muted-foreground mb-1">{scenario.name}</p>
                              <p className="font-bold text-sm">{formatCurrency(variance)}</p>
                              <p className={`text-xs font-medium mt-1 ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                                {isOver ? '+' : ''}{pct.toFixed(1)}%
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Budget: {formatCurrency(budget)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Variance Total Line */}
                  <div className="border-2 border-primary rounded-lg p-4 bg-primary/5 font-semibold">
                    <h4 className="text-sm mb-3">Total Variance (All Properties)</h4>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${selectedScenarios.length}, 1fr)` }}>
                      {selectedScenarios.map(scenario => {
                        const totalVariance = hotelsWithChanges.reduce((sum, hotel) => {
                          const { variance } = getVariance(scenario, hotel.short_code);
                          return sum + variance;
                        }, 0);
                        const totalBudget = hotelsWithChanges.reduce((sum, hotel) => {
                          const { budget } = getVariance(scenario, hotel.short_code);
                          return sum + budget;
                        }, 0);
                        const isOver = totalVariance > 0;
                        const varPct = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;

                        return (
                          <div key={scenario.id} className="bg-primary/10 rounded p-3">
                            <p className="text-xs text-muted-foreground mb-1">{scenario.name}</p>
                            <p className="font-bold text-base">{formatCurrency(totalVariance)}</p>
                            <p className={`text-xs font-semibold mt-1 ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                              {isOver ? '+' : ''}{varPct.toFixed(1)}%
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Employee Count & Allocations */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Employee Count (FTE) by Hotel</h3>
            <div className="grid gap-4">
              {hotelsWithChanges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No changes across selected scenarios</p>
              ) : (
                <>
                  {hotelsWithChanges.map(hotel => {
                    const counts = selectedScenarios.map(s => {
                      const { hotelMetrics } = calculateMetrics(s.snapshot);
                      return hotelMetrics[hotel.short_code]?.employeeCount || 0;
                    });

                    return (
                      <div key={hotel.short_code} className="border border-border rounded-lg p-4">
                        <h4 className="font-medium text-sm mb-3">{hotel.name}</h4>
                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${selectedScenarios.length}, 1fr)` }}>
                          {selectedScenarios.map((scenario, idx) => {
                            const count = counts[idx];
                            const prevCount = idx > 0 ? counts[idx - 1] : null;
                            const changeFTE = prevCount !== null ? count - prevCount : null;

                            return (
                              <div key={scenario.id} className="bg-muted/40 rounded p-3">
                                <p className="text-xs text-muted-foreground mb-1">{scenario.name}</p>
                                <p className="font-bold text-sm">{count.toFixed(2)} FTE</p>
                                {changeFTE !== null && (
                                  <p className={`text-xs font-medium mt-1 ${changeFTE > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {changeFTE > 0 ? '+' : ''}{changeFTE.toFixed(2)}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* FTE Total Line */}
                  <div className="border-2 border-primary rounded-lg p-4 bg-primary/5 font-semibold">
                    <h4 className="text-sm mb-3">Total FTE (All Properties)</h4>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${selectedScenarios.length}, 1fr)` }}>
                      {selectedScenarios.map((scenario, idx) => {
                        const totalFTE = hotelsWithChanges.reduce((sum, hotel) => {
                          const { hotelMetrics } = calculateMetrics(scenario.snapshot);
                          return sum + (hotelMetrics[hotel.short_code]?.employeeCount || 0);
                        }, 0);
                        const prevFTE = idx > 0 ? hotelsWithChanges.reduce((sum, hotel) => {
                          const { hotelMetrics } = calculateMetrics(selectedScenarios[idx - 1].snapshot);
                          return sum + (hotelMetrics[hotel.short_code]?.employeeCount || 0);
                        }, 0) : null;
                        const changeFTE = prevFTE !== null ? totalFTE - prevFTE : null;

                        return (
                          <div key={scenario.id} className="bg-primary/10 rounded p-3">
                            <p className="text-xs text-muted-foreground mb-1">{scenario.name}</p>
                            <p className="font-bold text-base">{totalFTE.toFixed(2)} FTE</p>
                            {changeFTE !== null && (
                              <p className={`text-xs font-semibold mt-1 ${changeFTE > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {changeFTE > 0 ? '+' : ''}{changeFTE.toFixed(2)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Total Salary Changes */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Total Salary Rollup</h3>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${selectedScenarios.length}, 1fr)` }}>
              {selectedScenarios.map((scenario, idx) => {
                const { totalSalary } = calculateMetrics(scenario.snapshot);
                const prevSnapshot = idx > 0 ? selectedScenarios[idx - 1].snapshot : null;
                const prevTotal = prevSnapshot ? calculateMetrics(prevSnapshot).totalSalary : null;
                const change = prevTotal !== null ? totalSalary - prevTotal : null;

                return (
                  <div key={scenario.id} className="border border-border rounded-lg p-4 bg-muted/40">
                    <p className="text-xs text-muted-foreground mb-2">{scenario.name}</p>
                    <p className="font-bold text-lg">{formatCurrency(totalSalary)}</p>
                    {change !== null && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className={`text-sm font-semibold ${change < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {change < 0 ? '' : '+'}{formatCurrency(change)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}