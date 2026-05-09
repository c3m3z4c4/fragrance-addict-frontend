import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, updateUserRole, adminUpdateUser } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ShieldCheck, User, Loader2, Pencil, Eye, EyeOff } from 'lucide-react';

interface ManagedUser {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    role: string;
    provider: string;
    is_active: boolean;
    created_at: string;
}

function EditUserDialog({
    user,
    open,
    onClose,
    onSaved,
}: {
    user: ManagedUser;
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [email, setEmail] = useState(user.email);
    const [newPassword, setNewPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const fields: { email?: string; newPassword?: string } = {};
        if (email.trim() && email !== user.email) fields.email = email.trim();
        if (newPassword.trim()) {
            if (newPassword.length < 8) {
                toast.error('Password must be at least 8 characters');
                return;
            }
            fields.newPassword = newPassword.trim();
        }
        if (Object.keys(fields).length === 0) {
            toast.info('No changes to save');
            return;
        }
        setSaving(true);
        const result = await adminUpdateUser(user.id, fields);
        setSaving(false);
        if (result.success) {
            toast.success('User updated');
            onSaved();
            onClose();
        } else {
            toast.error(result.error ?? 'Update failed');
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-display text-lg font-semibold">Edit User</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        {user.name || user.email} · {user.provider} · {user.role}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSave} className="space-y-5 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="edit-email" className="text-xs uppercase tracking-wide text-muted-foreground">
                            Email
                        </Label>
                        <Input
                            id="edit-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-10"
                            placeholder={user.email}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-pw" className="text-xs uppercase tracking-wide text-muted-foreground">
                            Reset Password <span className="normal-case text-muted-foreground/50">(leave blank to keep)</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="edit-pw"
                                type={showPw ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="h-10 pr-10"
                                placeholder="New password (min 8 chars)"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(!showPw)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving} className="flex-1">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function UserManagement() {
    const queryClient = useQueryClient();
    const [promoting, setPromoting] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: fetchUsers,
    });

    const roleMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: 'SUPERADMIN' | 'USER' }) =>
            updateUserRole(userId, role),
        onSuccess: (_ok, { userId, role }) => {
            if (_ok) {
                toast.success(`Role updated to ${role}`);
                queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            } else {
                toast.error('Failed to update role');
            }
            setPromoting(null);
        },
        onError: () => {
            toast.error('Failed to update role');
            setPromoting(null);
        },
    });

    const handleToggleRole = (userId: string, currentRole: string) => {
        const newRole = currentRole === 'SUPERADMIN' ? 'USER' : 'SUPERADMIN';
        setPromoting(userId);
        roleMutation.mutate({ userId, role: newRole });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" /> User Management
                    </CardTitle>
                    <CardDescription>
                        Edit email, reset passwords, and manage roles
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium text-sm">{user.email}</TableCell>
                                        <TableCell className="text-sm">{user.name || '—'}</TableCell>
                                        <TableCell className="capitalize text-sm">{user.provider}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={user.role === 'SUPERADMIN' ? 'default' : 'secondary'}
                                                className="flex w-fit items-center gap-1"
                                            >
                                                {user.role === 'SUPERADMIN' ? (
                                                    <ShieldCheck className="h-3 w-3" />
                                                ) : (
                                                    <User className="h-3 w-3" />
                                                )}
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:text-accent"
                                                    title="Edit user"
                                                    onClick={() => setEditingUser(user as ManagedUser)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={promoting === user.id}
                                                    onClick={() => handleToggleRole(user.id, user.role)}
                                                >
                                                    {promoting === user.id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : user.role === 'SUPERADMIN' ? (
                                                        'Demote'
                                                    ) : (
                                                        'Promote'
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {editingUser && (
                <EditUserDialog
                    user={editingUser}
                    open={!!editingUser}
                    onClose={() => setEditingUser(null)}
                    onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}
                />
            )}
        </>
    );
}
