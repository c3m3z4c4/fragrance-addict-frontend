import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const { t } = useTranslation();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [iosPromptShown, setIosPromptShown] = useState(false);

  useEffect(() => {
    // Detect iOS (Safari doesn't fire beforeinstallprompt)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    const standalone = (window.navigator as any).standalone === true;
    setIsIOS(ios && !standalone);

    // Android / Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('pwa-prompt-dismissed');
    if (stored) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    setInstallEvent(null);
    localStorage.setItem('pwa-prompt-dismissed', '1');
  };

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'accepted') setInstallEvent(null);
    else handleDismiss();
  };

  // Already installed or user dismissed
  if (dismissed) return null;

  // iOS: show manual instruction banner
  if (isIOS && !iosPromptShown) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
        <div className="rounded-xl border border-border/60 bg-background/95 backdrop-blur-sm shadow-xl p-4">
          <button onClick={() => { setIosPromptShown(true); handleDismiss(); }}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
          <div className="flex items-start gap-3">
            <img src="/icon-72x72.png" alt="Parfumería" className="w-12 h-12 rounded-xl flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Instalar Parfumería</p>
              <p className="text-xs text-muted-foreground mt-1">
                Toca <strong>Compartir</strong> <span className="text-base">⎙</span> y luego{' '}
                <strong>"Agregar a pantalla de inicio"</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android / Chrome: native install prompt available
  if (!installEvent) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="rounded-xl border border-border/60 bg-background/95 backdrop-blur-sm shadow-xl p-4">
        <button onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X size={16} />
        </button>
        <div className="flex items-center gap-3 mb-3">
          <img src="/icon-72x72.png" alt="Parfumería" className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">Instalar Parfumería</p>
            <p className="text-xs text-muted-foreground">Acceso rápido desde tu pantalla de inicio</p>
          </div>
        </div>
        <Button onClick={handleInstall} size="sm" className="w-full gap-2">
          <Download size={14} />
          Instalar aplicación
        </Button>
      </div>
    </div>
  );
}
