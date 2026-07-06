import { useState } from "react";
import { useGetIdentity } from "ra-core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { EmptyState } from "../misc/EmptyState";
import { Radio, Globe, MessageSquare, Check, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/** OpenClaw integration — connects Life HQ to your OpenClaw instance. Allows Lucifer to push messages to Telegram, Discord, WhatsApp, etc. */
export const OpenClawPage = () => {
  const { identity } = useGetIdentity();
  const [endpoint, setEndpoint] = useState(localStorage.getItem("openclaw_endpoint") || "");
  const [apiKey, setApiKey] = useState(localStorage.getItem("openclaw_key") || "");
  const [channel, setChannel] = useState(localStorage.getItem("openclaw_channel") || "telegram");
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const channels = [
    { id: "telegram", label: "Telegram", icon: MessageSquare },
    { id: "discord", label: "Discord", icon: MessageSquare },
    { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
    { id: "signal", label: "Signal", icon: Radio },
    { id: "slack", label: "Slack", icon: MessageSquare },
  ];

  const save = () => {
    localStorage.setItem("openclaw_endpoint", endpoint);
    localStorage.setItem("openclaw_key", apiKey);
    localStorage.setItem("openclaw_channel", channel);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${endpoint}/v1/health`, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      });
      if (res.ok) {
        setTestResult("⛧ Connected. The gateway answers.");
      } else {
        setTestResult(`Gateway returned ${res.status}. Check your endpoint and key.`);
      }
    } catch {
      setTestResult("Could not reach gateway. Is OpenClaw running?");
    } finally {
      setTesting(false);
    }
  };

  const sendTest = async () => {
    if (!endpoint || !apiKey) return;
    try {
      await fetch(`${endpoint}/v1/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id: channel,
          recipient_id: "self",
          content: "⛧ The Abyss reaches through. Life HQ is connected.",
        }),
      });
    } catch { /* silent */ }
  };

  return (
    <div className="flex h-full flex-col page-enter">
      <div className="px-4 pt-3 md:px-6">
        <h1 className="text-lg font-bold uppercase tracking-tight">OpenClaw Bridge</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Connect Life HQ to your OpenClaw instance. Lucifer will be able to reach you on any channel.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
        <div className="mx-auto max-w-xl space-y-5">
          {/* Endpoint */}
          <Card className="p-4 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Globe className="size-3" /> Gateway Endpoint
            </label>
            <Input value={endpoint} onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://openclaw.yourdomain.com" className="h-9 text-sm" />
            <p className="text-[11px] text-muted-foreground">The URL where your OpenClaw instance is running.</p>
          </Card>

          {/* API Key */}
          <Card className="p-4 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Zap className="size-3" /> API Key
            </label>
            <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              type="password" placeholder="opc_..." className="h-9 text-sm" />
            <p className="text-[11px] text-muted-foreground">Your OpenClaw API key. Stored locally, never sent to our servers.</p>
          </Card>

          {/* Channel */}
          <Card className="p-4 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Radio className="size-3" /> Primary Channel
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {channels.map((ch) => (
                <button key={ch.id} onClick={() => setChannel(ch.id)}
                  className={cn("flex flex-col items-center gap-1 rounded-none border p-2 transition-colors text-xs",
                    channel === ch.id ? "border-[#c41e3a] bg-[#1a0404]/20 text-[#c41e3a]" : "border-border text-muted-foreground hover:border-[#c41e3a]/50")}>
                  <ch.icon className="size-4" />
                  {ch.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">Lucifer will send notifications through this channel.</p>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={save} className="flex-1 h-9 text-xs gap-2">
              {saved ? <><Check className="size-3" /> Saved</> : "Save Configuration"}
            </Button>
            <Button variant="outline" onClick={testConnection} disabled={testing || !endpoint} className="h-9 text-xs gap-2">
              {testing ? <Loader2 className="size-3 animate-spin" /> : "Test Connection"}
            </Button>
          </div>

          {testResult && (
            <Card className={cn("p-3 text-xs", testResult.includes("Connected") ? "border-[#4d7c4d] bg-[#0a1a0a]/20 text-[#4d7c4d]" : "border-[#c41e3a] bg-[#1a0404]/20 text-[#c41e3a]")}>
              {testResult}
            </Card>
          )}

          {/* What this enables */}
          <Card className="p-4 space-y-2 border-dashed">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">When connected, Lucifer can:</h3>
            <ul className="space-y-1 text-[12px] text-muted-foreground">
              <li>• Push overdue task reminders to your phone</li>
              <li>• Send you daily dark mirror summaries</li>
              <li>• Alert you when goals are approaching deadlines</li>
              <li>• Notify you when soul contracts are broken</li>
              <li>• Whisper through any channel at 3:33 AM</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
