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
import { User, LogOut, ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { updateMyEmail, updateMyPassword } from '@/lib/api';

function Section({ icon: Icon, title, children }: {
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-5 border border-border/50 rounded-sm p-6 bg-card">
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-accent" />
                <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em]">{title}</h2>
            </div>
            {children}
        </div>
    );
}

export default function Profile() {
    const { user, updateProfile, logout, isSuperAdmin } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Display name
    const [name, setName] = useState(user?.name ?? '');
    const [savingName, setSavingName] = useState(false);

    // Email
    const [email, setEmail] = useState(user?.email ?? '');
    const [savingEmail, setSavingEmail] = useState(false);

    // Password
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [savingPw, setSavingPw] = useState(false);

    const handleSaveName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSavingName(true);
        const ok = await updateProfile({ name: name.trim() });
        setSavingName(false);
        if (ok) toast.success(t('profile.saved'));
        else toast.error(t('profile.saveFailed'));
    };

    const handleSaveEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || email === user?.email) return;
        setSavingEmail(true);
        const result = await updateMyEmail(email.trim());
        setSavingEmail(false);
        if (result.success) {
            await updateProfile({ email: email.trim() });
            toast.success(t('profile.emailSaved'));
        } else {
            toast.error(result.error ?? t('profile.emailFailed'));
        }
    };

    const handleSavePw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPw.length < 8) {
            toast.error(t('profile.pwTooShort'));
            return;
        }
        if (newPw !== confirmPw) {
            toast.error(t('profile.pwMismatch'));
            return;
        }
        setSavingPw(true);
        const result = await updateMyPassword(currentPw, newPw);
        setSavingPw(false);
        if (result.success) {
            toast.success(t('profile.pwSaved'));
            setCurrentPw('');
            setNewPw('');
            setConfirmPw('');
        } else {
            toast.error(result.error ?? t('profile.pwFailed'));
        }
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

    const isGoogleUser = user.provider === 'google';

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-16 max-w-lg">

                {/* Avatar */}
                <div className="flex flex-col items-center mb-10">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name ?? user.email}
                            className="h-24 w-24 rounded-full object-cover ring-2 ring-accent/30 mb-4" />
                    ) : (
                        <div className="h-24 w-24 rounded-full bg-secondary/40 flex items-center justify-center mb-4 ring-2 ring-accent/20">
                            <span className="font-display text-2xl font-semibold text-foreground/60">{initials}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <h1 className="font-display text-xl font-semibold">{user.name ?? user.email}</h1>
                        {isSuperAdmin && (
                            <span className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-accent/10 text-accent rounded-full">
                                <ShieldCheck className="h-3 w-3" /> Admin
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                    <p className="text-[11px] text-muted-foreground/50 mt-0.5 capitalize tracking-wide">
                        {user.provider} · {user.role.toLowerCase()}
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Display name */}
                    <Section icon={User} title={t('profile.editTitle')}>
                        <form onSubmit={handleSaveName} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="display-name" className="text-xs tracking-wide uppercase text-muted-foreground">
                                    {t('profile.displayName')}
                                </Label>
                                <Input id="display-name" value={name} onChange={(e) => setName(e.target.value)}
                                    className="h-11" placeholder={user.email} />
                            </div>
                            <Button type="submit" disabled={savingName || !name.trim()} className="w-full h-11">
                                {savingName ? t('common.saving') : t('profile.save')}
                            </Button>
                        </form>
                    </Section>

                    {/* Change email */}
                    <Section icon={Mail} title={t('profile.changeEmail')}>
                        {isGoogleUser ? (
                            <p className="text-xs text-muted-foreground/60 leading-relaxed">
                                {t('profile.googleEmailNote')}
                            </p>
                        ) : (
                            <form onSubmit={handleSaveEmail} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-email" className="text-xs tracking-wide uppercase text-muted-foreground">
                                        {t('profile.newEmail')}
                                    </Label>
                                    <Input id="new-email" type="email" value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-11" placeholder="nuevo@email.com" />
                                </div>
                                <Button type="submit"
                                    disabled={savingEmail || !email.trim() || email === user.email}
                                    className="w-full h-11">
                                    {savingEmail ? t('common.saving') : t('profile.saveEmail')}
                                </Button>
                            </form>
                        )}
                    </Section>

                    {/* Change password */}
                    <Section icon={Lock} title={t('profile.changePassword')}>
                        {isGoogleUser ? (
                            <p className="text-xs text-muted-foreground/60 leading-relaxed">
                                {t('profile.googlePwNote')}
                            </p>
                        ) : (
                            <form onSubmit={handleSavePw} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current-pw" className="text-xs tracking-wide uppercase text-muted-foreground">
                                        {t('profile.currentPassword')}
                                    </Label>
                                    <div className="relative">
                                        <Input id="current-pw" type={showPw ? 'text' : 'password'}
                                            value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                                            className="h-11 pr-10" placeholder="••••••••" />
                                        <button type="button" onClick={() => setShowPw(!showPw)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-pw" className="text-xs tracking-wide uppercase text-muted-foreground">
                                        {t('profile.newPassword')}
                                    </Label>
                                    <Input id="new-pw" type={showPw ? 'text' : 'password'}
                                        value={newPw} onChange={(e) => setNewPw(e.target.value)}
                                        className="h-11" placeholder="••••••••" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-pw" className="text-xs tracking-wide uppercase text-muted-foreground">
                                        {t('profile.confirmPassword')}
                                    </Label>
                                    <Input id="confirm-pw" type={showPw ? 'text' : 'password'}
                                        value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                                        className="h-11" placeholder="••••••••" />
                                </div>
                                <Button type="submit"
                                    disabled={savingPw || !newPw || !confirmPw}
                                    className="w-full h-11">
                                    {savingPw ? t('common.saving') : t('profile.savePw')}
                                </Button>
                            </form>
                        )}
                    </Section>
                </div>

                {/* Admin shortcut */}
                {isSuperAdmin && (
                    <div className="mt-4">
                        <Button variant="outline" className="w-full h-11 text-xs tracking-[0.1em] uppercase font-bold"
                            onClick={() => navigate('/admin')}>
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            {t('nav.admin')}
                        </Button>
                    </div>
                )}

                {/* Logout */}
                <div className="mt-4">
                    <Button variant="ghost"
                        className="w-full h-11 text-xs tracking-[0.1em] uppercase font-bold text-muted-foreground hover:text-destructive"
                        onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('login.logout')}
                    </Button>
                </div>
            </main>
            <Footer />
        </div>
    );
}
