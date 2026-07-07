// Agent Hub CORS proxy — simple passthrough
import { corsHeaders } from "../_shared/cors.ts";

const HUB_URL = "https://agent-hub-production-5ccf.up.railway.app";
const AUTH_TOKEN = Deno.env.get("AGENT_HUB_TOKEN") || "agent-hub-2026-secure";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  // Map: /functions/v1/agent-hub-proxy/health → /api/health
  // Map: /functions/v1/agent-hub-proxy/tasks → /api/tasks  
  // Map: /functions/v1/agent-hub-proxy/tasks/ID → /api/tasks/ID
  const suffix = url.pathname.replace(/^.*\/agent-hub-proxy\/?/, "");
  const targetUrl = `${HUB_URL}/api/${suffix}`;

  try {
    const res = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Authorization": `Bearer ${AUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
    });

    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
