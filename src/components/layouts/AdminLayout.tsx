import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Sparkles,
  Calendar,
  Clock,
  Settings,
  Menu,
  LogOut,
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const navigation = [
  { name: 'admin.dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'admin.treatments', href: '/admin/treatments', icon: Sparkles },
  { name: 'admin.availability', href: '/admin/availability', icon: Clock },
  { name: 'admin.appointments', href: '/admin/appointments', icon: Calendar },
  { name: 'admin.settings', href: '/admin/settings', icon: Settings },
];

function Sidebar() {
  const { t } = useLanguage();
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">{t('app.name')}</span>
        </Link>
      </div>
      <Separator />
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link key={item.href} to={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className="w-full justify-start gap-3"
              >
                <item.icon className="h-5 w-5" />
                {t(item.name)}
              </Button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function AdminLayout() {
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-border/50 bg-background">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="border-b border-border/50 bg-background">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-4">
                {/* Mobile Menu */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0">
                    <Sidebar />
                  </SheetContent>
                </Sheet>
                <h1 className="text-xl font-semibold">{t('common.admin')}</h1>
              </div>

              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <Button onClick={handleLogout} variant="ghost" size="sm" className="gap-2">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('common.logout')}</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
