import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
}

// Please add the pages that can be accessed without logging in to PUBLIC_ROUTES.
const PUBLIC_ROUTES = ['/login', '/403', '/404', '/', '/booking/*', '/success'];
const ADMIN_ROUTES = ['/admin', '/admin/*'];

function matchRoute(path: string, patterns: string[]) {
  return patterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(path);
    }
    return path === pattern;
  });
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const isPublic = matchRoute(location.pathname, PUBLIC_ROUTES);
    const isAdmin = matchRoute(location.pathname, ADMIN_ROUTES);

    if (!profile && !isPublic) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }

    // Redirect non-admin users away from admin routes
    if (isAdmin && (!profile || profile?.role !== 'admin')) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
    }
  }, [profile, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}