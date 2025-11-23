import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey",
};

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    const code = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
      .match(/.{1,4}/g)!
      .join('-');
    codes.push(code);
  }
  return codes;
}

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, credential, deviceName, firebaseToken } = await req.json();

    if (!userId || !credential || !deviceName || !firebaseToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify Firebase token
    if (!firebaseToken || firebaseToken.length < 10) {
      return new Response(
        JSON.stringify({ error: "Invalid Firebase token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify challenge exists and not expired
    const { data: challengeData } = await supabaseClient
      .from("webauthn_challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "registration")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!challengeData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired challenge" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store credential
    const { error: credError } = await supabaseClient
      .from("webauthn_credentials")
      .insert({
        user_id: userId,
        credential_id: credential.id,
        public_key: credential.response.attestationObject,
        counter: 0,
        device_name: deviceName,
        transports: credential.response.transports || [],
        revoked: false,
      });

    if (credError) {
      console.error("Error storing credential:", credError);
      return new Response(
        JSON.stringify({ error: "Failed to store credential" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();
    
    // Store hashed backup codes
    for (const code of backupCodes) {
      const hash = await hashCode(code);
      await supabaseClient.from("backup_codes").insert({
        user_id: userId,
        code_hash: hash,
        used: false,
      });
    }

    // Delete used challenge
    await supabaseClient
      .from("webauthn_challenges")
      .delete()
      .eq("id", challengeData.id);

    return new Response(
      JSON.stringify({
        success: true,
        backupCodes,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Registration complete error:", error);
    return new Response(
      JSON.stringify({ error: "Registration failed", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
