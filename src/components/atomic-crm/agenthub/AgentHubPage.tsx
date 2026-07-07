import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const TOKEN = "agent-hub-2026-secure";

interface Agent {
  id: string; name: string; desc: string; emoji: string;
}
const AGENTS: Agent[] = [
  { id: "research", name: "Nova", desc: "Web search & deep research", emoji: "🔭" },
  { id: "email", name: "Inbox", desc: "Gmail check, draft, send", emoji: "📬" },
  { id: "content", name: "Scribe", desc: "Docs, slides, blogs, reports", emoji: "✨" },
  { id: "fixit", name: "Forge", desc: "Code fixes, security audit", emoji: "⚒️" },
  { id: "dev", name: "Echo", desc: "Write/run/debug code", emoji: "💻" },
  { id: "image", name: "Pixel", desc: "DALL-E, logos, illustrations", emoji: "🎨" },
  { id: "orchestrator", name: "Atlas", desc: "Plan & execute workflows", emoji: "🧠" },
  { id: "calendar", name: "Chronos", desc: "Calendar & scheduling", emoji: "⏳" },
  { id: "finance", name: "Mammon", desc: "Stocks, crypto, markets", emoji: "💰" },
  { id: "crm", name: "Belial", desc: "Cold calls, deal analysis", emoji: "📞" },
  { id: "watchdog", name: "Cerberus", desc: "Monitor & alerting", emoji: "🐕" },
  { id: "fileops", name: "Janus", desc: "File search & organize", emoji: "🗄️" },
  { id: "social", name: "Fama", desc: "Social posts & threads", emoji: "📢" },
  { id: "database", name: "Thoth", desc: "CSV queries, SQL gen", emoji: "📊" },
  { id: "audio", name: "Siren", desc: "Transcribe, TTS, podcasts", emoji: "🎙️" },
  { id: "pdf", name: "Mephisto", desc: "Contracts, invoices", emoji: "📄" },
  { id: "translation", name: "Hermes", desc: "Translate & localize", emoji: "🌐" },
];

export const AgentHubPage = () => {
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = async () => {
    if (!selected || !query.trim()) return;
    setLoading(true);
    setResult("Dispatching...");
    try {
      const r = await fetch(`/api/agent-hub/tasks`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ agent: selected, action: "execute", params: { query } }),
      });
      const d = await r.json();
      if (d.error) { setResult("Error: " + d.error); setLoading(false); return; }
      const taskId = d.id || d.task_id;
      setResult(`Task ${taskId} queued. Polling...`);
      let tries = 0;
      const poll = setInterval(async () => {
        tries++;
        const pr = await fetch(`/api/agent-hub/tasks/${taskId}`, { headers: { "Authorization": `Bearer ${TOKEN}` } });
        const pd = await pr.json();
        if (pd.status === "completed") {
          setResult(typeof pd.result === "string" ? pd.result : JSON.stringify(pd.result || pd, null, 2));
          clearInterval(poll);
          setLoading(false);
        } else if (tries > 15) {
          setResult("Timed out. Check agent-hub dashboard.");
          clearInterval(poll);
          setLoading(false);
        }
      }, 2000);
    } catch (e: any) {
      setResult("Failed: " + (e.message || "unknown error"));
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-3 md:px-6">
        <h1 className="text-lg font-bold uppercase tracking-tight">Agent Hub</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">17 cloud agents. Pick one and dispatch.</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
        <div className="mx-auto max-w-4xl space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {AGENTS.map((a) => (
              <button key={a.id} onClick={() => setSelected(a.id)}
                style={{ borderColor: selected === a.id ? "#c41e3a" : undefined, backgroundColor: selected === a.id ? "rgba(180,0,0,0.1)" : undefined }}
                className="flex flex-col items-center gap-1 border border-[#1a1a1a] p-3 transition-all text-center hover:border-[#c41e3a]/50">
                <span className="text-lg">{a.emoji}</span>
                <span className="text-xs font-semibold">{a.name}</span>
                <span className="text-[10px] text-muted-foreground leading-tight">{a.desc}</span>
              </button>
            ))}
          </div>
          {selected && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{AGENTS.find(a => a.id === selected)?.emoji}</span>
                <span className="text-sm font-semibold">{AGENTS.find(a => a.id === selected)?.name}</span>
              </div>
              <div className="flex gap-2">
                <Input value={query} onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && dispatch()}
                  placeholder={`Ask ${AGENTS.find(a => a.id === selected)?.name}...`}
                  className="h-9 text-sm flex-1" />
                <Button onClick={dispatch} disabled={loading || !query.trim()} className="h-9 text-xs gap-1">
                  {loading ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                  Dispatch
                </Button>
              </div>
            </Card>
          )}
          {result && (
            <Card className="p-4">
              <pre className="text-xs whitespace-pre-wrap font-mono" style={{ color: "#a1a1aa" }}>{result}</pre>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
