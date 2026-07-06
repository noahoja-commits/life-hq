import { useCallback, useMemo, useRef, useState } from "react";
import { useGetList, useGetIdentity, useRedirect } from "ra-core";
import ForceGraph3D, { type ForceGraphMethods, type NodeObject, type LinkObject } from "react-force-graph-3d";
import { CardsSkeleton } from "../misc/CardsSkeleton";
import * as THREE from "three";

// ── Types ───────────────────────────────────────────────

interface GraphNode extends NodeObject {
  id: string;
  label: string;
  type: string;
  color: string;
  entityId: number;
  route: string;
  val: number;
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

// ── Color map — vibrant for 3D depth ────────────────────

const NODE_COLORS: Record<string, string> = {
  contacts: "#818cf8",
  companies: "#a78bfa",
  deals: "#fbbf24",
  ventures: "#fb923c",
  todos: "#34d399",
  applications: "#22d3ee",
  goals: "#f472b6",
  routines: "#a3e635",
  trackers: "#94a3b8",
  hub_items: "#60a5fa",
  pages: "#c084fc",
  scripts: "#fb7185",
  transactions: "#2dd4bf",
  call_logs: "#a8a29e",
  things: "#facc15",
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

const nodeLabel = (type: string, data: NodeData): string => {
  switch (type) {
    case "contacts":
      return [data.first_name, data.last_name].filter(Boolean).join(" ") || "Contact";
    case "companies": return data.name || "Company";
    case "deals": case "ventures": case "goals": case "pages": case "hub_items":
      return data.name || data.title || "Untitled";
    case "todos": return (data.text || "Todo").slice(0, 40);
    case "applications": return data.company || data.role || "Application";
    case "trackers": return data.name || "Tracker";
    case "scripts": return data.title || "Script";
    case "transactions": return data.name || "Transaction";
    case "things": return data.item || "Thing";
    default: return data.name || data.title || data.text || type;
  }
};

// ── 3D Node object — glowing sphere + sprite label ──────

const spriteCache = new Map<string, THREE.Sprite>();

const nodeThreeObject = (node: GraphNode) => {
  const group = new THREE.Group();

  // Glowing sphere
  const geometry = new THREE.SphereGeometry((node.val || 3) * 0.9, 16, 16);
  const material = new THREE.MeshStandardMaterial({
    color: node.color,
    roughness: 0.3,
    metalness: 0.1,
    emissive: node.color,
    emissiveIntensity: 0.25,
  });
  const sphere = new THREE.Mesh(geometry, material);
  group.add(sphere);

  // Outer glow ring
  const ringGeo = new THREE.RingGeometry(
    (node.val || 3) * 0.95 - 0.3,
    (node.val || 3) * 0.95 + 0.15,
    32,
  );
  const ringMat = new THREE.MeshBasicMaterial({
    color: node.color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.lookAt(new THREE.Vector3(0, 1, 0));
  group.add(ring);

  // Sprite label
  const label = node.label.slice(0, 18);
  let sprite = spriteCache.get(label);
  if (!sprite) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.font = "bold 28px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 128, 32);
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(12, 3, 1);
    spriteCache.set(label, sprite);
  }
  const labelSprite = sprite.clone();
  labelSprite.position.y = (node.val || 3) * 0.9 + 1.5;
  group.add(labelSprite);

  return group;
};

// ── The Page ────────────────────────────────────────────

export const NetworkPage = () => {
  const { identity } = useGetIdentity();
  const redirect = useRedirect();
  const graphRef = useRef<ForceGraphMethods>();


  const { data: links, isPending: linksLoading } = useGetList<LinkRow>("links", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "created_at", order: "DESC" },
  });

  const fetches: [string, string][] = [
    ["contacts", "contacts"], ["deals", "deals"], ["ventures", "ventures"],
    ["todos", "todos"], ["applications", "applications"], ["goals", "goals"],
    ["pages", "pages"], ["hub_items", "hub_items"], ["scripts", "scripts"],
    ["call_logs", "call_logs"], ["things", "things"],
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

  const graphData = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    for (const { key, data } of queries) {
      for (const item of data) {
        const nid = `${key}:${item.id}`;
        if (!nodeMap.has(nid)) {
          nodeMap.set(nid, {
            id: nid, label: nodeLabel(key, item), type: key,
            color: NODE_COLORS[key] || "#94a3b8", entityId: item.id,
            route: ROUTES[key] ? `${ROUTES[key]}/${item.id}/show` : ROUTES[key] || "/",
            val: 3,
          });
        }
      }
    }
    const graphLinks: GraphLink[] = [];
    const linkedNodes = new Set<string>();
    for (const link of links ?? []) {
      const src = `${link.source_type}:${link.source_id}`;
      const tgt = `${link.target_type}:${link.target_id}`;
      if (nodeMap.has(src) && nodeMap.has(tgt)) {
        graphLinks.push({ source: src, target: tgt, label: link.label });
        linkedNodes.add(src); linkedNodes.add(tgt);
      }
    }
    let nodes = [...nodeMap.values()].filter((n) => linkedNodes.has(n.id));
    if (nodes.length === 0) nodes = [...nodeMap.values()].slice(0, 50);
    return { nodes, links: graphLinks };
  }, [queries, links]);

  const handleNodeClick = useCallback(
    (node: GraphNode) => { if (node.route) redirect(node.route); },
    [redirect],
  );

  return (
    <div className="page-enter flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 md:px-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Network</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Orbit around your data. Click to open. Scroll to zoom. Drag to rotate.
          </p>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#818cf8]" /> Contacts</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#fbbf24]" /> Projects</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#34d399]" /> Todos</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#f472b6]" /> Goals</span>
          <span className="hidden items-center gap-1.5 sm:flex"><span className="size-2 rounded-full bg-[#fb923c]" /> Ventures</span>
        </div>
      </div>

      {anyLoading ? (
        <CardsSkeleton count={1} className="m-4 md:m-6 flex-1" />
      ) : graphData.nodes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          <div className="text-center">
            <p className="mb-2 text-lg">No connections yet</p>
            <p>Start linking entities — the network grows as you link things together.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden rounded-lg border border-border m-2 md:m-4" style={{ background: "radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a14 100%)" }}>
          <ForceGraph3D
            ref={graphRef}
            graphData={graphData as any}
            nodeLabel="label"
            nodeVal="val"
            nodeThreeObject={nodeThreeObject as any}
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.005}
            linkColor={() => "rgba(148,163,184,0.25)"}
            linkWidth={0.5}
            onNodeClick={handleNodeClick as any}
            cooldownTicks={80}
            d3VelocityDecay={0.4}
            enableNavigationControls
            showNavInfo={false}
            backgroundColor="transparent"
          />
        </div>
      )}

      <div className="px-4 pb-3 pt-1 text-[11px] text-muted-foreground md:px-6">
        {graphData.nodes.length} nodes · {graphData.links.length} connections · drag to rotate · scroll to zoom · click to open
      </div>
    </div>
  );
};

NetworkPage.path = "/network";
