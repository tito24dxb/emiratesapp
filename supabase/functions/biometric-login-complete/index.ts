import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey",
};

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

    const { userId, credential } = await req.json();

    if (!userId || !credential) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify challenge exists and not expired
    const { data: challengeData } = await supabaseClient
      .from("webauthn_challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "authentication")
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

    // Verify credential exists and is not revoked
    const { data: storedCred } = await supabaseClient
      .from("webauthn_credentials")
      .select("*")
      .eq("credential_id", credential.id)
      .eq("user_id", userId)
      .eq("revoked", false)
      .single();

    if (!storedCred) {
      return new Response(
        JSON.stringify({ error: "Credential not found or revoked" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update credential last_used and counter
    await supabaseClient
      .from("webauthn_credentials")
      .update({
        last_used: new Date().toISOString(),
        counter: (storedCred.counter || 0) + 1,
      })
      .eq("id", storedCred.id);

    // Delete used challenge
    await supabaseClient
      .from("webauthn_challenges")
      .delete()
      .eq("id", challengeData.id);

    // Return success with user ID (client will handle Firebase auth)
    return new Response(
      JSON.stringify({
        success: true,
        userId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Login complete error:", error);
    return new Response(
      JSON.stringify({ error: "Login failed", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
