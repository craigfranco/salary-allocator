import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RoleDialog({ open, user, onClose, onSave }) {
  const [role, setRole] = useState('user');

  useEffect(() => {
    if (open && user) setRole(user.role || 'user');
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-bold text-[#0f172a]">Edit role</DialogTitle>
          <DialogDescription className="text-[12px] text-[#64748b]">
            {user?.full_name || user?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-10 rounded-lg border-[#dfe6ec]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Property user</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11.5px] text-[#64748b]">
            Admins can see and change all data and manage users.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" className="bg-[#1e293b] hover:bg-[#0f172a] text-white" onClick={() => onSave(role)}>
            Save role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}