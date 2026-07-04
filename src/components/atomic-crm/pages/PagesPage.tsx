import { useGetList, useGetIdentity, useCreate, useRedirect } from "ra-core";
import { FileText, Table2, Globe, Plus, Shapes } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardsSkeleton } from "../misc/CardsSkeleton";
import type { PageTheme } from "./pageThemes";

export type PageKind = "doc" | "sheet" | "embed";

export interface LifePage {
  id: number;
  title: string;
  emoji?: string;
  kind: PageKind;
  content: Record<string, unknown>;
  theme: PageTheme;
  position: number;
  updated_at: string;
}

export const KIND_META: Record<
  PageKind,
  { label: string; icon: typeof FileText }
> = {
  doc: { label: "Doc", icon: FileText },
  sheet: { label: "Sheet", icon: Table2 },
  embed: { label: "Embed", icon: Globe },
};

const EMPTY_CONTENT: Record<PageKind, Record<string, unknown>> = {
  doc: { text: "" },
  sheet: {
    cols: ["A", "B", "C"],
    rows: [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ],
  },
  embed: { url: "" },
};

export const PagesPage = () => {
  const { identity } = useGetIdentity();
  const redirect = useRedirect();
  const [create] = useCreate();

  const { data, isPending } = useGetList<LifePage>("pages", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "updated_at", order: "DESC" },
  });
  const pages = data ?? [];

  const newPage = (kind: PageKind) =>
    create(
      "pages",
      {
        data: {
          title: "Untitled",
          kind,
          content: EMPTY_CONTENT[kind],
          theme: {},
          sales_id: identity?.id ? Number(identity.id) : null,
          position: 0,
        },
      },
      {
        onSuccess: (rec: LifePage) => redirect(`/pages/${rec.id}`),
      },
    );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <h1 className="text-xl font-semibold tracking-tight flex-1">Pages</h1>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1"
          onClick={() => redirect("/templates")}
        >
          <Shapes className="size-4" /> Templates
        </Button>
        {(Object.keys(KIND_META) as PageKind[]).map((k) => {
          const Icon = KIND_META[k].icon;
          return (
            <Button
              key={k}
              size="sm"
              className="gap-1"
              onClick={() => newPage(k)}
            >
              <Plus className="size-3.5" />
              <Icon className="size-4" /> {KIND_META[k].label}
            </Button>
          );
        })}
      </div>

      {isPending && pages.length === 0 ? (
        <CardsSkeleton
          count={6}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        />
      ) : pages.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-6 text-center text-[13px] text-muted-foreground">
          No pages yet. Create a doc, a spreadsheet, or embed anything — or
          start from a template.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {pages.map((p) => {
            const Icon = KIND_META[p.kind]?.icon ?? FileText;
            return (
              <Card
                key={p.id}
                onClick={() => redirect(`/pages/${p.id}`)}
                className="min-h-24 cursor-pointer flex-col gap-2 rounded-lg border-t-4 bg-card p-4 transition-colors hover:bg-accent/50"
                style={{ borderTopColor: p.theme?.accent ?? "var(--primary)" }}
              >
                <span className="text-2xl leading-none">{p.emoji || "📄"}</span>
                <span className="truncate text-[13px] font-medium">
                  {p.title}
                </span>
                <span className="mt-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon className="size-3" />{" "}
                  {KIND_META[p.kind]?.label ?? p.kind}
                </span>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

PagesPage.path = "/pages";
