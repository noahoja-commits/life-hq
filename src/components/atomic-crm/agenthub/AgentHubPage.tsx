import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Send, Loader2, Check, Brain, Search, Mail, MessageSquare, Image, Code, Calendar, DollarSign, Phone, Shield, FileText, Database, Music, File, Languages, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const AUTH_TOKEN = "agent-hub-2026-secure";
const HUB_URL = "https://agent-hub-production-5ccf.up.railway.app";

const AGENTS = [
  { id: "research", name: "Nova", desc: "Web search & deep research", icon: Search, color: "#6366f1" },
  { id: "email", name: "Inbox", desc: "Gmail check, draft, send", icon: Mail, color: "#06b6d4" },
  { id: "content", name: "Scribe", desc: "Docs, slides, blogs, reports", icon: MessageSquare, color: "#f59e0b" },
  { id: "fixit", name: "Forge", desc: "Code fixes, security audit", icon: Shield, color: "#ef4444" },
  { id: "dev", name: "Echo", desc: "Write/run/debug code", icon: Code, color: "#10b981" },
  { id: "image", name: "Pixel", desc: "DALL-E, logos, illustrations", icon: Image, color: "#8b5cf6" },
  { id: "orchestrator", name: "Atlas", desc: "Plan & execute workflows", icon: Brain, color: "#c41e3a" },
  { id: "calendar", name: "Chronos", desc: "Calendar & scheduling", icon: Calendar, color: "#3b82f6" },
  { id: "finance", name: "Mammon", desc: "Stocks, crypto, markets", icon: DollarSign, color: "#f97316" },
  { id: "crm", name: "Belial", desc: "Cold calls, deal analysis", icon: Phone, color: "#ec4899" },
  { id: "watchdog", name: "Cerberus", desc: "Monitor & alerting", icon: Shield, color: "#14b8a6" },
  { id: "fileops", name: "Janus", desc: "File search & organize", icon: FileText, color: "#a855f7" },
  { id: "social", name: "Fama", desc: "Social posts & threads", icon: MessageSquare, color: "#eab308" },
  { id: "database", name: "Thoth", desc: "CSV queries, SQL gen", icon: Database, color: "#0ea5e9" },
  { id: "audio", name: "Siren", desc: "Transcribe, TTS, podcasts", icon: Music, color: "#d946ef" },
  { id: "pdf", name: "Mephisto", desc: "Contracts, invoices", icon: File, color: "#78716c" },
  { id: "translation", name: "Hermes", desc: "Translate & localize", icon: Languages, color: "#22c55e" },
];

export const AgentHubPage = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);

  const agent = AGENTS.find((a) => a.id === selected);

  const submit = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${HUB_URL}/api/tasks`, {
        method: "POST",
        headers: { Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ agent: selected, action: "execute", params: { query } }),
      });
      const data = await res.json();
      setTaskId(data.id || data.task_id);
      setResult(`⛧ Task dispatched: ${data.id || data.task_id}. Polling for result...`);
      
      // Poll for result
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const r = await fetch(`${HUB_URL}/api/tasks/${data.id || data.task_id}`, {
          headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
        });
        const d = await r.json();
        if (d.status === "completed") {
          setResult(JSON.stringify(d.result || d, null, 2).slice(0, 1000));
          clearInterval(poll);
          setLoading(false);
        } else if (attempts > 20) {
          setResult("Task timed out. Check Agent Hub dashboard.");
          clearInterval(poll);
          setLoading(false);
        }
      }, 2000);
    } catch (e: any) {
      setResult(`Failed: ${e.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col page-enter">
      <div className="px-4 pt-3 md:px-6">
        <h1 className="text-lg font-bold uppercase tracking-tight">Agent Hub</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          17 cloud agents on Railway. Research, email, code, content — all at your command.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
        <div className="mx-auto max-w-4xl space-y-5">
          {/* Agent grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {AGENTS.map((a) => (
              <button key={a.id} onClick={() => setSelected(a.id)}
                className={cn("flex flex-col items-center gap-1 rounded-none border p-3 transition-all text-center",
                  selected === a.id ? "border-[#c41e3a] bg-[#1a0404]/20" : "border-border hover:border-[#c41e3a]/50")}>
                <a.icon className="size-5" style={{ color: a.color }} />
                <span className="text-xs font-semibold">{a.name}</span>
                <span className="text-[10px] text-muted-foreground leading-tight">{a.desc}</span>
              </button>
            ))}
          </div>

          {/* Selected agent prompt */}
          {agent && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <agent.icon className="size-4" style={{ color: agent.color }} />
                <span className="text-sm font-semibold">{agent.name}</span>
                <span className="text-xs text-muted-foreground">— {agent.desc}</span>
              </div>
              <div className="flex gap-2">
                <Input value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Ask ${agent.name} anything...`} className="h-9 text-sm flex-1" />
                <Button onClick={submit} disabled={loading || !query} className="h-9 text-xs gap-1">
                  {loading ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                  Dispatch
                </Button>
              </div>
            </Card>
          )}

          {/* Result */}
          {result && (
            <Card className="p-4">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">{result}</pre>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
