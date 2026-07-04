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
    <div className="min-h-screen bg-background p-5 text-foreground">
      {isPending || !script ? (
        <div className="flex justify-center pt-16">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-baseline gap-2 border-b pb-2">
            <h1 className="flex-1 text-lg font-semibold tracking-tight">
              {script.title}
            </h1>
            <span className="u-label shrink-0 rounded-md border px-2 py-0.5 text-muted-foreground">
              {script.category}
            </span>
          </div>
          <div className="whitespace-pre-line text-[17px] leading-8">
            {script.body || (
              <span className="text-muted-foreground">
                This script is empty — write it in the Scripts section.
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

ScriptPopOut.path = "/script-pop/:id";
