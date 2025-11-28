"use client";

import { useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  ContactNetwork,
  NetworkEdge,
  NetworkEngager,
  NetworkInfluence,
  NetworkNode,
} from "@/app/api/growthEngine/contacts/[contactId]/network/route";
import { ExternalLink } from "lucide-react";
import type * as d3Types from "d3";

type D3 = typeof import("d3");
type EdgeWithRefs = NetworkEdge & { source: string; target: string };
type SimNode = NetworkNode & d3Types.SimulationNodeDatum;
type EdgeWithNodes = NetworkEdge & { source: SimNode; target: SimNode };
type SimEdge = NetworkEdge &
  d3Types.SimulationLinkDatum<SimNode> & {
    source: SimNode | string;
    target: SimNode | string;
  };

declare global {
  interface Window {
    d3?: D3;
  }
}

let d3Loader: Promise<D3 | null> | null = null;

const loadD3 = (): Promise<D3 | null> => {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.d3) return Promise.resolve(window.d3);
  if (!d3Loader) {
    d3Loader = new Promise<typeof import("d3") | null>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js";
      script.async = true;
      script.onload = () => resolve(window.d3);
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    }).catch((err) => {
      console.error("Failed to load d3", err);
      return null;
    });
  }
  return d3Loader;
};

type ContactNetworkProps = {
  network: ContactNetwork;
  contactName?: string | null;
};

