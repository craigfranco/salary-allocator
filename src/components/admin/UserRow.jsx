import React from 'react';
import { Button } from '@/components/ui/button';
import { KeyRound, Pencil, Trash2, Circle, FileText } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ModulesCell, HotelsCell } from '@/components/admin/AccessSummary';

export default function UserRow({ user, isSelf, onGrantAccess, onEditRole, onRemove }) {
  const isAdmin = user.role === 'admin';
  const active = !user.disabled;

  return (
    <tr className="border-t border-[#f1f5f9] hover:bg-[#fafbfc] transition-colors">
      <td className="px-4 py-3">
        <div className="text-[13px] font-semibold text-[#0f172a]">
          {user.full_name || 'Unnamed user'}
          {isSelf && <span className="ml-2 rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] font-semibold text-[#64748b]">You</span>}
        </div>
        <div className="text-[11.5px] text-[#94a3b8]">{user.email}</div>
      </td>
      <td className="px-4 py-3">
        {isAdmin ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#1e293b] px-2 py-0.5 text-[10.5px] font-semibold text-white">
            <Circle className="w-2 h-2 fill-current" /> Admin
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10.5px] font-semibold text-[#334155]">
            <FileText className="w-2.5 h-2.5" /> Property user
          </span>
        )}
      </td>
      <td className="px-4 py-3"><ModulesCell modules={user.modules} /></td>
      <td className="px-4 py-3"><HotelsCell hotels={user.hotels} /></td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
          active ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]'
        }`}>
          {active ? 'Active' : 'Disabled'}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
          user.is_verified ? 'bg-[#ecfdf5] text-[#15803d]' : 'bg-[#fef3c7] text-[#92400e]'
        }`}>
          {user.is_verified ? 'Account Created' : 'No account'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-[#94a3b8] hover:text-[#334155]" title="Grant access" onClick={() => onGrantAccess()}>
            <KeyRound className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-[#94a3b8] hover:text-[#334155]" title="Edit role" onClick={() => onEditRole()}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[#94a3b8] hover:text-destructive disabled:opacity-40"
                disabled={isSelf}
                title={isSelf ? 'You cannot remove your own account' : 'Remove user'}
              >
                <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      </td>
    </tr>
  );
}