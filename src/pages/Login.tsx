import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast.error(t('login.errorEmpty'));
      return;
    }

    setIsSubmitting(true);
    const success = await login(apiKey);
    setIsSubmitting(false);

    if (success) {
      toast.success(t('login.success'));
      navigate('/admin');
    } else {
      toast.error(t('login.errorInvalid'));
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('login.backHome')}
        </Link>
        
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">{t('login.title')}</CardTitle>
            <CardDescription>{t('login.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">{t('login.apiKeyLabel')}</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={t('login.apiKeyPlaceholder')}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isSubmitting || isLoading}
                  className="h-11"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? t('login.verifying') : t('login.submit')}
              </Button>
            </form>
            
            <p className="mt-6 text-sm text-center text-muted-foreground">
              {t('login.adminOnly')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
