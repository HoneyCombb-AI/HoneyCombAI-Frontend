"use client";

import { useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ContactNetwork } from "@/app/api/growthEngine/contacts/[contactId]/network/route";

declare global {
  interface Window {
    d3?: any;
  }
}

let d3Loader: Promise<any> | null = null;

const loadD3 = () => {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.d3) return Promise.resolve(window.d3);
  if (!d3Loader) {
    d3Loader = new Promise((resolve, reject) => {
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
  const d3Instance = useRef<any>(null);

  const {
    nodes,
    edges,
    top_influence,
    top_engagers_inbound,
    top_engagers_outbound,
    contact_id,
  } = network ?? {};

  // --- 1. Data Normalization ---
  
  const normalizeId = (val: unknown) => {
    if (val === undefined || val === null) return null;
    try {
      return String(val);
    } catch {
      return null;
    }
  };

  const normalizedNodes = useMemo(() => {
    // Handle case where DB returns stringified JSON instead of object
    let rawNodes = nodes;
    if (typeof nodes === "string") {
      try { rawNodes = JSON.parse(nodes); } catch (e) { rawNodes = []; }
    }
    
    const arr = Array.isArray(rawNodes) ? rawNodes : [];
    const map = new Map<string, any>();
    
    arr.forEach((n) => {
      if (!n) return;
      const id = normalizeId((n as any).id);
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

  const { displayNodes, displayEdges, lowWasTrimmed } = useMemo(() => {
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
    let rawEdges = edges;
    if (typeof edges === "string") {
      try { rawEdges = JSON.parse(edges); } catch (e) { rawEdges = []; }
    }
    const edgeArr = Array.isArray(rawEdges) ? rawEdges : [];

    const validEdges = edgeArr
      .map((e) => {
        if (!e) return null;
        
        // --- THE CRITICAL FIX ---
        // D3 requires 'source' and 'target' keys.
        // Your data has 'from' and 'to'. We must map them.
        const source = normalizeId((e as any).from);
        const target = normalizeId((e as any).to);
        
        if (!source || !target) return null;
        if (!nodeIds.has(source) || !nodeIds.has(target)) return null;

        return { 
          ...e, 
          source, // Mapped for D3
          target  // Mapped for D3
        };
      })
      .filter(Boolean) as any[];

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
      if (!graphRef.current) return;
      const d3 = await loadD3();
      d3Instance.current = d3;
      if (!isMounted || !d3 || !graphRef.current) return;

      const container = graphRef.current;
      container.innerHTML = "";

      if (!displayNodes.length) {
        container.innerHTML =
          '<div class="text-sm text-muted-foreground p-4">No network data available.</div>';
        return;
      }

      const width = container.clientWidth || 600;
      const height = container.clientHeight || 440;

      // --- Clone Data ---
      // D3 mutates data in place (adding x, y, vx, vy). 
      // In React Strict Mode, this causes crashes on re-renders. 
      // We must pass deep copies to D3.
      const nodesData = displayNodes.map(d => ({ ...d }));
      const edgesData = displayEdges.map(e => ({ ...e }));

      const svg = d3
        .select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height]); // Better scaling

      const g = svg.append("g");

      const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event: any) => {
          g.attr("transform", event.transform);
        });
      svg.call(zoom as any);

      // --- Force Simulation (Matching fe_view.html) ---
      const simulation = d3.forceSimulation(nodesData)
        .force(
          "link",
          d3.forceLink(edgesData)
            .id((d: any) => d.id)
            .distance(100) // Match HTML
        )
        .force("charge", d3.forceManyBody().strength(-250)) // Match HTML
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force(
          "collide",
          d3.forceCollide().radius((d: any) => 12 + (d.engagement_score || 0) * 5)
        );

      const colorByScore = (d: any) => {
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
        .selectAll("line")
        .data(edgesData)
        .join("line")
        .attr("stroke-width", (d: any) => Math.sqrt(d.weight || 1));

      // 2. Draw Labels (Behind nodes or separate group so they don't block clicks usually, 
      // but here we follow typical pattern)
      const labelGroup = g.append("g").attr("class", "labels");
      
      const labels = labelGroup
        .selectAll("text")
        .data(nodesData)
        .join("text")
        .attr("dx", 14)
        .attr("dy", 4)
        .text((d: any) => d.name || d.id)
        .attr("fill", "#0f172a")
        .style("pointer-events", "none")
        .style("text-shadow", "0 1px 2px rgba(255,255,255,0.8)")
        .attr("font-size", (d: any) => (d.id === targetId ? "14px" : "11px"))
        .attr("font-weight", (d: any) => (d.id === targetId ? "700" : "400"))
        .style("opacity", (d: any) => {
          if (d.id === targetId) return 1;
          const score = d.engagement_score || 0;
          return score >= 0.4 ? 1 : 0; // Hide low value labels by default
        });

      // 3. Draw Nodes
      const nodesSel = g
        .append("g")
        .selectAll("circle")
        .data(nodesData)
        .join("circle")
        .attr("r", (d: any) =>
          d.id === targetId ? 14 : 6 + (d.engagement_score || 0) * 6
        )
        .attr("fill", (d: any) => colorByScore(d))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .style("cursor", "grab")
        .call(
          d3
            .drag()
            .on("start", (event: any, d: any) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on("drag", (event: any, d: any) => {
              d.fx = event.x;
              d.fy = event.y;
            })
            .on("end", (event: any, d: any) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            })
        );

      nodesSel.append("title").text((d: any) => d.name || d.id);

      // --- Interactions ---
      nodesSel
        .on("mouseover", (_event: any, d: any) => {
          labels
            .filter((l: any) => l.id === d.id)
            .transition()
            .duration(120)
            .style("opacity", 1)
            .attr("font-weight", "700");
        })
        .on("mouseout", (_event: any, d: any) => {
          labels
            .filter((l: any) => l.id === d.id)
            .transition()
            .duration(180)
            .attr("font-weight", (l: any) => (l.id === targetId ? "700" : "400"))
            .style("opacity", (l: any) => {
              if (l.id === targetId) return 1;
              const score = l.engagement_score || 0;
              return score >= 0.4 ? 1 : 0;
            });
        });

      simulation.on("tick", () => {
        links
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        nodesSel.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);

        labels.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
      });
    };

    renderGraph();

    return () => {
      isMounted = false;
      if (graphRef.current) {
        graphRef.current.innerHTML = "";
      }
    };
  }, [displayNodes, displayEdges, targetId]);

  // --- 4. Sidebar Parsing ---
  const parseList = (list: any) => {
    if (Array.isArray(list)) return list;
    if (typeof list === 'string') {
        try { return JSON.parse(list); } catch { return []; }
    }
    return [];
  }

  const renderList = (title: string, itemsRaw: any) => {
    const items = parseList(itemsRaw);
    if (!items || items.length === 0) return null;
    
    return (
      <div className="space-y-2 mb-4">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <ul className="space-y-2">
          {items.slice(0, 5).map((item: any, idx: number) => (
            <li
              key={item.id || idx}
              className="flex items-center justify-between rounded-md border border-muted px-3 py-2 bg-white"
            >
              <span className="truncate text-sm text-foreground pr-2">
                {item.name || item.id}
              </span>
              {item.score !== undefined && (
                <span className="text-sm font-bold text-cyan-600">
                    {typeof item.score === 'number' ? item.score.toFixed(2) : item.score}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-3 gap-4">
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
                className="h-[460px] w-full border border-muted rounded-lg bg-white overflow-hidden" 
            />
          </CardContent>
        </Card>

        <Card className="border border-muted bg-slate-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Key People</CardTitle>
            <p className="text-xs text-muted-foreground">
              Top connections based on graph analysis.
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[460px] pr-2">
              {renderList("Top Influence", top_influence)}
              {renderList("Inbound Engagers", top_engagers_inbound)}
              {renderList("Outbound Engagers", top_engagers_outbound)}
              
              {!top_influence && !top_engagers_inbound && !top_engagers_outbound && (
                 <p className="text-sm text-muted-foreground">No ranked data available.</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}