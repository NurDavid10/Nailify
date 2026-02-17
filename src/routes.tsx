import { lazy, Suspense, type ReactNode } from 'react';

// Loading component for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Lazy load page components for better code-splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DateTimePage = lazy(() => import('./pages/booking/DateTimePage'));
const TreatmentPage = lazy(() => import('./pages/booking/TreatmentPage'));
const DetailsPage = lazy(() => import('./pages/booking/DetailsPage'));
const ConfirmPage = lazy(() => import('./pages/booking/ConfirmPage'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));

// Admin pages (separate chunk)
const AdminLayout = lazy(() => import('./components/layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const TreatmentsManagement = lazy(() => import('./pages/admin/TreatmentsManagement'));
const AvailabilityManagement = lazy(() => import('./pages/admin/AvailabilityManagement'));
const AppointmentsManagement = lazy(() => import('./pages/admin/AppointmentsManagement'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const CreateAppointment = lazy(() => import('./pages/admin/CreateAppointment'));
const AppearanceManagement = lazy(() => import('./pages/admin/AppearanceManagement'));

// Wrapper component for lazy-loaded pages
const LazyPage = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  children?: RouteConfig[];
}

const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    element: <LazyPage><HomePage /></LazyPage>,
  },
  {
    name: 'Login',
    path: '/login',
    element: <LazyPage><LoginPage /></LazyPage>,
  },
  {
    name: 'Booking - Date & Time',
    path: '/booking/date-time',
    element: <LazyPage><DateTimePage /></LazyPage>,
  },
  {
    name: 'Booking - Treatment',
    path: '/booking/treatment',
    element: <LazyPage><TreatmentPage /></LazyPage>,
  },
  {
    name: 'Booking - Details',
    path: '/booking/details',
    element: <LazyPage><DetailsPage /></LazyPage>,
  },
  {
    name: 'Booking - Confirm',
    path: '/booking/confirm',
    element: <LazyPage><ConfirmPage /></LazyPage>,
  },
  {
    name: 'Success',
    path: '/success',
    element: <LazyPage><SuccessPage /></LazyPage>,
  },
  {
    name: 'Not Found',
    path: '/404',
    element: <LazyPage><NotFoundPage /></LazyPage>,
  },
  {
    name: 'Admin',
    path: '/admin',
    element: <LazyPage><AdminLayout /></LazyPage>,
    children: [
      {
        name: 'Dashboard',
        path: '/admin',
        element: <LazyPage><AdminDashboard /></LazyPage>,
      },
      {
        name: 'Treatments',
        path: '/admin/treatments',
        element: <LazyPage><TreatmentsManagement /></LazyPage>,
      },
      {
        name: 'Availability',
        path: '/admin/availability',
        element: <LazyPage><AvailabilityManagement /></LazyPage>,
      },
      {
        name: 'Appointments',
        path: '/admin/appointments',
        element: <LazyPage><AppointmentsManagement /></LazyPage>,
      },
      {
        name: 'Create Appointment',
        path: '/admin/create-appointment',
        element: <LazyPage><CreateAppointment /></LazyPage>,
      },
      {
        name: 'Appearance',
        path: '/admin/backgrounds',
        element: <LazyPage><AppearanceManagement /></LazyPage>,
      },
      {
        name: 'Settings',
        path: '/admin/settings',
        element: <LazyPage><SettingsPage /></LazyPage>,
      },
    ],
  },
];

export default routes;
