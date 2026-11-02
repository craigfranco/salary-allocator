import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { formatCurrency, getHotelAllocatedTotal, getDeptAccent, HOTEL_SHORT_NAMES, orderHotelsByRevenue } from '@/lib/helpers';
import StatCard from '@/components/ui/StatCard';
import { Users, DollarSign, Building2, TrendingUp } from 'lucide-react';
import { useScenario } from '@/lib/ScenarioContext';
import { useRedactedIds } from '@/lib/RedactionContext';

const DEPT_COLORS = { REVENUE: '#0d9488', ECOMM: '#f97316', SALES: '#9333ea' };
const HOTEL_COLORS_HEX = {
  AURA: '#3b82f6', HAFA: '#6366f1', INK48: '#8b5cf6',
  LIFE: '#10b981', RENWICK: '#f59e0b', SMYTH: '#f43f5e', CORP: '#94a3b8'
};



function TooltipStyle({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color || p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{typeof p.value === 'number' && p.value > 999 ? formatCurrency(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const { activeScenario, scenarioData } = useScenario();
  const { redactedIds } = useRedactedIds();
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });
  const { data: hotels = [] } = useQuery({ queryKey: ['hotels'], queryFn: () => base44.entities.Hotel.list() });

  // Use scenario data if active, otherwise use DB employees
  const displayEmployees = Array.isArray(scenarioData) ? scenarioData : (Array.isArray(employees) ? employees : []);
  const activeEmployees = displayEmployees.filter(e => !e.suppressed && !e.exclude_from_table);

  const totalPayroll = activeEmployees.reduce((s, e) => s + e.annual_salary, 0);
  const avgSalary = activeEmployees.length > 0 ? totalPayroll / activeEmployees.length : 0;

  const sortedHotels = useMemo(() => orderHotelsByRevenue(hotels), [hotels]);

  // Hotel payroll vs budget
  const hotelData = sortedHotels
    .filter(h => h.short_code !== 'CORP')
    .map(h => ({
      name: HOTEL_SHORT_NAMES[h.short_code] || h.short_code,
      allocated: Math.round(getHotelAllocatedTotal(activeEmployees, h.short_code)),
      budget: h.sm_payroll_budget || 0,
      roomRev: h.total_revenue_budget || 0,
    }));

  const hotelPctRevData = hotelData
    .filter(h => h.roomRev > 0)
    .map(h => ({
      name: h.name,
      pct: parseFloat(((h.allocated / h.roomRev) * 100).toFixed(2)),
    }));

  // Dept breakdown
  const deptData = ['REVENUE', 'ECOMM', 'SALES'].map(dept => {
    const emps = activeEmployees.filter(e => e.department === dept);
    return {
      name: dept,
      headcount: emps.length,
      total: emps.reduce((s, e) => s + e.annual_salary, 0),
      avg: emps.length ? Math.round(emps.reduce((s, e) => s + e.annual_salary, 0) / emps.length) : 0,
    };
  });

  // Average dept salary divided by number of properties
  const avgSalaryPerPropertyData = useMemo(() => {
    const propertyCount = sortedHotels.filter(h => h.short_code !== 'CORP').length;
    if (propertyCount === 0) return [];
    return ['REVENUE', 'ECOMM', 'SALES'].map(dept => {
      const emps = activeEmployees.filter(e => e.department === dept);
      const total = emps.reduce((s, e) => s + e.annual_salary, 0);
      return {
        name: dept,
        avg: emps.length ? Math.round(total / propertyCount) : 0,
      };
    });
  }, [sortedHotels, activeEmployees]);

  // Average salary per department, grouped by hotel
  const avgSalaryByDeptHotelData = useMemo(() => {
    return sortedHotels
      .filter(h => h.short_code !== 'CORP')
      .map(h => {
        const row = { name: HOTEL_SHORT_NAMES[h.short_code] || h.short_code };
        ['REVENUE', 'ECOMM', 'SALES'].forEach(dept => {
          const emps = activeEmployees.filter(e => e.department === dept && (e.allocations?.[h.short_code] || 0) > 0);
          row[dept] = emps.length ? Math.round(emps.reduce((s, e) => s + e.annual_salary, 0) / emps.length) : 0;
        });
        return row;
      });
  }, [sortedHotels, activeEmployees]);

  // Total salary allocated per hotel by department
  const hotelDeptAllocData = useMemo(() => {
    return sortedHotels
      .filter(h => h.short_code !== 'CORP')
      .map(h => {
        const row = { name: HOTEL_SHORT_NAMES[h.short_code] || h.short_code };
        ['REVENUE', 'ECOMM', 'SALES'].forEach(dept => {
          row[dept] = Math.round(
            activeEmployees
              .filter(e => e.department === dept)
              .reduce((s, e) => s + (e.allocations?.[h.short_code] || 0) * e.annual_salary, 0)
          );
        });
        return row;
      });
  }, [sortedHotels, activeEmployees]);

  // Top earners
  const topEarners = [...activeEmployees]
    .sort((a, b) => b.annual_salary - a.annual_salary)
    .slice(0, 8);

  const cardClass = "bg-card border border-border rounded-2xl p-5 shadow-sm";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Salary Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">Payroll insights across hotels and departments</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Payroll" value={totalPayroll} prefix="$" icon={DollarSign} color="blue" />
        <StatCard label="Active Employees" value={activeEmployees.length} icon={Users} color="teal" />
        <StatCard label="Avg Salary" value={avgSalary} prefix="$" icon={TrendingUp} color="purple" />
        <StatCard label="Properties" value={hotels.filter(h => h.short_code !== 'CORP').length} icon={Building2} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actual */}
        <div className={cardClass}>
          <h3 className="text-sm font-semibold mb-4 text-foreground">Budget vs. Allocated by Hotel</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hotelData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip content={<TooltipStyle />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="budget" name="Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.7} />
              <Bar dataKey="allocated" name="Allocated" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payroll % of Total Rev */}
        <div className={cardClass}>
          <h3 className="text-sm font-semibold mb-4 text-foreground">Payroll as % of Total Revenue</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hotelPctRevData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip content={<TooltipStyle />} />
              <Bar dataKey="pct" name="% of Total Rev" radius={[4, 4, 0, 0]}>
                {hotelPctRevData.map((entry, i) => (
                  <Cell key={i} fill={entry.pct > 5 ? '#f43f5e' : entry.pct > 3 ? '#f59e0b' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Headcount Donut */}
        <div className={cardClass}>
          <h3 className="text-sm font-semibold mb-4 text-foreground">Headcount by Department</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={deptData} dataKey="headcount" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {deptData.map((d) => <Cell key={d.name} fill={DEPT_COLORS[d.name]} />)}
                </Pie>
                <Tooltip content={<TooltipStyle />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {deptData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: DEPT_COLORS[d.name] }} />
                  <div>
                    <p className="text-xs font-medium">{d.name}</p>
                    <p className="text-[11px] text-muted-foreground">{d.headcount} staff · {formatCurrency(d.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Avg Salary by Dept x Hotel */}
        <div className={cardClass}>
          <h3 className="text-sm font-semibold mb-4 text-foreground">Average Salary by Department &amp; Hotel</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={avgSalaryByDeptHotelData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip content={<TooltipStyle />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="REVENUE" name="Revenue" fill={DEPT_COLORS.REVENUE} radius={[3, 3, 0, 0]} />
              <Bar dataKey="ECOMM" name="E-Commerce" fill={DEPT_COLORS.ECOMM} radius={[3, 3, 0, 0]} />
              <Bar dataKey="SALES" name="Sales" fill={DEPT_COLORS.SALES} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Avg Salary per Property by Dept */}
      <div className={cardClass}>
        <h3 className="text-sm font-semibold mb-1 text-foreground">Average Dept Salary per Property</h3>
        <p className="text-xs text-muted-foreground mb-4">Total department salary divided by number of properties ({sortedHotels.filter(h => h.short_code !== 'CORP').length} hotels)</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={avgSalaryPerPropertyData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip content={<TooltipStyle />} />
            <Bar dataKey="avg" name="Avg per Property" radius={[4, 4, 0, 0]}>
              {avgSalaryPerPropertyData.map(d => <Cell key={d.name} fill={DEPT_COLORS[d.name]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Total Allocated Salary per Hotel by Department */}
      <div className={cardClass}>
        <h3 className="text-sm font-semibold mb-1 text-foreground">Total Salary Allocated by Property</h3>
        <p className="text-xs text-muted-foreground mb-4">Total allocated payroll per hotel, broken down by department</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={hotelDeptAllocData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip content={<TooltipStyle />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="REVENUE" name="Revenue" fill={DEPT_COLORS.REVENUE} radius={[3, 3, 0, 0]} stackId="a" />
            <Bar dataKey="ECOMM" name="E-Commerce" fill={DEPT_COLORS.ECOMM} radius={[0, 0, 0, 0]} stackId="a" />
            <Bar dataKey="SALES" name="Sales" fill={DEPT_COLORS.SALES} radius={[3, 3, 0, 0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Dept cost table + top earners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={cardClass}>
          <h3 className="text-sm font-semibold mb-4 text-foreground">Department Cost Breakdown</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted-foreground py-2 font-medium">Department</th>
                <th className="text-right text-xs text-muted-foreground py-2 font-medium">Headcount</th>
                <th className="text-right text-xs text-muted-foreground py-2 font-medium">Total Cost</th>
                <th className="text-right text-xs text-muted-foreground py-2 font-medium">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {deptData.map(d => (
                <tr key={d.name} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: DEPT_COLORS[d.name] }} />
                      <span className="font-medium">{d.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">{d.headcount}</td>
                  <td className="py-2.5 text-right font-semibold">{formatCurrency(d.total)}</td>
                  <td className="py-2.5 text-right">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: DEPT_COLORS[d.name] + '20', color: DEPT_COLORS[d.name] }}>
                      {totalPayroll > 0 ? ((d.total / totalPayroll) * 100).toFixed(1) : 0}%
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/30">
                <td className="py-2 font-bold text-xs uppercase">Total</td>
                <td className="py-2 text-right font-bold">{activeEmployees.length}</td>
                <td className="py-2 text-right font-bold">{formatCurrency(totalPayroll)}</td>
                <td className="py-2 text-right font-bold">100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={cardClass}>
          <h3 className="text-sm font-semibold mb-4 text-foreground">Top Earners</h3>
          <div className="space-y-2">
            {topEarners.map((emp, i) => (
              <div key={emp.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors">
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{emp.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{emp.title}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold">{redactedIds.has(emp.id) ? '●●●●●' : formatCurrency(emp.annual_salary)}</p>
                  <span className="text-[10px] rounded-full px-1.5 py-0.5" style={{ background: DEPT_COLORS[emp.department] + '25', color: DEPT_COLORS[emp.department] }}>
                    {emp.department}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}