import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import OrgEmployeeCard from '@/components/org/OrgEmployeeCard';
import EmployeeForm from '@/components/salary/EmployeeForm';
import { getDeptBgColor } from '@/lib/helpers';
import { Users } from 'lucide-react';

const deptLabels = { REVENUE: 'Revenue Management', ECOMM: 'E-Commerce', SALES: 'Sales & Marketing' };
const HOTEL_ORDER = ['AURA', 'H5A', 'INK48', 'LIFE', 'RENWICK', 'SMYTH', 'CORP'];

export default function OrgChart() {
  const [editEmp, setEditEmp] = useState(null);
  const qc = useQueryClient();

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });
  const { data: hotels = [] } = useQuery({ queryKey: ['hotels'], queryFn: () => base44.entities.Hotel.list() });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setEditEmp(null); },
  });

  const sortedHotels = [...hotels].sort((a, b) => HOTEL_ORDER.indexOf(a.short_code) - HOTEL_ORDER.indexOf(b.short_code));
  const departments = ['REVENUE', 'ECOMM', 'SALES'];
  const suppressedCount = employees.filter(e => e.suppressed).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Organization Chart</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Team structure grouped by department
          {suppressedCount > 0 && <span className="ml-2 text-amber-500 font-medium">· {suppressedCount} employee(s) suppressed</span>}
        </p>
      </div>

      <div className="space-y-8">
        {departments.map(dept => {
          const deptEmployees = employees.filter(e => e.department === dept);
          if (deptEmployees.length === 0) return null;
          const activeCount = deptEmployees.filter(e => !e.suppressed).length;
          return (
            <div key={dept}>
              <div className={`bg-gradient-to-r ${getDeptBgColor(dept)} rounded-2xl p-4 mb-4 shadow-sm`}>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-display font-bold">{deptLabels[dept]}</h3>
                    <p className="text-xs text-white/70">
                      {activeCount} active{deptEmployees.length !== activeCount ? ` · ${deptEmployees.length - activeCount} suppressed` : ''}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {deptEmployees.map(emp => (
                  <OrgEmployeeCard key={emp.id} employee={emp} onClick={setEditEmp} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {editEmp && (
        <EmployeeForm
          open={!!editEmp}
          onClose={() => setEditEmp(null)}
          onSave={(form) => updateMutation.mutate({ id: editEmp.id, data: form })}
          employee={editEmp}
          hotels={sortedHotels}
        />
      )}
    </div>
  );
}