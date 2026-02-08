import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a secure random password
function generateSecurePassword(length = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => charset[byte % charset.length]).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if admin user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const adminExists = existingUser?.users?.some((user) => user.email === 'admin@nailsbooking.local');

    if (adminExists) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Admin user already exists',
          existed: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Generate a secure password for the admin user
    const securePassword = generateSecurePassword(16);

    // Create admin user with secure password
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'admin@nailsbooking.local',
      password: securePassword,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
      },
    });

    if (createError) {
      throw createError;
    }

    if (!newUser.user) {
      throw new Error('Failed to create user');
    }

    // Update profile to set admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', newUser.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Don't throw - user is created, profile will be synced by trigger
    }

    // Log the credentials securely (only visible in Edge Function logs)
    console.log('='.repeat(60));
    console.log('DEFAULT ADMIN CREDENTIALS (save these securely!)');
    console.log('Email:', 'admin@nailsbooking.local');
    console.log('Password:', securePassword);
    console.log('='.repeat(60));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Default admin user created successfully. Check Edge Function logs for credentials.',
        email: 'admin@nailsbooking.local',
        passwordHint: 'Check Supabase Edge Function logs for the generated password',
        existed: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
