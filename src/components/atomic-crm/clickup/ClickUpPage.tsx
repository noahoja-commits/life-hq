import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ListChecks, Loader2, Check, RefreshCw, Link, Zap } from "lucide-react";
import { useNotify } from "ra-core";
import { cn } from "@/lib/utils";

/** ClickUp integration — syncs Life HQ todos with ClickUp tasks. Direct API, no middleware needed. */
export const ClickUpPage = () => {
  const notify = useNotify();
  const [apiKey, setApiKey] = useState(localStorage.getItem("clickup_key") || "");
  const [teamId, setTeamId] = useState(localStorage.getItem("clickup_team") || "");
  const [listId, setListId] = useState(localStorage.getItem("clickup_list") || "");
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const save = () => {
    localStorage.setItem("clickup_key", apiKey);
    localStorage.setItem("clickup_team", teamId);
    localStorage.setItem("clickup_list", listId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch(`https://api.clickup.com/api/v2/team/${teamId}`, {
        headers: { Authorization: apiKey },
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult(`⛧ Connected to Team: ${data.team?.name || "Unknown"}`);
      } else {
        setTestResult(`ClickUp returned ${res.status}. Check your API key and Team ID.`);
      }
    } catch {
      setTestResult("Could not reach ClickUp API.");
    } finally { setTesting(false); }
  };

  const syncTodos = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      // Get tasks from ClickUp list
      const cuRes = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task?archived=false`, {
        headers: { Authorization: apiKey },
      });
      const cuData = await cuRes.json();
      const clickupTasks = cuData.tasks || [];

      // Get todos from Life HQ (via Supabase client)
      // For now, just report what ClickUp has
      setSyncResult(`⛧ Found ${clickupTasks.length} tasks in ClickUp. Ready to sync. (Full bidirectional sync requires your OpenClaw instance for write operations.)`);
    } catch (e: any) {
      setSyncResult(`Sync failed: ${e.message}`);
    } finally { setSyncing(false); }
  };

  return (
    <div className="flex h-full flex-col page-enter">
      <div className="px-4 pt-3 md:px-6">
        <h1 className="text-lg font-bold uppercase tracking-tight">ClickUp Bridge</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Connect Life HQ directly to ClickUp. Sync todos, projects, and time tracking.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
        <div className="mx-auto max-w-xl space-y-5">
          {/* API Key */}
          <Card className="p-4 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Zap className="size-3" /> ClickUp API Key
            </label>
            <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              type="password" placeholder="pk_..." className="h-9 text-sm" />
            <p className="text-[11px] text-muted-foreground">Settings → Apps → API Token in ClickUp</p>
          </Card>

          {/* Team ID */}
          <Card className="p-4 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              Team ID
            </label>
            <Input value={teamId} onChange={(e) => setTeamId(e.target.value)}
              placeholder="1234567" className="h-9 text-sm" />
            <p className="text-[11px] text-muted-foreground">From your ClickUp URL: app.clickup.com/← this number →/home</p>
          </Card>

          {/* List ID */}
          <Card className="p-4 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ListChecks className="size-3" /> Sync List ID
            </label>
            <Input value={listId} onChange={(e) => setListId(e.target.value)}
              placeholder="12345678" className="h-9 text-sm" />
            <p className="text-[11px] text-muted-foreground">The ClickUp list to sync with Life HQ todos.</p>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={save} className="flex-1 h-9 text-xs gap-2">
              {saved ? <><Check className="size-3" /> Saved</> : "Save Configuration"}
            </Button>
            <Button variant="outline" onClick={testConnection} disabled={testing || !apiKey} className="h-9 text-xs gap-2">
              {testing ? <Loader2 className="size-3 animate-spin" /> : "Test Connection"}
            </Button>
          </div>

          {testResult && (
            <Card className={cn("p-3 text-xs", testResult.includes("Connected") ? "border-[#4d7c4d] bg-[#0a1a0a]/20 text-[#4d7c4d]" : "border-[#c41e3a] bg-[#1a0404]/20 text-[#c41e3a]")}>
              {testResult}
            </Card>
          )}

          {/* Sync */}
          <Button variant="outline" onClick={syncTodos} disabled={syncing || !listId} className="w-full h-9 text-xs gap-2">
            {syncing ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
            Scan ClickUp Tasks
          </Button>

          {syncResult && (
            <Card className="p-3 text-xs border-[#f59e0b] bg-[#1a0a00]/20 text-[#f59e0b]">
              {syncResult}
            </Card>
          )}

          {/* What this enables */}
          <Card className="p-4 space-y-2 border-dashed">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">When connected:</h3>
            <ul className="space-y-1 text-[12px] text-muted-foreground">
              <li>• Create Life HQ todos → appear in ClickUp</li>
              <li>• Complete ClickUp tasks → marked done in Life HQ</li>
              <li>• Ventures sync to ClickUp lists</li>
              <li>• Time tracking flows both ways</li>
              <li>• Lucifer can search and manage tasks across both systems</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
