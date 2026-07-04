// Freeform AI chat for the /#/ai section. JWT-verified (only signed-in
// users). Gemini via the GEMINI_API_KEY edge secret — key never reaches the
// client. Accepts a short message history + an optional RLS-scoped snapshot
// of the user's own data for grounded answers.

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
const MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const systemPrompt = (today: string, snapshot?: unknown) => `You are the assistant inside "Life HQ", the personal life OS of one user (Noah). Today is ${today}.
Voice: warm, direct, zero corporate fluff, zero shame or streak language — the user is ADHD and this app is deliberately guilt-free. Keep answers tight; use short paragraphs or lists. You are NOT a therapist or doctor; for medical/legal topics, be helpful but suggest professionals when it matters.
You are especially good at:
- Writing SCRIPTS: cold-call openers, job-interview answers, follow-up emails/texts, tough-conversation openers. Make them sound like a real person, not a brochure. Offer one strong version, not five options.
- Breaking overwhelming things into the next single physical action.
- Planning days/weeks realistically (energy varies; buffer time is real).
The app has sections the user may reference: To-Dos, Calendar, Goals, Dates, Money (budgets/bills), Track (habits), Focus, Routines, Jobs (applications), Projects, Ventures, Pages (docs/sheets), Scripts, Review.${
  snapshot
    ? `

USER DATA SNAPSHOT (their own current data — ground answers in it, never claim you lack access):
${JSON.stringify(snapshot).slice(0, 4000)}`
    : ""
}`;

interface ChatMsg {
  role: "user" | "assistant";
  text: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  if (!GEMINI_KEY) return json({ error: "AI is not configured." }, 503);

  let messages: ChatMsg[] = [];
  let today = new Date().toISOString().slice(0, 10);
  let snapshot: unknown;
  try {
    const body = await req.json();
    if (Array.isArray(body.messages)) {
      messages = body.messages
        .filter((m: ChatMsg) => m && (m.role === "user" || m.role === "assistant") && m.text)
        .slice(-16) // cap history
        .map((m: ChatMsg) => ({ role: m.role, text: String(m.text).slice(0, 4000) }));
    }
    if (body.today) today = String(body.today).slice(0, 10);
    if (body.snapshot && typeof body.snapshot === "object") snapshot = body.snapshot;
  } catch {
    return json({ error: "Bad request" }, 400);
  }
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return json({ error: "Last message must be from the user" }, 400);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt(today, snapshot) }] },
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.text }],
        })),
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      return json({ error: `AI provider error ${res.status}`, detail: detail.slice(0, 200) }, 502);
    }
    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ??
      "";
    return json({ text: text || "…I came back empty. Try rephrasing?" });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
