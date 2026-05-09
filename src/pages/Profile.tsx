import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, LogOut, ShieldCheck } from 'lucide-react';

export default function Profile() {
    const { user, updateProfile, logout, isSuperAdmin } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [name, setName] = useState(user?.name ?? '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsSaving(true);
        const ok = await updateProfile({ name: name.trim() });
        setIsSaving(false);
        if (ok) toast.success(t('profile.saved'));
        else toast.error(t('profile.saveFailed'));
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (!user) return null;

    const initials = (user.name ?? user.email)
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-16 max-w-lg">

                {/* Avatar */}
                <div className="flex flex-col items-center mb-10">
                    {user.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={user.name ?? user.email}
                            className="h-24 w-24 rounded-full object-cover ring-2 ring-accent/30 mb-4"
                        />
                    ) : (
                        <div className="h-24 w-24 rounded-full bg-secondary/40 flex items-center justify-center mb-4 ring-2 ring-accent/20">
                            <span className="font-display text-2xl font-semibold text-foreground/60">{initials}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <h1 className="font-display text-xl font-semibold">{user.name ?? user.email}</h1>
                        {isSuperAdmin && (
                            <span className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-accent/10 text-accent rounded-full">
                                <ShieldCheck className="h-3 w-3" />
                                Admin
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                    <p className="text-[11px] text-muted-foreground/50 mt-0.5 capitalize tracking-wide">
                        {user.provider} · {user.role.toLowerCase()}
                    </p>
                </div>

                {/* Edit form */}
                <form onSubmit={handleSave} className="space-y-5 border border-border/50 rounded-sm p-6 bg-card">
                    <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-accent" />
                        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em]">
                            {t('profile.editTitle')}
                        </h2>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="display-name" className="text-xs tracking-wide uppercase text-muted-foreground">
                            {t('profile.displayName')}
                        </Label>
                        <Input
                            id="display-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-11"
                            placeholder={user.email}
                        />
                    </div>

                    <Button type="submit" disabled={isSaving || !name.trim()} className="w-full h-11">
                        {isSaving ? t('common.saving') : t('profile.save')}
                    </Button>
                </form>

                {/* Admin shortcut */}
                {isSuperAdmin && (
                    <div className="mt-4">
                        <Button
                            variant="outline"
                            className="w-full h-11 text-xs tracking-[0.1em] uppercase font-bold"
                            onClick={() => navigate('/admin')}
                        >
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            {t('nav.admin')}
                        </Button>
                    </div>
                )}

                {/* Logout */}
                <div className="mt-4">
                    <Button
                        variant="ghost"
                        className="w-full h-11 text-xs tracking-[0.1em] uppercase font-bold text-muted-foreground hover:text-destructive"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('login.logout')}
                    </Button>
                </div>
            </main>
            <Footer />
        </div>
    );
}
