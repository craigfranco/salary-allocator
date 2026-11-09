import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, UserPlus, ShieldCheck, Users, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import InviteUserDialog from '@/components/admin/InviteUserDialog';
import UserRow from '@/components/admin/UserRow';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });
  const isAdmin = me?.role === 'admin';

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['app-users'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
    enabled: isAdmin,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['app-users'] });

  const handleRoleChange = async (user, role) => {
    await base44.entities.User.update(user.id, { role });
    toast({ title: 'Role updated', description: `${user.full_name || user.email} is now ${role === 'admin' ? 'an administrator' : 'a standard user'}.` });
    refresh();
  };

  const handleRemove = async (user) => {
    await base44.entities.User.delete(user.id);
    toast({ title: 'User removed', description: `${user.full_name || user.email} no longer has access.` });
    refresh();
  };

  if (meLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto mt-16 rounded-2xl border border-border bg-card p-8 text-center">
        <ShieldCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <h2 className="font-display text-xl font-bold text-foreground">Administrators only</h2>
        <p className="text-sm text-muted-foreground mt-2">
          User management is available to administrators. Ask an administrator if you need access.
        </p>
      </div>
    );
  }

  const term = search.trim().toLowerCase();
  const filtered = users.filter(u =>
    !term || (u.full_name || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term)
  );
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">User management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Invite people to the app, change their role, or remove access.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" /> Invite user
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Users className="w-3.5 h-3.5" /> Total users
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">{users.length}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5" /> Administrators
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">{adminCount}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Standard users</div>
          <div className="text-2xl font-bold text-foreground mt-1">{users.length - adminCount}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="pl-9 h-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {users.length === 0 ? 'No users yet — invite the first one.' : 'No users match your search.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Change role</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    isSelf={user.id === me?.id}
                    onRoleChange={(role) => handleRoleChange(user, role)}
                    onRemove={() => handleRemove(user)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <InviteUserDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={(email) => {
          toast({ title: 'Invite sent', description: `An invitation was emailed to ${email}.` });
          refresh();
        }}
      />
    </div>
  );
}