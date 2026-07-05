import { useCallback, useMemo, useRef, useState } from "react";
import { useGetList, useGetIdentity, useRedirect } from "ra-core";
import ForceGraph2D, { type ForceGraphMethods, type NodeObject, type LinkObject } from "react-force-graph-2d";
import { CardsSkeleton } from "../misc/CardsSkeleton";

// ── Types ───────────────────────────────────────────────

interface GraphNode extends NodeObject {
  id: string;          // "{type}:{id}"
  label: string;       // display name
  type: string;        // entity type key
  color: string;       // fill color
  entityId: number;    // database ID
  route: string;       // where clicking navigates to
  val: number;         // node size weight
}

interface GraphLink extends LinkObject {
  source: string;
  target: string;
  label?: string;
}

interface LinkRow {
  id: number;
  source_type: string;
  source_id: number;
  target_type: string;
  target_id: number;
  label?: string;
}

interface NodeData {
  id: number;
  name?: string;
  title?: string;
  text?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  item?: string;
}

// ── Color map by entity type ────────────────────────────

const NODE_COLORS: Record<string, string> = {
  contacts: "#6366f1",
  companies: "#8b5cf6",
  deals: "#f59e0b",
  ventures: "#f97316",
  todos: "#10b981",
  applications: "#06b6d4",
  goals: "#ec4899",
  routines: "#84cc16",
  trackers: "#64748b",
  hub_items: "#3b82f6",
  pages: "#a855f7",
  scripts: "#f43f5e",
  transactions: "#14b8a6",
  call_logs: "#78716c",
  things: "#eab308",
};

const NODE_LABELS: Record<string, string> = {
  contacts: "Contact",
  companies: "Company",
  deals: "Project",
  ventures: "Venture",
  todos: "Todo",
  applications: "Job",
  goals: "Goal",
  routines: "Routine",
  trackers: "Tracker",
  hub_items: "Hub",
  pages: "Page",
  scripts: "Script",
  transactions: "Money",
  call_logs: "Call",
  things: "Thing",
};

const ROUTES: Record<string, string> = {
  contacts: "/contacts",
  companies: "/companies",
  deals: "/deals",
  ventures: "/ventures",
  todos: "/todos",
  applications: "/applications",
  goals: "/goals",
  routines: "/routines",
  trackers: "/track",
  hub_items: "/hub",
  pages: "/pages",
  scripts: "/scripts",
  transactions: "/money",
  call_logs: "/call_logs",
  things: "/things",
};

// ── Extract a readable label from any entity ────────────

const nodeLabel = (type: string, data: NodeData): string => {
  switch (type) {
    case "contacts":
      return [data.first_name, data.last_name].filter(Boolean).join(" ") || "Contact";
    case "companies":
      return data.name || "Company";
    case "deals":
    case "ventures":
    case "goals":
    case "pages":
    case "hub_items":
      return data.name || data.title || "Untitled";
    case "todos":
      return (data.text || "Todo").slice(0, 40);
    case "applications":
      return data.company || data.role || "Application";
    case "trackers":
      return data.name || "Tracker";
    case "scripts":
      return data.title || "Script";
    case "transactions":
      return data.name || "Transaction";
    case "things":
      return data.item || "Thing";
    default:
      return data.name || data.title || data.text || type;
  }
};

// ── The Page ────────────────────────────────────────────

