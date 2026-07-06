import { useState } from "react";
import { useGetIdentity } from "ra-core";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSupabaseClient } from "../providers/supabase/supabase";

export const WeeklyDigest = () => {
  const { identity } = useGetIdentity();
  const [summary, setSummary] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weekly-digest`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSummary(data.summary);
      setStats(data.stats);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          Weekly Digest
        </h3>
        {!summary && (
          <Button
            size="sm"
            onClick={generate}
            disabled={loading}
            className="h-7 gap-1.5 text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="size-3" />
                Generate
              </>
            )}
          </Button>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive">
          {error}. Make sure your Gemini API key is configured.
        </p>
      )}

      {summary && (
        <>
          <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {summary}
          </div>
          {stats && (
            <div className="flex gap-4 text-xs text-muted-foreground border-t border-border pt-3">
              <span>{stats.activityCount} events</span>
              <span>{stats.doneTodos} done</span>
              <span>{stats.openTodos} open</span>
              <span>{stats.activeGoals} goals</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={generate}
            disabled={loading}
            className="h-7 text-xs self-start"
          >
            {loading ? "Regenerating..." : "Regenerate"}
          </Button>
        </>
      )}
    </Card>
  );
};
