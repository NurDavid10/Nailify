import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Header } from '@/components/Header';
import routes from './routes';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { RouteGuard } from '@/components/common/RouteGuard';
import { Toaster } from '@/components/ui/toaster';

const App: React.FC = () => {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <RouteGuard>
            <IntersectObserver />
            <div className="flex flex-col min-h-screen">
              <Routes>
                {routes.map((route, index) => {
                  if (route.children) {
                    return (
                      <Route key={index} path={route.path} element={route.element}>
                        {route.children.map((child, childIndex) => (
                          <Route
                            key={childIndex}
                            path={child.path}
                            element={child.element}
                            index={child.path === route.path}
                          />
                        ))}
                      </Route>
                    );
                  }
                  
                  const isAdminRoute = route.path.startsWith('/admin');
                  const element = isAdminRoute ? (
                    route.element
                  ) : (
                    <>
                      <Header />
                      <main className="flex-grow">{route.element}</main>
                    </>
                  );
                  
                  return (
                    <Route
                      key={index}
                      path={route.path}
                      element={element}
                    />
                  );
                })}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <Toaster />
          </RouteGuard>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
};

export default App;
