import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RP_NAME = "Crews Academy";
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

    const { userId, deviceName, firebaseToken } = await req.json();

    if (!userId || !deviceName || !firebaseToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify Firebase token (basic check - in production you'd verify the signature)
    if (!firebaseToken || firebaseToken.length < 10) {
      return new Response(
        JSON.stringify({ error: "Invalid Firebase token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing credentials for this user
    const { data: existingCreds } = await supabaseClient
      .from("webauthn_credentials")
      .select("credential_id, transports")
      .eq("user_id", userId)
      .eq("revoked", false);

    const excludeCredentials = (existingCreds || []).map((cred: any) => ({
      id: cred.credential_id,
      type: "public-key",
      transports: cred.transports || [],
    }));

    // Generate challenge
    const challenge = generateChallenge();
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL);

    // Store challenge
    await supabaseClient.from("webauthn_challenges").insert({
      user_id: userId,
      challenge,
      type: "registration",
      expires_at: expiresAt.toISOString(),
    });

    // Generate registration options
    const options = {
      rp: {
        name: RP_NAME,
        id: RP_ID,
      },
      user: {
        id: btoa(userId).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
        name: userId,
        displayName: deviceName,
      },
      challenge,
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },  // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      timeout: 60000,
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        requireResidentKey: false,
        residentKey: "preferred",
        userVerification: "preferred",
      },
      attestation: "none",
    };

    return new Response(JSON.stringify(options), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Registration begin error:", error);
    return new Response(
      JSON.stringify({ error: "Registration failed", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
