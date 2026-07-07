// Agent Hub proxy — forwards requests with proper CORS headers
import { corsHeaders } from "../_shared/cors.ts";

const HUB_URL = "https://agent-hub-production-5ccf.up.railway.app";
const AUTH_TOKEN = "agent-hub-2026-secure";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetPath = url.pathname.replace("/functions/v1/agent-hub-proxy", "/api");
    const targetUrl = `${HUB_URL}${targetPath}${url.search}`;

    const proxyReq = new Request(targetUrl, {
      method: req.method,
      headers: {
        "Authorization": `Bearer ${AUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
    });

    const res = await fetch(proxyReq);
    const data = await res.text();

    return new Response(data, {
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
