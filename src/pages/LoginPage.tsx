import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth, getProfile } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { t } = useLanguage();
  const { signIn, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: t('auth.loginError'),
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
    } else {
      toast({
        title: t('common.success'),
        description: t('auth.loginButton'),
      });
      // Only redirect to admin routes if the user is actually an admin.
      // Otherwise always go to home to prevent a redirect loop with RouteGuard.
      const isAdminTarget = from === '/admin' || from.startsWith('/admin/');
      const { data: { session } } = await supabase.auth.getSession();
      const isAdmin = session?.user
        ? (await getProfile(session.user.id))?.role === 'admin'
        : false;

      navigate(isAdminTarget && isAdmin ? from : '/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Image panel — desktop only */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        <img
          src="/salon/IMG_8393.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="relative z-10 flex items-end p-12">
          <div className="text-white">
            <Sparkles className="h-10 w-10 mb-4" />
            <h2 className="text-3xl font-bold">{t('app.name')}</h2>
          </div>
        </div>
      </div>

      {/* Mobile image banner */}
      <div className="md:hidden h-40 relative overflow-hidden">
        <img
          src="/salon/IMG_8393.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-lg border-border/50">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center md:hidden">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">{t('auth.loginTitle')}</CardTitle>
            <CardDescription>{t('app.name')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('common.loading') : t('auth.loginButton')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
