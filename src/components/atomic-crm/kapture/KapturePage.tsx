import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Globe, Terminal, Send, Loader2, Wifi, WifiOff } from "lucide-react";

const WS_URL = "ws://localhost:61822/mcp";

export const KapturePage = () => {
  const [connected, setConnected] = useState(false);
  const [command, setCommand] = useState("");
  const [result, setResult] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = () => {
    try {
      const ws = new WebSocket(WS_URL);
      ws.onopen = () => { setConnected(true); setResult((p) => [...p, "⛧ Connected to Kapture MCP server"]); };
      ws.onclose = () => { setConnected(false); setResult((p) => [...p, "Connection closed"]); };
      ws.onerror = () => { setConnected(false); setResult((p) => [...p, "Connection error — is Kapture running?"]); };
      ws.onmessage = (e) => { try { const d = JSON.parse(e.data); setResult((p) => [...p, JSON.stringify(d, null, 2).slice(0, 500)]); } catch { setResult((p) => [...p, e.data.slice(0, 500)]); } };
      wsRef.current = ws;
    } catch (e: any) {
      setResult((p) => [...p, `Failed: ${e.message}`]);
    }
  };

  const disconnect = () => { wsRef.current?.close(); setConnected(false); };

  const send = () => {
    if (!wsRef.current || !command.trim()) return;
    setLoading(true);
    wsRef.current.send(JSON.stringify({ type: "command", command: command }));
    setCommand("");
    setTimeout(() => setLoading(false), 1000);
  };

  const navigate = (url: string) => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: "navigate", url }));
    setResult((p) => [...p, `⛧ Navigating to: ${url}`]);
  };

  return (
    <div className="flex h-full flex-col page-enter">
      <div className="px-4 pt-3 md:px-6">
        <h1 className="text-lg font-bold uppercase tracking-tight">Kapture Bridge</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Connect Lucifer to Chrome. Browse, scrape, automate — all through the eye.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
        <div className="mx-auto max-w-2xl space-y-5">

          {/* Connection */}
          <Card className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`size-3 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
              <div>
                <p className="text-sm font-semibold">{connected ? "Connected" : "Disconnected"}</p>
                <p className="text-[11px] text-muted-foreground">ws://localhost:61822/mcp</p>
              </div>
            </div>
            {connected ? (
              <Button variant="outline" size="sm" onClick={disconnect} className="h-8 text-xs">Disconnect</Button>
            ) : (
              <Button size="sm" onClick={connect} className="h-8 text-xs gap-1 bg-[#c41e3a]">
                <Wifi className="size-3" /> Connect
              </Button>
            )}
          </Card>

          {/* Quick navigate */}
          {connected && (
            <Card className="p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Navigate</p>
              <div className="flex flex-wrap gap-2">
                {["https://github.com", "https://google.com", "https://twitter.com", "https://chat.openai.com"].map((url) => (
                  <Button key={url} variant="outline" size="sm" onClick={() => navigate(url)} className="h-7 text-[11px]">{new URL(url).hostname}</Button>
                ))}
                <div className="flex gap-1 w-full">
                  <Input value={command} onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && navigate(command)}
                    placeholder="https://..." className="h-8 text-xs flex-1" />
                  <Button size="sm" onClick={() => navigate(command)} className="h-8 text-xs">Go</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Commands */}
          {connected && (
            <Card className="p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">MCP Commands</p>
              <div className="flex gap-1">
                <Input value={command} onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder='{"type": "screenshot"}' className="h-8 text-xs flex-1 font-mono" />
                <Button size="sm" onClick={send} className="h-8 text-xs gap-1">
                  <Send className="size-3" /> Send
                </Button>
              </div>
            </Card>
          )}

          {/* Results */}
          {result.length > 0 && (
            <Card className="p-4">
              <pre className="text-[11px] text-muted-foreground font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">{result.join("\n")}</pre>
            </Card>
          )}

          {/* Setup instructions */}
          {!connected && (
            <Card className="p-4 space-y-2 border-dashed">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Setup</h3>
              <ol className="space-y-1 text-[12px] text-muted-foreground list-decimal list-inside">
                <li>Install Kapture from Chrome Web Store</li>
                <li>Start the MCP server: <code className="text-[#c41e3a]">npx kapture-mcp</code></li>
                <li>Open any tab in Chrome, click the Kapture icon, flip the switch</li>
                <li>Come back here and click Connect</li>
              </ol>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
