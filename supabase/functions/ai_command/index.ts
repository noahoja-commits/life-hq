// Natural-language command endpoint for the Cmd-K palette.
// Auth: default JWT verification — only signed-in users can call it.
// Uses Google Gemini (free tier) via GEMINI_API_KEY edge secret.

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
const MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const weekdayOf = (iso: string) => {
  try {
    return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    });
  } catch {
    return "";
  }
};

const systemPrompt = (today: string, snapshot?: unknown) => `You are the command parser and assistant for "Life HQ", a personal life OS. Today is ${today}${weekdayOf(today) ? ` (a ${weekdayOf(today)})` : ""}.
The app has these sections (paths): Dashboard "/", To-Dos "/todos", Jobs "/applications", People "/contacts", Places "/companies", Projects "/deals", Track "/track", Focus "/focus", Lists "/lists", Routines "/routines", Ventures "/ventures", Files "/files", Hub "/hub".
Turn the user's message into ONE action. Field rules are STRICT:
- "due_date" is ONLY a calendar date in YYYY-MM-DD form (or "" ). Put ANY date here.
- "to" is ONLY used when kind is "navigate", and ONLY with one of the exact section paths listed above. For create_todo/create_project/answer, "to" MUST be omitted or "". NEVER invent paths, NEVER put a date or query string in "to".
Actions:
- Create a task/reminder -> kind "create_todo", text = the task cleaned of date words, due_date = the resolved date (YYYY-MM-DD) or "", priority = 2 if urgent/high/!, else 1.
- Capture an idea/goal/project -> kind "create_project", text = the project name.
- Go somewhere -> kind "navigate", to = the matching path.
- Complete/mark done an EXISTING to-do -> kind "complete_todo", target_id = the id from open_todo_items in the snapshot, text = that to-do's exact text. ONLY use ids present in the snapshot; if no clear match, use kind "answer" and ask.
- Log a tracker value ("log 8 glasses", "mood 4") -> kind "log_tracker", target_id = the tracker id from trackers in the snapshot, value = the number (1 for a simple check-in), text = tracker name. Only snapshot ids.
- Move/push everything due today (or overdue) to another day -> kind "reschedule_today", due_date = the target date (YYYY-MM-DD), text = short description.
- Start a focus session -> kind "start_focus", text = what to focus on.
- Answer a question or if unclear -> kind "answer", text = a short helpful reply.
ALWAYS resolve relative dates (today, tomorrow, weekday names, next week) against today into due_date — e.g. if today is 2026-07-01 (a Wednesday), "take out the trash friday" -> {"kind":"create_todo","text":"take out the trash","due_date":"2026-07-03"}. Keep text concise. Return only the structured action.${
  snapshot
    ? `

USER DATA SNAPSHOT (the signed-in user's own current data — for "answer" actions, answer FROM this with real numbers and item names; never claim you lack access):
${JSON.stringify(snapshot).slice(0, 4000)}

For "answer": be specific and grounded (e.g. "You have 3 overdue: X, Y, Z — X looks quickest."). Warm, brief, zero shame or streak language. Asked what to focus on? Suggest ONE concrete item from the snapshot.`
    : ""
}`;

// due_date is REQUIRED ("" when none) — optional string props get skipped by
// Gemini structured output, which silently dropped resolved dates.
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    kind: {
      type: "string",
      enum: [
        "create_todo",
        "create_project",
        "navigate",
        "answer",
        "complete_todo",
        "log_tracker",
        "reschedule_today",
        "start_focus",
      ],
    },
    text: { type: "string" },
    due_date: {
      type: "string",
      description:
        "YYYY-MM-DD resolved from any date words in the message, or empty string if none",
    },
    priority: { type: "integer" },
    to: { type: "string" },
    target_id: {
      type: "integer",
      description: "id from the snapshot lists for complete_todo/log_tracker; 0 otherwise",
    },
    value: { type: "number", description: "numeric value for log_tracker; 0 otherwise" },
  },
  required: ["kind", "text", "due_date"],
  propertyOrdering: ["kind", "text", "due_date", "target_id", "value", "priority", "to"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  if (!GEMINI_KEY) {
    return json({ error: "AI is not configured (missing GEMINI_API_KEY)." }, 503);
  }

  let query = "";
  let today = new Date().toISOString().slice(0, 10);
  let snapshot: unknown;
  try {
    const body = await req.json();
    query = (body.query ?? "").toString().slice(0, 500);
    if (body.today) today = String(body.today).slice(0, 10);
    if (body.snapshot && typeof body.snapshot === "object") {
      snapshot = body.snapshot;
    }
  } catch {
    return json({ error: "Bad request" }, 400);
  }
  if (!query.trim()) return json({ error: "Empty query" }, 400);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt(today, snapshot) }] },
        contents: [{ role: "user", parts: [{ text: query }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.2,
        },
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      return json({ error: `AI provider error ${res.status}`, detail: detail.slice(0, 300) }, 502);
    }
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    let action: Record<string, unknown>;
    try {
      action = JSON.parse(raw);
    } catch {
      action = { kind: "answer", text: "Sorry, I couldn't parse that." };
    }
    // Normalize: on non-navigate actions the model sometimes leaks the date
    // (or a fabricated path containing it) into "to". Salvage any date found
    // there into due_date, then strip "to" entirely — it's navigate-only.
    if (action.kind !== "navigate" && typeof action.to === "string") {
      const m = action.to.match(/\d{4}-\d{2}-\d{2}/);
      if (m && !action.due_date) action.due_date = m[0];
      delete action.to;
    }
    return json({ action });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
