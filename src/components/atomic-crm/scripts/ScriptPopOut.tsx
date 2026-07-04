import { useParams } from "react-router";
import { useGetOne } from "ra-core";
import type { Script } from "./ScriptsPage";

/**
 * Minimal chrome-less view for the floating pop-out window — just the script,
 * big and readable while you're on a call. Registered as a noLayout route.
 */
export const ScriptPopOut = () => {
  const { id } = useParams<{ id: string }>();
  const { data: script, isPending } = useGetOne<Script>(
    "scripts",
    { id: Number(id) },
    { enabled: !!id },
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-5">
      {isPending || !script ? (
        <div className="flex justify-center pt-16">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-3 border-b pb-2">
            <h1 className="text-lg font-semibold flex-1">{script.title}</h1>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {script.category}
            </span>
          </div>
          <div className="whitespace-pre-line text-[17px] leading-8">
            {script.body || "This script is empty — write it in the Scripts section."}
          </div>
        </>
      )}
    </div>
  );
};

ScriptPopOut.path = "/script-pop/:id";
