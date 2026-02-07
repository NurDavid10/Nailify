import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DateTimePage from './pages/booking/DateTimePage';
import TreatmentPage from './pages/booking/TreatmentPage';
import DetailsPage from './pages/booking/DetailsPage';
import ConfirmPage from './pages/booking/ConfirmPage';
import SuccessPage from './pages/SuccessPage';
import AdminLayout from './components/layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import TreatmentsManagement from './pages/admin/TreatmentsManagement';
import AvailabilityManagement from './pages/admin/AvailabilityManagement';
import AppointmentsManagement from './pages/admin/AppointmentsManagement';
import SettingsPage from './pages/admin/SettingsPage';
import type { ReactNode } from 'react';

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
    element: <HomePage />,
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
  },
  {
    name: 'Booking - Date & Time',
    path: '/booking/date-time',
    element: <DateTimePage />,
  },
  {
    name: 'Booking - Treatment',
    path: '/booking/treatment',
    element: <TreatmentPage />,
  },
  {
    name: 'Booking - Details',
    path: '/booking/details',
    element: <DetailsPage />,
  },
  {
    name: 'Booking - Confirm',
    path: '/booking/confirm',
    element: <ConfirmPage />,
  },
  {
    name: 'Success',
    path: '/success',
    element: <SuccessPage />,
  },
  {
    name: 'Admin',
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        name: 'Dashboard',
        path: '/admin',
        element: <AdminDashboard />,
      },
      {
        name: 'Treatments',
        path: '/admin/treatments',
        element: <TreatmentsManagement />,
      },
      {
        name: 'Availability',
        path: '/admin/availability',
        element: <AvailabilityManagement />,
      },
      {
        name: 'Appointments',
        path: '/admin/appointments',
        element: <AppointmentsManagement />,
      },
      {
        name: 'Settings',
        path: '/admin/settings',
        element: <SettingsPage />,
      },
    ],
  },
];

export default routes;
