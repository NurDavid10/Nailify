import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';

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

        // Call the setup-admin Edge Function
        const { data, error } = await supabase.functions.invoke('setup-admin', {
          method: 'POST',
        });

        if (error) {
          console.error('Admin setup error:', error);
          setSetupError(error.message);
        } else {
          console.log('Admin setup result:', data);
          sessionStorage.setItem('admin_setup_run', 'true');
          setSetupComplete(true);
        }
      } catch (error) {
        console.error('Failed to setup admin:', error);
        setSetupError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    setupAdmin();
  }, []);

  return { setupComplete, setupError };
}
