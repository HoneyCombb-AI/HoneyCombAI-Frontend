"use client";

import { useEffect, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import type {
  NetworkNode,
  NetworkEdge,
  ContactGraphRelationships,
  CytoscapeElement,
  CytoscapeNodeData,
  CytoscapeEdgeData,
} from "@/types/abm";

// ============================================
// COMPONENT PROPS
// ============================================

interface NetworkGraphProps {
  data: ContactGraphRelationships | null;
  contactName?: string;
}

// ============================================
// SELECTED NODE STATE TYPE
// ============================================

interface SelectedNodeData {
  id: string;
  label: string;
  type?: string;
  influence?: number;
  centrality?: number;
  flagged?: boolean;
  [key: string]: unknown;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function NetworkGraph({ data, contactName }: NetworkGraphProps) {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedNode, setSelectedNode] = useState<SelectedNodeData | null>(null);
  const [elements, setElements] = useState<CytoscapeElement[]>([]);

  /**
   * Transform raw JSONB data into Cytoscape-compatible format
   * Handles both array and object-based data structures from database
   */
  useEffect(() => {
    if (!data) {
      setElements([]);
      return;
    }

    const cytoscapeElements: CytoscapeElement[] = [];

    /**
     * NODES TRANSFORMATION
     * Map database nodes to Cytoscape node format
     * Expected format: { data: { id, label, ...custom_fields } }
     */
    const nodes = data.nodes || [];

    // Handle array of nodes
    if (Array.isArray(nodes)) {
      nodes.forEach((node: NetworkNode) => {
        // Extract node ID (try multiple possible field names)
        const nodeId: string = 
          node.id || 
          node.node_id || 
          node.name || 
          `node-${Math.random().toString(36).substr(2, 9)}`;

        // Extract influence score if available
        const influence: number =
          node.influence ||
          (typeof data.influence_scores === "object" && 
           data.influence_scores !== null &&
           nodeId in data.influence_scores
            ? (data.influence_scores as Record<string, number>)[nodeId]
            : 0) ||
          0;

        // Extract centrality if available
        const centrality: number =
          node.centrality ||
          (typeof data.centrality_metrics === "object" &&
           data.centrality_metrics !== null &&
           nodeId in data.centrality_metrics
            ? (data.centrality_metrics as Record<string, number>)[nodeId]
            : 0) ||
          0;

        const nodeData: CytoscapeNodeData = {
          id: nodeId,
          label: node.label || node.name || nodeId,
          type: node.type || "person",
          influence: influence,
          centrality: centrality,
          flagged: node.flagged || node.is_special || false,
          // Preserve all other fields for tooltip display
          ...node,
        };

        cytoscapeElements.push({
          data: nodeData,
        });
      });
    }

    /**
     * EDGES TRANSFORMATION
     * Map database edges to Cytoscape edge format
     * Expected format: { data: { id, source, target, ...custom_fields } }
     */
    const edges = data.edges || [];

    if (Array.isArray(edges)) {
      edges.forEach((edge: NetworkEdge, index: number) => {
        const edgeId: string = edge.id || `edge-${index}`;
        const source: string = edge.source || edge.from || "";
        const target: string = edge.target || edge.to || "";

        // Only add edge if both source and target exist
        if (source && target) {
          const edgeData: CytoscapeEdgeData = {
            id: edgeId,
            source: source,
            target: target,
            relationship: edge.relationship || edge.type || "connected",
            weight: edge.weight || edge.strength || 1,
            // Preserve all other fields
            ...edge,
          };

          cytoscapeElements.push({
            data: edgeData,
          });
        }
      });
    }

    setElements(cytoscapeElements);
  }, [data]);

  /**
   * Handle node selection on tap/click
   */
  const handleNodeTap = (event: cytoscape.EventObject): void => {
    const node = event.target;
    if (node.isNode && node.isNode()) {
      const nodeData = node.data() as SelectedNodeData;
      setSelectedNode(nodeData);
    }
  };

  /**
   * Zoom controls
   */
  const handleZoomIn = (): void => {
    if (cyRef.current) {
      const currentZoom = cyRef.current.zoom();
      cyRef.current.zoom(currentZoom * 1.2);
      cyRef.current.center();
    }
  };

  const handleZoomOut = (): void => {
    if (cyRef.current) {
      const currentZoom = cyRef.current.zoom();
      cyRef.current.zoom(currentZoom * 0.8);
      cyRef.current.center();
    }
  };

  const handleResetView = (): void => {
    cyRef.current?.fit();
  };

  /**
   * Search/filter functionality
   * Dims nodes that don't match the search term
   */
  const handleSearch = (term: string): void => {
    setSearchTerm(term);
    if (!cyRef.current) return;

    if (!term) {
      // Reset all nodes to visible
      cyRef.current.nodes().style("opacity", 1);
      cyRef.current.edges().style("opacity", 1);
      return;
    }

    const searchLower = term.toLowerCase();

    // Dim nodes that don't match search
    cyRef.current.nodes().forEach((node) => {
      const label = String(node.data("label") || "").toLowerCase();
      const type = String(node.data("type") || "").toLowerCase();

      if (label.includes(searchLower) || type.includes(searchLower)) {
        node.style("opacity", 1);
        // Also show connected edges
        node.connectedEdges().style("opacity", 1);
      } else {
        node.style("opacity", 0.2);
      }
    });

    // Dim unconnected edges
    cyRef.current.edges().forEach((edge) => {
      const source = edge.source();
      const target = edge.target();
      const sourceOpacity = source.style("opacity");
      const targetOpacity = target.style("opacity");

      if (sourceOpacity === "0.2" && targetOpacity === "0.2") {
        edge.style("opacity", 0.1);
      }
    });
  };

  /**
   * CYTOSCAPE STYLESHEET
   * Define visual styles for nodes and edges
   * Extensible: Add custom selectors for different node/edge types
   */
  const stylesheet: cytoscape.Stylesheet[] = [
    // Default node style
    {
      selector: "node",
      style: {
        "background-color": "#6366f1",
        label: "data(label)" as cytoscape.Css.MapperString,
        color: "#fff",
        "text-outline-color": "#000",
        "text-outline-width": 2,
        "font-size": "12px",
        width: "50px",
        height: "50px",
        "text-valign": "center",
        "text-halign": "center",
        "overlay-padding": "6px",
      },
    },
    // Nodes with high influence
    {
      selector: "node[influence > 0.7]",
      style: {
        "background-color": "#10b981",
        width: "70px",
        height: "70px",
        "font-weight": "bold",
      },
    },
    // Nodes with medium influence
    {
      selector: "node[influence > 0.4][influence <= 0.7]",
      style: {
        "background-color": "#f59e0b",
        width: "60px",
        height: "60px",
      },
    },
    // Flagged/special nodes
    {
      selector: "node[flagged = true]",
      style: {
        "border-width": "4px",
        "border-color": "#ef4444",
        "border-style": "dashed",
      },
    },
    // Node type: organization
    {
      selector: "node[type = 'organization']",
      style: {
        shape: "rectangle",
        "background-color": "#8b5cf6",
      },
    },
    // Default edge style
    {
      selector: "edge",
      style: {
        width: "2px",
        "line-color": "#94a3b8",
        "target-arrow-color": "#94a3b8",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        opacity: 0.6,
      },
    },
    // Strong relationships
    {
      selector: "edge[weight > 0.7]",
      style: {
        width: "4px",
        "line-color": "#10b981",
        "target-arrow-color": "#10b981",
        opacity: 0.9,
      },
    },
    // Selected node
    {
      selector: "node:selected",
      style: {
        "border-width": "3px",
        "border-color": "#fbbf24",
        "overlay-opacity": 0.3,
      },
    },
  ];

  // Empty state - no network data available
  if (!data || !data.nodes || (Array.isArray(data.nodes) && data.nodes.length === 0)) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <svg
              className="w-10 h-10 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No Network Data Available</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Network relationship data for {contactName || "this contact"} is not yet
            available. Check back later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Network Visualization</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {elements.filter((e) => !("source" in e.data)).length} nodes
              </Badge>
              <Badge variant="outline">
                {elements.filter((e) => "source" in e.data).length} connections
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search nodes by name or type..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Zoom Controls */}
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleResetView}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Graph Visualization */}
      <Card>
        <CardContent className="p-4">
          <div className="border rounded-lg overflow-hidden bg-slate-50">
            <CytoscapeComponent
              elements={elements}
              stylesheet={stylesheet}
              style={{ width: "100%", height: "600px" }}
              /**
               * LAYOUT CONFIGURATION
               * Using 'cose' (Compound Spring Embedder) for automatic node positioning
               * Alternative layouts: 'circle', 'grid', 'breadthfirst', 'concentric'
               */
              layout={{
                name: "cose",
                animate: true,
                animationDuration: 500,
                fit: true,
                padding: 50,
                nodeRepulsion: 8000,
                idealEdgeLength: 100,
                edgeElasticity: 100,
                nestingFactor: 1.2,
                gravity: 1,
                numIter: 1000,
                initialTemp: 200,
                coolingFactor: 0.95,
                minTemp: 1.0,
              }}
              /**
               * Cytoscape instance ready callback
               * This is where you can add custom event listeners and interactions
               */
              cy={(cy: cytoscape.Core) => {
                cyRef.current = cy;

                // Node click event
                cy.on("tap", "node", handleNodeTap);

                // Node hover tooltip
                cy.on("mouseover", "node", (event: cytoscape.EventObject) => {
                  const node = event.target;
                  node.style({
                    "border-width": "3px",
                    "border-color": "#fbbf24",
                  });
                });

                cy.on("mouseout", "node", (event: cytoscape.EventObject) => {
                  const node = event.target;
                  if (!node.selected()) {
                    node.style({
                      "border-width": "0px",
                    });
                  }
                });

                // Edge hover effect
                cy.on("mouseover", "edge", (event: cytoscape.EventObject) => {
                  const edge = event.target;
                  edge.style({
                    width: "4px",
                    opacity: 1,
                  });
                });

                cy.on("mouseout", "edge", (event: cytoscape.EventObject) => {
                  const edge = event.target;
                  edge.style({
                    width: "2px",
                    opacity: 0.6,
                  });
                });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Selected Node Details */}
      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Node Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-semibold text-muted-foreground">
                  Name:
                </span>
                <p className="text-lg font-semibold">{selectedNode.label}</p>
              </div>

              {selectedNode.type && (
                <div>
                  <span className="text-sm font-semibold text-muted-foreground">
                    Type:
                  </span>
                  <Badge variant="secondary" className="ml-2">
                    {String(selectedNode.type)}
                  </Badge>
                </div>
              )}

              {typeof selectedNode.influence === "number" && (
                <div>
                  <span className="text-sm font-semibold text-muted-foreground">
                    Influence Score:
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${selectedNode.influence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">
                      {Math.round(selectedNode.influence * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {typeof selectedNode.centrality === "number" && (
                <div>
                  <span className="text-sm font-semibold text-muted-foreground">
                    Centrality:
                  </span>
                  <p className="text-base">{selectedNode.centrality.toFixed(3)}</p>
                </div>
              )}

              {selectedNode.flagged && (
                <div>
                  <Badge variant="destructive">⚠️ Flagged Node</Badge>
                </div>
              )}

              {/* Display other custom fields */}
              {Object.entries(selectedNode)
                .filter(
                  ([key]) =>
                    ![
                      "id",
                      "label",
                      "type",
                      "influence",
                      "centrality",
                      "flagged",
                      "source",
                      "target",
                    ].includes(key)
                )
                .map(([key, value]) => (
                  <div key={key}>
                    <span className="text-sm font-semibold text-muted-foreground capitalize">
                      {key.replace(/_/g, " ")}:
                    </span>
                    <p className="text-sm">{String(value)}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Network Metrics Summary */}
      {data.network_metrics && typeof data.network_metrics === "object" && (
        <Card>
          <CardHeader>
            <CardTitle>Network Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.network_metrics).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <p className="text-xs text-muted-foreground capitalize">
                    {key.replace(/_/g, " ")}
                  </p>
                  <p className="text-lg font-semibold">
                    {typeof value === "number" ? value.toFixed(2) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#10b981]" />
              <span>High Influence (&gt; 70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#f59e0b]" />
              <span>Medium Influence (40-70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#6366f1]" />
              <span>Normal Node</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#8b5cf6]" />
              <span>Organization</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-dashed border-[#ef4444]" />
              <span>Flagged/Special</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-[#10b981]" />
              <span>Strong Connection</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
