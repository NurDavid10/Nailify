import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, LogOut } from 'lucide-react';

export function Header() {
  const { t } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">{t('app.name')}</span>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            
            {user ? (
              <div className="flex items-center gap-3">
                {profile?.role === 'admin' && (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/admin">{t('common.admin')}</Link>
                  </Button>
                )}
                <Button onClick={handleLogout} variant="ghost" size="sm" className="gap-2">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('common.logout')}</span>
                </Button>
              </div>
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">{t('common.login')}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
