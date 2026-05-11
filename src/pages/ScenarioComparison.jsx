import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    
    hotels.forEach(h => {
      hotelMetrics[h.short_code] = {
        name: h.name,
        totalPayroll: 0,
        employeeCount: 0,
        allocations: {},
      };
    });

    Object.entries(snapshot).forEach(([empId, allocations]) => {
      const emp = employees.find(e => e.id === empId);
      if (!emp || emp.suppressed) return;

      const salary = emp.annual_salary;
      Object.entries(allocations || {}).forEach(([hotelCode, pct]) => {
        if (hotelCode in hotelMetrics && pct > 0) {
          hotelMetrics[hotelCode].totalPayroll += salary * pct;
          hotelMetrics[hotelCode].employeeCount += pct;
          hotelMetrics[hotelCode].allocations[empId] = pct;
        }
      });
    });

    return hotelMetrics;
  };

  const toggleScenario = (scenario) => {
    if (selectedScenarios.find(s => s.id === scenario.id)) {
      setSelectedScenarios(selectedScenarios.filter(s => s.id !== scenario.id));
    } else if (selectedScenarios.length < 4) {
      setSelectedScenarios([...selectedScenarios, scenario]);
    }
  };

  const getVariance = (scenario, hotelCode) => {
    const metrics = calculateMetrics(scenario.snapshot);
    const hotel = hotels.find(h => h.short_code === hotelCode);
    if (!hotel) return { variance: 0, pct: 0 };
    
    const payroll = metrics[hotelCode]?.totalPayroll || 0;
    const budget = hotel.sm_payroll_budget || 0;
    const variance = payroll - budget;
    const pct = budget > 0 ? (variance / budget) * 100 : 0;
    
    return { variance, pct, payroll, budget };
  };

  const sortedHotels = HOTEL_ORDER.map(code => hotels.find(h => h.short_code === code)).filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Scenario Comparison</h2>
        <p className="text-sm text-muted-foreground mt-1">Select up to 4 scenarios to compare metrics side-by-side</p>
      </div>

      {/* Scenario selector */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Available Scenarios</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {scenarios.map(scenario => {
            const isSelected = selectedScenarios.find(s => s.id === scenario.id);
            return (
              <button
                key={scenario.id}
                onClick={() => toggleScenario(scenario)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/50'
                }`}
              >
                <p className="font-medium text-sm">{scenario.name}</p>
                {scenario.description && (
                  <p className="text-xs text-muted-foreground mt-1">{scenario.description}</p>
                )}
              </button>
            );
          })}
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
              {sortedHotels.map(hotel => (
                <div key={hotel.short_code} className="border border-border rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-3">{hotel.name}</h4>
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${selectedScenarios.length}, 1fr)` }}>
                    {selectedScenarios.map(scenario => {
                      const metrics = calculateMetrics(scenario.snapshot);
                      const payroll = metrics[hotel.short_code]?.totalPayroll || 0;
                      return (
                        <div key={scenario.id} className="bg-muted/40 rounded p-3">
                          <p className="text-xs text-muted-foreground mb-1">{scenario.name}</p>
                          <p className="font-bold text-sm">{formatCurrency(payroll)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Budget Variance */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Budget Variance by Hotel</h3>
            <div className="grid gap-4">
              {sortedHotels.map(hotel => (
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
            </div>
          </Card>

          {/* Employee Count & Allocations */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Employee Count (FTE) by Hotel</h3>
            <div className="grid gap-4">
              {sortedHotels.map(hotel => (
                <div key={hotel.short_code} className="border border-border rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-3">{hotel.name}</h4>
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${selectedScenarios.length}, 1fr)` }}>
                    {selectedScenarios.map(scenario => {
                      const metrics = calculateMetrics(scenario.snapshot);
                      const count = metrics[hotel.short_code]?.employeeCount || 0;
                      return (
                        <div key={scenario.id} className="bg-muted/40 rounded p-3">
                          <p className="text-xs text-muted-foreground mb-1">{scenario.name}</p>
                          <p className="font-bold text-sm">{count.toFixed(2)} FTE</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}