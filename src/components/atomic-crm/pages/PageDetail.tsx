import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import {
  useGetOne,
  useUpdate,
  useDelete,
  useRedirect,
  useNotify,
} from "ra-core";
import { ArrowLeft, Trash2, ExternalLink, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirm } from "../misc/useConfirm";
import { ThemePicker } from "./ThemePicker";
import { themeStyle } from "./pageThemes";
import type { LifePage } from "./PagesPage";

// Google Docs/Sheets links embed via /preview; YouTube via /embed.
const normalizeEmbedUrl = (url: string): string => {
  try {
    const u = new URL(url);
    if (u.hostname === "docs.google.com") {
      return url.replace(/\/(edit|view)([?#].*)?$/, "/preview");
    }
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    return url;
  } catch {
    return url;
  }
};

export const PageDetail = () => {
  const { id } = useParams<{ id: string }>();
  const redirect = useRedirect();
  const notify = useNotify();
  const [update] = useUpdate();
  const [remove] = useDelete();
  const { confirm, confirmUI } = useConfirm();

  const { data: page, isPending } = useGetOne<LifePage>(
    "pages",
    { id: Number(id) },
    { enabled: !!id },
  );

  // Local editing state, hydrated from the record once.
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const [content, setContent] = useState<Record<string, unknown>>({});
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Re-hydrate when navigating between two page ids (same component instance).
  useEffect(() => {
    hydrated.current = false;
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, [id]);
  useEffect(() => {
    if (page && String(page.id) === id && !hydrated.current) {
      hydrated.current = true;
      setTitle(page.title);
      setEmoji(page.emoji ?? "");
      setContent(page.content ?? {});
    }
  }, [page, id]);

  // Debounced autosave for content edits.
  const save = (patch: Partial<LifePage>) => {
    if (!page) return;
    update(
      "pages",
      {
        id: page.id,
        data: { ...patch, updated_at: new Date().toISOString() },
        previousData: page,
      },
      { mutationMode: "optimistic" },
    );
  };
  const flushRef = useRef<(() => void) | null>(null);
  const queueContentSave = (next: Record<string, unknown>) => {
    setContent(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const doSave = () => save({ content: next as LifePage["content"] });
    flushRef.current = doSave;
    saveTimer.current = setTimeout(() => {
      flushRef.current = null;
      doSave();
    }, 800);
  };
  // Flush (don't drop) an in-flight debounced save when leaving the page.
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      flushRef.current?.();
    },
    [],
  );

  if (isPending || !page) {
    return (
      <div className="flex justify-center pt-24">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const accent = page.theme?.accent;

  return (
    <div style={themeStyle(accent)}>
      {/* Accent banner */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: accent ?? "var(--primary)" }}
      />
      <div className="max-w-4xl mx-auto px-4 py-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => redirect("/pages")}
            className="rounded-md border p-2 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
            aria-label="Back to pages"
          >
            <ArrowLeft className="size-4" />
          </button>
          <Input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            onBlur={() => save({ emoji })}
            placeholder="📄"
            className="w-14 border-0 text-center text-xl shadow-none focus-visible:ring-0"
            aria-label="Page emoji"
          />
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && save({ title: title.trim() })}
            className="flex-1 border-0 text-xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
            aria-label="Page title"
          />
          <ThemePicker
            accent={accent}
            onChange={(a) =>
              save({ theme: { ...(page.theme ?? {}), accent: a ?? undefined } })
            }
          />
          <button
            onClick={() =>
              confirm(`Delete "${page.title}"?`, () =>
                remove(
                  "pages",
                  { id: page.id, previousData: page },
                  {
                    onSuccess: () => {
                      notify("Page deleted", { type: "info" });
                      redirect("/pages");
                    },
                  },
                ),
              )
            }
            className="rounded-md border p-2 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-destructive"
            aria-label="Delete page"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        {page.kind === "doc" && (
          <textarea
            value={String(content.text ?? "")}
            onChange={(e) =>
              queueContentSave({ ...content, text: e.target.value })
            }
            placeholder="Write anything…"
            className="min-h-[65vh] w-full resize-y rounded-lg border bg-card p-5 text-[15px] leading-7 outline-none focus:ring-2 focus:ring-ring/40"
          />
        )}

        {page.kind === "sheet" && (
          <SheetEditor content={content} onChange={queueContentSave} />
        )}

        {page.kind === "embed" && (
          <EmbedEditor content={content} onChange={queueContentSave} />
        )}
      </div>
      {confirmUI}
    </div>
  );
};

PageDetail.path = "/pages/:id";

// ── Lightweight spreadsheet (grid) editor ───────────────────────────────────
const SheetEditor = ({
  content,
  onChange,
}: {
  content: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) => {
  const cols = (content.cols as string[]) ?? ["A", "B", "C"];
  const rows = (content.rows as string[][]) ?? [];

  const setCols = (nextCols: string[], nextRows: string[][]) =>
    onChange({ ...content, cols: nextCols, rows: nextRows });

  const setCell = (r: number, c: number, v: string) => {
    const next = rows.map((row, ri) =>
      ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row,
    );
    onChange({ ...content, rows: next });
  };
  const setHeader = (c: number, v: string) =>
    setCols(
      cols.map((h, ci) => (ci === c ? v : h)),
      rows,
    );
  const addRow = () =>
    onChange({ ...content, rows: [...rows, cols.map(() => "")] });
  const addCol = () =>
    setCols(
      [...cols, String.fromCharCode(65 + cols.length)],
      rows.map((r) => [...r, ""]),
    );
  const delRow = (r: number) =>
    onChange({ ...content, rows: rows.filter((_, ri) => ri !== r) });
  const delCol = (c: number) =>
    setCols(
      cols.filter((_, ci) => ci !== c),
      rows.map((row) => row.filter((_, ci) => ci !== c)),
    );

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="w-8" />
              {cols.map((h, c) => (
                <th key={c} className="border-l p-0 min-w-32 relative group">
                  <input
                    value={h}
                    onChange={(e) => setHeader(c, e.target.value)}
                    className="w-full bg-transparent px-3 py-2 font-semibold outline-none focus:bg-accent/50"
                  />
                  {cols.length > 1 && (
                    <button
                      onClick={() => delCol(c)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      aria-label={`Delete column ${h}`}
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className="border-t group/row">
                <td className="text-center text-[10px] text-muted-foreground relative">
                  <span className="group-hover/row:hidden">{r + 1}</span>
                  <button
                    onClick={() => delRow(r)}
                    className="hidden group-hover/row:inline text-muted-foreground hover:text-destructive"
                    aria-label={`Delete row ${r + 1}`}
                  >
                    <X className="size-3" />
                  </button>
                </td>
                {row.map((cell, c) => (
                  <td key={c} className="border-l p-0">
                    <input
                      value={cell}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      className="w-full bg-transparent px-3 py-2 outline-none focus:bg-accent/50"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="gap-1"
          onClick={addRow}
        >
          <Plus className="size-3.5" /> Row
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1"
          onClick={addCol}
        >
          <Plus className="size-3.5" /> Column
        </Button>
        <span className="ml-auto self-center text-[11px] text-muted-foreground">
          Autosaves as you type
        </span>
      </div>
    </div>
  );
};

// ── Embed editor (websites, Google Docs/Sheets, YouTube…) ───────────────────
const EmbedEditor = ({
  content,
  onChange,
}: {
  content: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) => {
  const url = String(content.url ?? "");
  const src = url ? normalizeEmbedUrl(url) : "";
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => onChange({ ...content, url: e.target.value.trim() })}
          placeholder="Paste a link — website, Google Doc/Sheet, YouTube…"
          className="flex-1"
        />
        {src && (
          <Button
            asChild
            variant="secondary"
            size="icon"
            aria-label="Open in new tab"
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
            </a>
          </Button>
        )}
      </div>
      {src ? (
        <iframe
          src={src}
          title="Embedded content"
          className="w-full h-[70vh] rounded-lg border bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      ) : (
        <div className="flex h-[40vh] items-center justify-center rounded-lg border border-dashed text-[13px] text-muted-foreground">
          Paste a link above to embed it here
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        Some sites block embedding — if it stays blank, use the open-in-new-tab
        button. Google Docs/Sheets need "anyone with the link" sharing.
      </p>
    </div>
  );
};
