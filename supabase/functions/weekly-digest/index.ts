/**
 * AI Weekly Digest — generates a natural-language summary of your week
 * using Gemini. Called from the frontend with auth context.
 *
 * Usage: POST /functions/v1/weekly-digest
 * Headers: Authorization: Bearer <supabase_token>
 * Response: { summary: string, highlights: string[], stats: {...} }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";

interface ActivityRow {
  type: string;
  date: string;
  todo?: { text?: string; done?: boolean };
  venture?: { name?: string };
  goal?: { title?: string };
  application?: { company?: string; role?: string };
  deal?: { name?: string };
  transaction?: { name?: string; amount?: number; kind?: string };
  call_log?: { who?: string; outcome?: string };
  tracker_log?: { note?: string; value?: number };
  routine_check?: Record<string, unknown>;
  page?: { title?: string };
  link?: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the user's sales_id
    const { data: sales } = await supabase
      .from("sales")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!sales) {
      return new Response(JSON.stringify({ error: "No CRM user found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch recent activity
    const { data: activity } = await supabase
      .from("activity_log")
      .select("*")
      .eq("sales_id", sales.id)
      .gte("date", oneWeekAgo)
      .order("date", { ascending: false })
      .limit(100);

    // Fetch current state
    const { data: todos } = await supabase
      .from("todos")
      .select("id, text, done, due_date, priority")
      .eq("sales_id", sales.id);

    const { data: goals } = await supabase
      .from("goals")
      .select("id, title, status")
      .eq("sales_id", sales.id);

    const { data: ventures } = await supabase
      .from("ventures")
      .select("id, name, status")
      .eq("sales_id", sales.id);

    const { data: apps } = await supabase
      .from("applications")
      .select("id, company, role, status")
      .eq("sales_id", sales.id);

    // Build the prompt
    const openTodos = (todos ?? []).filter((t) => !t.done);
    const doneTodos = (todos ?? []).filter((t) => t.done);
    const activeGoals = (goals ?? []).filter((g) => g.status === "active");
    const activeVentures = (ventures ?? []).filter((v) => v.status === "building" || v.status === "idea");

    const prompt = `You are a thoughtful personal assistant helping someone reflect on their week.

Here is their data from the past 7 days:

RECENT ACTIVITY (${activity?.length ?? 0} events):
${(activity ?? []).slice(0, 50).map((a: ActivityRow) => {
  const label = (() => {
    switch (a.type) {
      case "todo.created": return `Created to-do: "${a.todo?.text ?? '...'}"`;
      case "todo.completed": return `Completed to-do: "${a.todo?.text ?? '...'}"`;
      case "goal.created": return `Set goal: "${a.goal?.title ?? '...'}"`;
      case "venture.created": return `Started venture: "${a.venture?.name ?? '...'}"`;
      case "application.created": return `Tracked job: ${a.application?.company ?? '...'}${a.application?.role ? ` (${a.application.role})` : ''}`;
      case "focus.completed": return "Completed a focus session";
      case "routine.checked": return "Checked off a routine step";
      case "tracker.logged": return "Logged a tracker entry";
      case "transaction.created": return `${a.transaction?.kind === 'income' ? '💰' : '💸'} ${a.transaction?.name ?? 'Transaction'}: $${a.transaction?.amount ?? 0}`;
      case "call.logged": return `Logged a call with ${a.call_log?.who || 'someone'}: ${a.call_log?.outcome || 'no outcome'}`;
      case "page.created": return `Created page: "${a.page?.title ?? '...'}"`;
      case "link.created": return "Made a new connection between entities";
      default: return a.type;
    }
  })();
  return `- ${label}`;
}).join("\n")}

CURRENT STATE:
- Open to-dos: ${openTodos.length} (${openTodos.slice(0, 10).map((t) => t.text).join("; ")}${openTodos.length > 10 ? '...' : ''})
- Completed this week: ${doneTodos.length}
- Active goals: ${activeGoals.length} (${activeGoals.map((g) => g.title).join(", ")})
- Active ventures: ${activeVentures.length} (${activeVentures.map((v) => v.name).join(", ")})
- Job applications: ${apps?.length ?? 0}

Please write a warm, encouraging weekly digest in 3-4 paragraphs. Include:
1. A brief overview of what happened this week
2. 2-3 specific highlights or wins
3. A gentle suggestion for what to focus on next week
4. End with an encouraging note

Keep it concise but personal. Use a warm, supportive tone. Do NOT use markdown headings — just plain paragraphs.`;

    // Call Gemini
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
        }),
      },
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      return new Response(JSON.stringify({ error: `Gemini API error: ${err}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiRes.json();
    const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "Could not generate digest.";

    return new Response(
      JSON.stringify({
        summary,
        highlights: [
          `${doneTodos.length} to-dos completed`,
          `${activeGoals.length} active goals`,
          `${activeVentures.length} active ventures`,
        ],
        stats: {
          activityCount: activity?.length ?? 0,
          openTodos: openTodos.length,
          doneTodos: doneTodos.length,
          activeGoals: activeGoals.length,
          activeVentures: activeVentures.length,
          applications: apps?.length ?? 0,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
