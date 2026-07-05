import { useEffect, useRef, useState } from "react";
import { useNotify, useGetIdentity, useCreate } from "ra-core";
import {
  Upload,
  Download,
  Trash2,
  FileText,
  Search,
  Eye,
  Copy,
  Pin,
  X,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSupabaseClient } from "../providers/supabase/supabase";
import { EmptyState } from "../misc/EmptyState";
import { useUndoable } from "../misc/useUndoable";
import { usePageHotkey } from "../misc/usePageHotkey";
import { CardsSkeleton } from "../misc/CardsSkeleton";

const BUCKET = "attachments";
const PREFIX = "lifehq";

interface StoredFile {
  name: string;
  displayName: string;
  size: number;
  url: string;
}

const extOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";
const isImage = (name: string) =>
  ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif", "bmp"].includes(
    extOf(name),
  );
const isPdf = (name: string) => extOf(name) === "pdf";
const isPreviewable = (name: string) => isImage(name) || isPdf(name);

const prettySize = (bytes: number) => {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
};

export const FilesPage = () => {
  const notify = useNotify();
  const { identity } = useGetIdentity();
  const [create] = useCreate();
  const supabase = getSupabaseClient();
  const { deleteWithUndo: _deleteWithUndo } = useUndoable();
  const [preview, setPreview] = useState<StoredFile | null>(null);

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      notify("Link copied — paste it anywhere", { type: "info" });
    } catch {
      notify("Could not copy link", { type: "error" });
    }
  };

  const pinToHub = (f: StoredFile) =>
    create(
      "hub_items",
      {
        data: {
          title: f.displayName,
          url: f.url,
          category: "Files",
          kind: "link",
          sales_id: identity?.id ? Number(identity.id) : null,
          position: 999,
        },
      },
      {
        onSuccess: () => notify("Pinned to Hub", { type: "info" }),
        onError: () => notify("Could not pin to Hub", { type: "error" }),
      },
    );

  const openFile = (f: StoredFile) => {
    if (isPreviewable(f.name)) setPreview(f);
    else window.open(f.url, "_blank", "noopener,noreferrer");
  };
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(0);
  const [query, setQuery] = useState("");

  usePageHotkey("n", () => inputRef.current?.click());

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(BUCKET).list(PREFIX, {
      limit: 1000,
      sortBy: { column: "name", order: "desc" },
    });
    if (error) {
      notify("Could not load files", { type: "error" });
      setLoading(false);
      return;
    }
    const mapped: StoredFile[] = (data ?? [])
      .filter((f) => f.name && f.id) // skip folder placeholders
      .map((f) => ({
        name: f.name,
        displayName: f.name.replace(/^\d+-/, ""),
        size: (f.metadata?.size as number) ?? 0,
        url: supabase.storage.from(BUCKET).getPublicUrl(`${PREFIX}/${f.name}`)
          .data.publicUrl,
      }));
    setFiles(mapped);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPick = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const arr = Array.from(list);
    setUploading(arr.length);
    let done = 0;
    for (const file of arr) {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${PREFIX}/${Date.now()}-${safe}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false });
      if (error) notify(`Failed: ${file.name}`, { type: "error" });
      done++;
      setUploading(arr.length - done);
    }
    notify(`Uploaded ${arr.length} file${arr.length > 1 ? "s" : ""}`, {
      type: "info",
    });
    setUploading(0);
    load();
  };

  const remove = async (name: string, file: StoredFile) => {
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([`${PREFIX}/${name}`]);
    if (error) {
      notify("Could not delete", { type: "error" });
      return;
    }
    setFiles((f) => f.filter((x) => x.name !== name));
    notify("File removed. Undo?", {
      type: "info",
      undo: () => {
        setFiles((prev) => [...prev, file]);
        notify("File restored", { type: "success" });
      },
      autoHideDuration: 5000,
    });
  };

  const shown = files.filter((f) =>
    f.displayName.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Files</h1>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => onPick(e.target.files)}
        />
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={uploading > 0}
          className="gap-1"
        >
          <Upload className="size-4" />
          {uploading > 0 ? `Uploading ${uploading}…` : "Upload files"}
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <CardsSkeleton count={8} className="space-y-2" />
      ) : shown.length === 0 ? (
        files.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No files yet"
            description="Drop in your guides, docs, spreadsheets — anything."
            action={{
              label: "Upload files",
              onClick: () => inputRef.current?.click(),
            }}
          />
        ) : (
          <EmptyState
            icon={FolderOpen}
            title="No matches"
            description="No files match your search."
          />
        )
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
          {shown.map((f) => (
            <div
              key={f.name}
              className="group flex items-center gap-2 px-4 py-2.5 transition-colors hover:bg-accent/50"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <button
                onClick={() => openFile(f)}
                className="flex-1 truncate text-left text-[13px] transition-colors hover:text-primary"
              >
                {f.displayName}
              </button>
              <span className="hidden w-16 text-right text-xs text-muted-foreground sm:block">
                {prettySize(f.size)}
              </span>
              {isPreviewable(f.name) && (
                <button
                  onClick={() => setPreview(f)}
                  className="text-muted-foreground hover:text-primary"
                  aria-label="Preview"
                >
                  <Eye className="size-4" />
                </button>
              )}
              <button
                onClick={() => copyLink(f.url)}
                className="text-muted-foreground hover:text-primary"
                aria-label="Copy link"
              >
                <Copy className="size-4" />
              </button>
              <button
                onClick={() => pinToHub(f)}
                className="text-muted-foreground hover:text-primary"
                aria-label="Pin to Hub"
              >
                <Pin className="size-4" />
              </button>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
                aria-label="Download"
              >
                <Download className="size-4" />
              </a>
              <button
                onClick={() => remove(f.name, f)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Delete"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <Dialog open onOpenChange={() => setPreview(null)}>
          <DialogContent className="max-w-[92vw] w-[92vw] h-[88vh] p-0 flex flex-col gap-0">
            <DialogHeader className="flex-row items-center justify-between px-4 py-2 border-b space-y-0">
              <DialogTitle className="text-base truncate">
                {preview.displayName}
              </DialogTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    window.open(preview.url, "_blank", "noopener,noreferrer")
                  }
                  className="gap-1"
                >
                  <Download className="size-4" /> Open
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPreview(null)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/20">
              {isImage(preview.name) ? (
                <img
                  src={preview.url}
                  alt={preview.displayName}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <iframe
                  src={preview.url}
                  title={preview.displayName}
                  className="w-full h-full border-0"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

FilesPage.path = "/files";
