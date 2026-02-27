import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, updateUserRole } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { ShieldCheck, User, Loader2 } from 'lucide-react';

export function UserManagement() {
    const queryClient = useQueryClient();
    const [promoting, setPromoting] = useState<string | null>(null);

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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" /> User Management
                </CardTitle>
                <CardDescription>
                    Promote or demote users to/from SUPERADMIN role
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
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.email}</TableCell>
                                    <TableCell>{user.name || '—'}</TableCell>
                                    <TableCell className="capitalize">{user.provider}</TableCell>
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
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={promoting === user.id}
                                            onClick={() => handleToggleRole(user.id, user.role)}
                                        >
                                            {promoting === user.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : user.role === 'SUPERADMIN' ? (
                                                'Demote to User'
                                            ) : (
                                                'Promote to Admin'
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
