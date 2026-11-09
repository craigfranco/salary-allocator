import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, RefreshCw, Plus, ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import InviteUserDialog from '@/components/admin/InviteUserDialog';
import UserRow from '@/components/admin/UserRow';
import AccessDialog from '@/components/admin/AccessDialog';
import RoleDialog from '@/components/admin/RoleDialog';

const ACCOUNT_TABS = [
  { key: 'all', label: 'All' },
  { key: 'created', label: 'Account created' },
  { key: 'none', label: 'No account' },
];

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [accessUser, setAccessUser] = useState(null);
  const [roleUser, setRoleUser] = useState(null);
  const [savingAccess, setSavingAccess] = useState(false);

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });
  const isAdmin = me?.role === 'admin';

  const { data: users = [], isLoading, isFetching } = useQuery({
    queryKey: ['app-users'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
    enabled: isAdmin,
  });

  const { data: hotels = [] } = useQuery({
    queryKey: ['hotels-for-access'],
    queryFn: () => base44.entities.Hotel.list('name', 100),
    enabled: isAdmin,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['app-users'] });

  const handleSaveAccess = async (access) => {
    setSavingAccess(true);
    try {
      await base44.entities.User.update(accessUser.id, access);
      toast({ title: 'Access updated', description: `${accessUser.full_name || accessUser.email} now has the selected access.` });
      setAccessUser(null);
      refresh();
    } finally {
      setSavingAccess(false);
    }
  };

  const handleSaveRole = async (role) => {
    await base44.entities.User.update(roleUser.id, { role });
    toast({ title: 'Role updated', description: `${roleUser.full_name || roleUser.email} is now ${role === 'admin' ? 'an administrator' : 'a property user'}.` });
    setRoleUser(null);
    refresh();
  };

  const handleRemove = async (user) => {
    await base44.entities.User.delete(user.id);
    toast({ title: 'User removed', description: `${user.full_name || user.email} no longer has access.` });
    refresh();
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      if (accountFilter === 'created' && !u.is_verified) return false;
      if (accountFilter === 'none' && u.is_verified) return false;
      if (roleFilter !== 'all' && (u.role || 'user') !== roleFilter) return false;
      if (!term) return true;
      return (u.full_name || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term);
    });
  }, [users, search, accountFilter, roleFilter]);

  if (meLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto mt-16 rounded-2xl border border-[#e7ebf1] bg-white p-8 text-center">
        <ShieldCheck className="w-10 h-10 text-[#94a3b8] mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#0f172a]">Administrators only</h2>
        <p className="text-[13px] text-[#64748b] mt-2">
          User management is available to administrators. Ask an administrator if you need access.
        </p>
      </div>
    );
  }

  const activeCount = users.filter((u) => !u.disabled).length;

  return (
    <div className="rounded-xl border border-[#e7ebf1] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-[#eef2f6]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#f1f5f9] flex items-center justify-center">
            <Users className="w-4 h-4 text-[#475569]" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[#0f172a] leading-tight">User Management</h2>
            <p className="text-[11.5px] text-[#64748b] mt-0.5">Manage user roles, hotel access, and invitations</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-lg border-[#e2e8f0] text-[12px] font-semibold text-[#334155]"
          onClick={refresh}
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-[#eef2f6]">
        <span className="text-[12px] text-[#64748b]">
          <span className="font-semibold text-[#334155]">{users.length} users</span> · {activeCount} active
        </span>

        <div className="flex items-center rounded-lg bg-[#f1f5f9] p-0.5">
          {ACCOUNT_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setAccountFilter(tab.key)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors',
                accountFilter === tab.key
                  ? 'bg-white text-[#0f172a] shadow-sm'
                  : 'text-[#64748b] hover:text-[#334155]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users"
            className="h-8 w-[180px] rounded-lg border-[#e2e8f0] bg-white pl-8 text-[12px] shadow-none"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-8 w-[130px] rounded-lg border-[#e2e8f0] text-[12px] text-[#334155]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">Property user</SelectItem>
          </SelectContent>
        </Select>

        <Button
          size="sm"
          className="ml-auto h-8 gap-1.5 rounded-lg bg-[#1e293b] text-[12px] font-semibold text-white hover:bg-[#0f172a]"
          onClick={() => setInviteOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" /> Add User
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#94a3b8]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-[12.5px] text-[#94a3b8]">
          {users.length === 0 ? 'No users yet — add the first one.' : 'No users match this filter.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse">
            <thead>
              <tr className="bg-[#fafbfc]">
                {['Name', 'Role', 'Modules', 'Hotels', 'Status', 'Account', ''].map((h, i) => (
                  <th
                    key={h || i}
                    className={cn(
                      'px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]',
                      i === 6 ? 'text-right' : 'text-left'
                    )}
                  >
                    {h || 'Actions'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isSelf={user.id === me?.id}
                  onGrantAccess={() => setAccessUser(user)}
                  onEditRole={() => setRoleUser(user)}
                  onRemove={() => handleRemove(user)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InviteUserDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={(email) => {
          toast({ title: 'Invite sent', description: `An invitation was emailed to ${email}.` });
          refresh();
        }}
      />

      <AccessDialog
        open={!!accessUser}
        user={accessUser}
        hotels={hotels}
        saving={savingAccess}
        onClose={() => setAccessUser(null)}
        onSave={handleSaveAccess}
      />

      <RoleDialog
        open={!!roleUser}
        user={roleUser}
        onClose={() => setRoleUser(null)}
        onSave={handleSaveRole}
      />
    </div>
  );
}