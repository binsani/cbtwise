import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RedemptionRequest {
  code: string;
  email: string;
  password: string;
  fullName: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, email, password, fullName }: RedemptionRequest = await req.json();

    // Validate inputs
    if (!code || !email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate code format (CBT-XXXX-XXXX-XXXX)
    const codeRegex = /^CBT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!codeRegex.test(code)) {
      return new Response(
        JSON.stringify({ error: 'Invalid code format. Expected format: CBT-XXXX-XXXX-XXXX' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if code exists and is active
    const { data: purchaseCode, error: codeError } = await supabaseAdmin
      .from('purchase_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (codeError || !purchaseCode) {
      return new Response(
        JSON.stringify({ error: 'Invalid purchase code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (purchaseCode.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'This purchase code has already been used or cancelled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUser.users.some(u => u.email === email);
    
    if (emailExists) {
      return new Response(
        JSON.stringify({ error: 'An account with this email already exists. Please login instead.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new user account with auto-confirmed email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError || !authData.user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: authError?.message || 'Failed to create account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create subscription for the user
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + purchaseCode.duration_days);

    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: authData.user.id,
        plan: `${purchaseCode.duration_days}-day Premium`,
        status: 'active',
        starts_at: new Date().toISOString(),
        ends_at: endsAt.toISOString(),
        payment_reference: `CODE:${code}`,
      });

    if (subError) {
      console.error('Subscription error:', subError);
      // Rollback: delete the created user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: 'Failed to activate subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark code as used
    const { error: updateError } = await supabaseAdmin
      .from('purchase_codes')
      .update({
        status: 'used',
        used_by: authData.user.id,
        used_at: new Date().toISOString(),
      })
      .eq('id', purchaseCode.id);

    if (updateError) {
      console.error('Code update error:', updateError);
    }

    // Create session for the user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (sessionError) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Account created successfully. Please log in with your credentials.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account created and premium access activated!',
        user: authData.user,
        session: sessionData,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});