export const NetworkPage = () => {
  const { identity } = useGetIdentity();
  const redirect = useRedirect();
  const graphRef = useRef<ForceGraphMethods>();
  const [highlight, setHighlight] = useState<Set<string>>(new Set());
  const salesId = identity?.id ? Number(identity.id) : null;

  // Fetch links
  const { data: links, isPending: linksLoading } = useGetList<LinkRow>("links", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "created_at", order: "DESC" },
  });

  // Fetch entity lists for nodes
  const fetches: [string, string][] = [
    ["contacts", "contacts"],
    ["deals", "deals"],
    ["ventures", "ventures"],
    ["todos", "todos"],
    ["applications", "applications"],
    ["goals", "goals"],
    ["pages", "pages"],
    ["hub_items", "hub_items"],
    ["scripts", "scripts"],
    ["call_logs", "call_logs"],
    ["things", "things"],
  ];

  const queries = fetches.map(([key, resource]) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data } = useGetList<NodeData>(resource, {
      pagination: { page: 1, perPage: 200 },
      sort: { field: "id", order: "DESC" },
    });
    return { key, data: data ?? [] };
  });

  const anyLoading = linksLoading || queries.some((q) => !q.data);

  // Build graph data
  const graphData = useMemo(() => {
    // Build node map from all entity types
    const nodeMap = new Map<string, GraphNode>();
    for (const { key, data } of queries) {
      for (const item of data) {
        const nid = `${key}:${item.id}`;
        if (!nodeMap.has(nid)) {
          nodeMap.set(nid, {
            id: nid,
            label: nodeLabel(key, item),
            type: key,
            color: NODE_COLORS[key] || "#94a3b8",
            entityId: item.id,
            route: ROUTES[key]
              ? `${ROUTES[key]}/${item.id}/show`
              : ROUTES[key] || "/",
            val: 3,
          });
        }
      }
    }

    // Build links — only between nodes that exist in the map
    const graphLinks: GraphLink[] = [];
    const linkedNodes = new Set<string>();
    for (const link of links ?? []) {
      const src = `${link.source_type}:${link.source_id}`;
      const tgt = `${link.target_type}:${link.target_id}`;
      if (nodeMap.has(src) && nodeMap.has(tgt)) {
        graphLinks.push({
          source: src,
          target: tgt,
          label: link.label,
        });
        linkedNodes.add(src);
        linkedNodes.add(tgt);
      }
    }

    // Only show nodes that are connected (have links), plus a few unlinked
    // to seed the graph if it's empty.
    let nodes = [...nodeMap.values()].filter((n) => linkedNodes.has(n.id));
    if (nodes.length === 0) {
      // Seed: show all nodes with connections if no links exist yet
      nodes = [...nodeMap.values()].slice(0, 50);
    }

    return { nodes, links: graphLinks };
  }, [queries, links]);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.route) redirect(node.route);
    },
    [redirect],
  );

  const handleNodeHover = useCallback(
    (node: GraphNode | null) => {
      if (!node) {
        setHighlight(new Set());
        return;
      }
      const connected = new Set<string>();
      connected.add(node.id);
      for (const link of graphData.links) {
        const src = typeof link.source === "object" ? (link.source as GraphNode).id : link.source;
        const tgt = typeof link.target === "object" ? (link.target as GraphNode).id : link.target;
        if (src === node.id) connected.add(tgt as string);
        if (tgt === node.id) connected.add(src as string);
      }
      setHighlight(connected);
    },
    [graphData.links],
  );

  const paintNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D) => {
      const isHighlighted = highlight.size === 0 || highlight.has(node.id);
      const dimmed = highlight.size > 0 && !isHighlighted;

      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, (node.val || 3) * 1.4, 0, 2 * Math.PI);
      ctx.fillStyle = dimmed ? `${node.color}20` : node.color;
      ctx.fill();

      // Subtle glow for highlighted
      if (isHighlighted && highlight.size > 0) {
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Label
      const fontSize = isHighlighted ? 10 : 8;
      ctx.font = `${fontSize}px Inter Variable, sans-serif`;
      ctx.fillStyle = dimmed ? "transparent" : (highlight.size > 0 && isHighlighted ? "#fff" : "#94a3b8");
      ctx.textAlign = "center";
      ctx.fillText(node.label.slice(0, 20), node.x ?? 0, (node.y ?? 0) + (node.val || 3) * 1.4 + 12);
    },
    [highlight],
  );

  return (
    <div className="page-enter flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-4 md:px-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Network</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Everything connected. Click a node to go there. Drag to explore.
          </p>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#6366f1]" /> Contacts
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#f59e0b]" /> Projects
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#10b981]" /> Todos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#ec4899]" /> Goals
          </span>
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="size-2 rounded-full bg-[#f97316]" /> Ventures
          </span>
        </div>
      </div>

      {anyLoading ? (
        <CardsSkeleton count={1} className="m-4 md:m-6 flex-1" />
      ) : graphData.nodes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          <div className="text-center">
            <p className="mb-2 text-lg">No connections yet</p>
            <p>
              Start linking entities together — open a contact, venture, or goal
              and connect it to something else. The network grows as you do.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden rounded-lg border border-border bg-background/50 m-2 md:m-4">
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeLabel="label"
            nodeVal="val"
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.004}
            linkColor={() => "rgba(148,163,184,0.3)"}
            linkWidth={1}
            nodeCanvasObject={paintNode as any}
            onNodeClick={handleNodeClick as any}
            onNodeHover={handleNodeHover as any}
            cooldownTicks={100}
            d3VelocityDecay={0.3}
            enableZoomInteraction
            enablePanInteraction
            width={800}
            height={600}
            backgroundColor="transparent"
          />
        </div>
      )}

      <div className="px-4 pb-3 pt-1 text-[11px] text-muted-foreground md:px-6">
        {graphData.nodes.length} nodes · {graphData.links.length} connections · drag to explore · click to open
      </div>
    </div>
  );
};

NetworkPage.path = "/network";
