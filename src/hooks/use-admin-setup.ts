import { useEffect, useState } from 'react';
import { api } from '@/db/client';

export function useAdminSetup() {
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    const setupAdmin = async () => {
      try {
        // Check if setup has already been run in this session
        const setupRun = sessionStorage.getItem('admin_setup_run');
        if (setupRun === 'true') {
          setSetupComplete(true);
          return;
        }

        // Call the admin setup endpoint
        const data = await api.post('/admin/setup', {});

        console.log('Admin setup result:', data);
        sessionStorage.setItem('admin_setup_run', 'true');
        setSetupComplete(true);
      } catch (error) {
        console.error('Failed to setup admin:', error);
        // If it's already setup, that's fine - mark as complete
        if (error instanceof Error && error.message.includes('already been completed')) {
          sessionStorage.setItem('admin_setup_run', 'true');
          setSetupComplete(true);
        } else {
          setSetupError(error instanceof Error ? error.message : 'Unknown error');
        }
      }
    };

    setupAdmin();
  }, []);

  return { setupComplete, setupError };
}
