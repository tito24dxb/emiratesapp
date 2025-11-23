import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RP_ID = typeof window !== 'undefined' ? window.location.hostname : "localhost";
const CHALLENGE_TTL = 5 * 60 * 1000; // 5 minutes

function generateChallenge(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
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

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's credentials
    const { data: credentials, error: credError } = await supabaseClient
      .from("webauthn_credentials")
      .select("credential_id, transports")
      .eq("user_id", userId)
      .eq("revoked", false);

    if (credError || !credentials || credentials.length === 0) {
      return new Response(
        JSON.stringify({ error: "No credentials found for user" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate challenge
    const challenge = generateChallenge();
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL);

    // Store challenge
    await supabaseClient.from("webauthn_challenges").insert({
      user_id: userId,
      challenge,
      type: "authentication",
      expires_at: expiresAt.toISOString(),
    });

    // Build authentication options
    const options = {
      challenge,
      timeout: 60000,
      rpId: RP_ID,
      allowCredentials: credentials.map((cred: any) => ({
        id: cred.credential_id,
        type: "public-key",
        transports: cred.transports || [],
      })),
      userVerification: "preferred",
      userId,
    };

    return new Response(JSON.stringify(options), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Login begin error:", error);
    return new Response(
      JSON.stringify({ error: "Login failed", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
