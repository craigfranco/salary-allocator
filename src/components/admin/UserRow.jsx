import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const initials = (user) => (user.full_name || user.email || '?')
  .trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();

const formatDate = (value) => value
  ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—';

export default function UserRow({ user, isSelf, onRoleChange, onRemove }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
            {initials(user)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">
              {user.full_name || 'Unnamed user'}
              {isSelf && <Badge variant="secondary" className="ml-2 text-[10px]">You</Badge>}
            </div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {user.role === 'admin'
          ? <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-primary/20">Administrator</Badge>
          : <Badge variant="secondary">Standard user</Badge>}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Select value={user.role || 'user'} onValueChange={onRoleChange} disabled={isSelf}>
          <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Standard user</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
        {formatDate(user.created_date)}
      </TableCell>
      <TableCell className="text-right">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isSelf} title={isSelf ? 'You cannot remove your own account' : 'Remove user'}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this user?</AlertDialogTitle>
              <AlertDialogDescription>
                {user.full_name || user.email} will lose access to this app. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onRemove}>
                Remove user
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}