export function ContactNetwork({ network, contactName }: ContactNetworkProps) {
  const graphRef = useRef<HTMLDivElement | null>(null);

  const {
    nodes,
    edges,
    top_influence,
    top_engagers_inbound,
    top_engagers_outbound,
    contact_id,
  } = network ?? {};

  // --- 1. Data Normalization ---
  
  const normalizeId = (val: unknown): string | null => {
    if (val === undefined || val === null) return null;
    try {
      return String(val);
    } catch {
      return null;
    }
  };

  const normalizedNodes = useMemo<NetworkNode[]>(() => {
    // Handle case where DB returns stringified JSON instead of object
    let rawNodes = nodes;
    if (typeof nodes === "string") {
      try {
        rawNodes = JSON.parse(nodes);
      } catch {
        rawNodes = [];
      }
    }
    
    const arr = Array.isArray(rawNodes) ? rawNodes : [];
    const map = new Map<string, NetworkNode>();
    
    arr.forEach((n) => {
      if (!n) return;
      const id = normalizeId((n as NetworkNode).id);
      if (!id) return;
      if (!map.has(id)) {
        map.set(id, { ...n, id });
      }
    });
    return Array.from(map.values());
  }, [nodes]);

  const targetId =
    normalizeId(contact_id) ||
    normalizeId(normalizedNodes?.[0]?.id) ||
    "target";

  // --- 2. Filter & Prepare Graph Data ---

  const { displayNodes, displayEdges, lowWasTrimmed } = useMemo<{
    displayNodes: NetworkNode[];
    displayEdges: EdgeWithRefs[];
    lowWasTrimmed: boolean;
  }>(() => {
    const rawNodes = normalizedNodes;
    
    // Filter logic matching your prototype
    const high = rawNodes.filter((n) => (n.engagement_score ?? 0) >= 0.8);
    const medium = rawNodes.filter((n) => {
      const score = n.engagement_score ?? 0;
      return score >= 0.4 && score < 0.8;
    });
    const low = rawNodes.filter((n) => (n.engagement_score ?? 0) < 0.4);
    
    // Cap low nodes for performance/clarity
    const lowLimited = low.slice(0, 75);
    const merged = [...high, ...medium, ...lowLimited];

    // Ensure target node exists
    if (!merged.find((n) => n.id === targetId)) {
      merged.push({
        id: targetId,
        name: contactName || "Contact",
        engagement_score: 1,
        type: "target",
      });
    }

    const nodeIds = new Set(merged.map((n) => n.id));
    
    // Handle edge parsing if stringified
    let rawEdges = edges as NetworkEdge[] | string | null | undefined;
    if (typeof edges === "string") {
      try {
        rawEdges = JSON.parse(edges) as NetworkEdge[];
      } catch {
        rawEdges = [];
      }
    }
    const edgeArr = Array.isArray(rawEdges) ? rawEdges : [];

    const validEdges = edgeArr
      .map((e) => {
        if (!e) return null;
        
        // Map from/to to D3 source/target
        const source = normalizeId(e.from);
        const target = normalizeId(e.to);
        
        if (!source || !target) return null;
        if (!nodeIds.has(source) || !nodeIds.has(target)) return null;

        return {
          ...e,
          source,
          target,
        };
      })
      .filter((edge): edge is EdgeWithRefs => Boolean(edge));

    return {
      displayNodes: merged,
      displayEdges: validEdges,
      lowWasTrimmed: low.length > lowLimited.length,
    };
  }, [normalizedNodes, edges, contactName, targetId]);

  // --- 3. D3 Rendering ---

  useEffect(() => {
    let isMounted = true;

    const renderGraph = async () => {
      const container = graphRef.current;
      if (!container) return;
      const d3 = await loadD3();
      if (!isMounted || !d3) return;
      container.innerHTML = "";

      if (!displayNodes.length) {
        container.innerHTML =
          '<div class="text-sm text-muted-foreground p-4">No network data available.</div>';
        return;
      }

      const rect = container.getBoundingClientRect();
      const width = Math.max(rect.width, 300);
      const height = Math.max(rect.height, 300);

      // --- Clone Data ---
      // D3 mutates data in place (adding x, y, vx, vy). 
      // In React Strict Mode, this causes crashes on re-renders. 
      // We must pass deep copies to D3.
      const nodesData: SimNode[] = displayNodes.map((d) => ({ ...d }));
      const edgesData: SimEdge[] = displayEdges.map((e) => ({ ...e }));

      const svg = d3
        .select(container)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", [0, 0, width, height])
        .attr("preserveAspectRatio", "xMidYMid meet");

      const g = svg.append("g");

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (event: d3Types.D3ZoomEvent<SVGSVGElement, unknown>) => {
          g.attr("transform", event.transform.toString());
        });
      svg.call(zoom as never);

      // --- Force Simulation (Matching fe_view.html) ---
      const simulation = d3
        .forceSimulation<SimNode>(nodesData)
        .force(
          "link",
          d3
            .forceLink<SimNode, SimEdge>(edgesData)
            .id((d: NetworkNode) => d.id)
            .distance(100) // Match HTML
        )
        .force("charge", d3.forceManyBody().strength(-250)) // Match HTML
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force(
          "collide",
          d3.forceCollide<SimNode>().radius((d: SimNode) => 12 + (d.engagement_score || 0) * 5)
        );

      const colorByScore = (d: SimNode) => {
        if (d.id === targetId || d.type === "target") return "#ef4444"; // Red
        const score = d.engagement_score || 0;
        if (score >= 0.8) return "#22d3ee"; // Cyan
        if (score >= 0.4) return "#a855f7"; // Purple
        return "#475569"; // Slate
      };

      // 1. Draw Links
      const links = g
        .append("g")
        .attr("stroke", "#cbd5e1")
        .attr("stroke-opacity", 0.4)
        .selectAll<SVGLineElement, SimEdge>("line")
        .data(edgesData)
        .join("line")
        .attr("stroke-width", (d: NetworkEdge) => Math.sqrt(d.weight || 1));

      // 2. Draw Labels (Behind nodes or separate group so they don't block clicks usually, 
      // but here we follow typical pattern)
      const labelGroup = g.append("g").attr("class", "labels");
      
      const labels = labelGroup
        .selectAll<SVGTextElement, SimNode>("text")
        .data(nodesData)
        .join("text")
        .attr("dx", 14)
        .attr("dy", 4)
        .text((d: SimNode) => d.name || d.id)
        .attr("fill", "#0f172a")
        .style("pointer-events", "none")
        .style("text-shadow", "0 1px 2px rgba(255,255,255,0.8)")
        .attr("font-size", (d: SimNode) => (d.id === targetId ? "14px" : "11px"))
        .attr("font-weight", (d: SimNode) => (d.id === targetId ? "700" : "400"))
        .style("opacity", (d: SimNode) => {
          if (d.id === targetId) return 1;
          const score = d.engagement_score || 0;
          return score >= 0.8 ? 1 : 0; // Only show high by default; others on hover
        });

      // 3. Draw Nodes
      const nodesSel = g
        .append("g")
        .selectAll<SVGCircleElement, SimNode>("circle")
        .data(nodesData)
        .join("circle")
        .attr("r", (d: SimNode) =>
          d.id === targetId ? 14 : 6 + (d.engagement_score || 0) * 6
        )
        .attr("fill", (d: SimNode) => colorByScore(d))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .style("cursor", "grab")
        .call(
          d3
            .drag<SVGCircleElement, SimNode>()
            .on("start", (_event, d) => {
              if (!d3) return;
              const sim = simulation as d3Types.Simulation<SimNode, SimEdge>;
              if (!sim) return;
              if (!_event.active) sim.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on("drag", (_event, d) => {
              d.fx = _event.x;
              d.fy = _event.y;
            })
            .on("end", (_event, d) => {
              if (!d3) return;
              const sim = simulation as d3Types.Simulation<SimNode, SimEdge>;
              if (!_event.active) sim.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            })
        );

      nodesSel.append("title").text((d: SimNode) => d.name || d.id);

      // --- Interactions ---
      nodesSel
        .on("mouseover", (_event: unknown, d: SimNode) => {
          labels
            .filter((l: SimNode) => l.id === d.id)
            .transition()
            .duration(120)
            .style("opacity", 1)
            .attr("font-weight", "700");
        })
        .on("mouseout", (_event: unknown, d: SimNode) => {
          labels
            .filter((l: SimNode) => l.id === d.id)
            .transition()
            .duration(180)
            .attr("font-weight", (l: SimNode) => (l.id === targetId ? "700" : "400"))
            .style("opacity", (l: SimNode) => {
              if (l.id === targetId) return 1;
              const score = l.engagement_score || 0;
              return score >= 0.8 ? 1 : 0;
            });
        });

      simulation.on("tick", () => {
        const coord = (edge: SimEdge, key: "source" | "target", axis: "x" | "y") => {
          const endpoint = edge[key];
          if (endpoint && typeof endpoint === "object") {
            const val = axis === "x" ? (endpoint as SimNode).x : (endpoint as SimNode).y;
            return val ?? 0;
          }
          return 0;
        };

        links
          .attr("x1", (d: SimEdge) => coord(d, "source", "x"))
          .attr("y1", (d: SimEdge) => coord(d, "source", "y"))
          .attr("x2", (d: SimEdge) => coord(d, "target", "x"))
          .attr("y2", (d: SimEdge) => coord(d, "target", "y"));

        nodesSel.attr("cx", (d: SimNode) => d.x ?? 0).attr("cy", (d: SimNode) => d.y ?? 0);

        labels.attr("x", (d: SimNode) => d.x ?? 0).attr("y", (d: SimNode) => d.y ?? 0);
      });
    };

    renderGraph();

    return () => {
      isMounted = false;
      const container = graphRef.current;
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [displayNodes, displayEdges, targetId]);

  // --- 4. Sidebar Parsing ---
  const parseList = (list: unknown): (NetworkInfluence | NetworkEngager)[] => {
    if (Array.isArray(list)) return list as (NetworkInfluence | NetworkEngager)[];
    if (typeof list === "string") {
      try {
        return JSON.parse(list) as (NetworkInfluence | NetworkEngager)[];
      } catch {
        return [];
      }
    }
    return [];
  };

  const renderList = (
    title: string,
    itemsRaw: NetworkInfluence[] | NetworkEngager[] | string | null | undefined
  ) => {
    const items = parseList(itemsRaw);
    if (!items || items.length === 0) return null;

    const withIds = items
      .map((item: NetworkInfluence | NetworkEngager) => {
        const id = normalizeId(item?.id);
        return id ? { ...item, id } : null;
      })
      .filter(Boolean) as (NetworkInfluence | NetworkEngager)[];

    const scoreOf = (item: NetworkInfluence | NetworkEngager) => {
      if (typeof item?.score === "number" && Number.isFinite(item.score)) return item.score;
      if (typeof item?.total_weight === "number" && Number.isFinite(item.total_weight)) return item.total_weight;
      return -Infinity;
    };

    const sorted = [...withIds].sort((a, b) => scoreOf(b) - scoreOf(a));

    const toLinkedIn = (id: string) => `https://www.linkedin.com/in/${encodeURIComponent(id)}`;

    return (
      <div className="space-y-2 mb-4">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <ul className="space-y-2">
          {sorted.slice(0, 5).map((item, idx: number) => (
            <li
              key={item.id || idx}
              className="flex items-center justify-between rounded-md border border-muted px-3 py-2 bg-white"
            >
              <span className="truncate text-sm text-foreground pr-2">
                {item.name || item.id}
              </span>
              <a
                href={toLinkedIn(item.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 text-xs"
              >
                <ExternalLink className="w-4 h-4" />
                LinkedIn
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-3 gap-3 lg:gap-4">
        <Card className="lg:col-span-2 border border-muted bg-slate-50">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-sm text-muted-foreground">Network Graph</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Visualizing relationships for {contactName || "Contact"}
                </p>
              </div>
              {lowWasTrimmed && (
                <Badge variant="outline" className="text-[11px]">
                  Low nodes trimmed
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
                Target
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400" />
                High (0.8+)
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500" />
                Medium
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-500" />
                Low
              </span>
              <span className="ml-auto text-[10px] opacity-70">Scroll to zoom • Drag to pan</span>
            </div>
          </CardHeader>
          <CardContent>
            {/* The Graph Container */}
            <div
              ref={graphRef}
              className="h-[680px] lg:h-[740px] w-full border border-muted rounded-lg bg-white overflow-hidden"
            />
          </CardContent>
        </Card>

        <Card className="border border-muted bg-slate-50 lg:max-w-[340px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Key People</CardTitle>
            <p className="text-xs text-muted-foreground">
              Top connections based on graph analysis.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {renderList("Top Influence", top_influence)}
              {renderList("Inbound Engagers", top_engagers_inbound)}
              {renderList("Outbound Engagers", top_engagers_outbound)}

              {!top_influence && !top_engagers_inbound && !top_engagers_outbound && (
                <p className="text-sm text-muted-foreground">No ranked data available.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
