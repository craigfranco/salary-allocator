import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, ArrowUp, ArrowDown, Building2, User } from 'lucide-react';
import { getTotalAllocation, getAllocationStatus, formatCurrency, getHotelAllocatedTotal } from '@/lib/helpers';

export default function Alerts() {
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });
  const { data: hotels = [] } = useQuery({ queryKey: ['hotels'], queryFn: () => base44.entities.Hotel.list() });

  const allocAlerts = employees.map(emp => {
    const total = getTotalAllocation(emp.allocations);
    const status = getAllocationStatus(total);
    if (status === 'exact') return null;
    return { emp, total, status };
  }).filter(Boolean);

  const budgetAlerts = hotels.filter(h => h.short_code !== 'CORP' && h.sm_payroll_budget > 0).map(hotel => {
    const allocated = getHotelAllocatedTotal(employees, hotel.short_code);
    const budget = hotel.sm_payroll_budget;
    const pctUsed = (allocated / budget) * 100;
    if (pctUsed > 100) return { hotel, allocated, budget, type: 'over', amount: allocated - budget };
    if (pctUsed > 95) return { hotel, allocated, budget, type: 'near', amount: budget - allocated };
    return null;
  }).filter(Boolean);

  const hasIssues = allocAlerts.length > 0 || budgetAlerts.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Alerts & Issues</h2>
        <p className="text-sm text-muted-foreground mt-1">Real-time allocation and budget monitoring</p>
      </div>

      {!hasIssues && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex items-center gap-3 py-8">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="text-lg font-semibold text-emerald-800">All Clear</p>
              <p className="text-sm text-emerald-600">No allocation or budget issues detected.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {allocAlerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" />
              Allocation Issues
              <Badge variant="destructive" className="ml-auto">{allocAlerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allocAlerts.map(({ emp, total, status }) => {
                const pct = Math.round(total * 100);
                const isOver = status === 'over' || status === 'close-over';
                return (
                  <div key={emp.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                    status.includes('close') ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      {isOver ? <ArrowUp className="w-4 h-4 text-red-500" /> : <ArrowDown className="w-4 h-4 text-amber-500" />}
                      <div>
                        <p className="text-sm font-semibold">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.title}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={isOver ? 'text-red-600 border-red-300' : 'text-amber-600 border-amber-300'}>
                      {isOver ? `Over: ${pct}%` : `Under: ${pct}%`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {budgetAlerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              Budget Alerts
              <Badge variant="destructive" className="ml-auto">{budgetAlerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {budgetAlerts.map(({ hotel, allocated, budget, type, amount }) => (
                <div key={hotel.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                  type === 'over' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-4 h-4 ${type === 'over' ? 'text-red-500' : 'text-amber-500'}`} />
                    <div>
                      <p className="text-sm font-semibold">{hotel.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Budget: {formatCurrency(budget)} | Allocated: {formatCurrency(allocated)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={type === 'over' ? 'text-red-600 border-red-300' : 'text-amber-600 border-amber-300'}>
                    {type === 'over' ? `Over by ${formatCurrency(amount)}` : `Within ${formatCurrency(amount)}`}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}