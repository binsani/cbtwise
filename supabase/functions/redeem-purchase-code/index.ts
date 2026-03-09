import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code }: { code: string } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Purchase code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const codeRegex = /^CBT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!codeRegex.test(code.toUpperCase())) {
      return new Response(
        JSON.stringify({ error: 'Invalid code format. Expected: CBT-XXXX-XXXX-XXXX' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Fetch the purchase code with assigned credentials
    const { data: purchaseCode, error: codeError } = await supabaseAdmin
      .from('purchase_codes')
      .select('*')
      .eq('code', code.toUpperCase())
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

    // Ensure the code has pre-assigned credentials
    if (!purchaseCode.assigned_email || !purchaseCode.assigned_password) {
      return new Response(
        JSON.stringify({ error: 'This code does not have assigned credentials. Please contact admin.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const email = purchaseCode.assigned_email;
    const password = purchaseCode.assigned_password;
    const fullName = purchaseCode.assigned_name || 'Student';

    // Check if user with this email already exists (code re-use attempt)
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers.users.some((u) => u.email === email);

    if (emailExists) {
      return new Response(
        JSON.stringify({ error: 'This code has already been activated. Please log in with your assigned credentials.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the user account with pre-assigned credentials
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (authError || !authData.user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: authError?.message || 'Failed to create account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create subscription
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
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: 'Failed to activate subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark code as used
    await supabaseAdmin
      .from('purchase_codes')
      .update({ status: 'used', used_by: authData.user.id, used_at: new Date().toISOString() })
      .eq('id', purchaseCode.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account activated successfully!',
        email,
        password,
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
