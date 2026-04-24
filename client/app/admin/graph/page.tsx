
// "use client";
// import { useEffect, useRef, useState, useCallback } from "react";
// import api from "@/lib/api";
// import * as d3 from "d3";

// interface GraphNode extends d3.SimulationNodeDatum {
//   id: string;
//   name: string;
//   activityScore: number;
//   _glow?: number; // pulse phase
// }
// interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
//   weight: number;
// }

// // Obsidian-inspired colour palette
// const ACCENT_CYAN   = "#00FFFF";
// const ACCENT_PURPLE = "#9B59FF";
// const ACCENT_ORANGE = "#FF5F1F";
// const NODE_BASE     = "#1E1E2E";

// function nodeColor(score: number): string {
//   if (score > 150) return ACCENT_ORANGE;
//   if (score > 80)  return ACCENT_CYAN;
//   return ACCENT_PURPLE;
// }

// function nodeGlow(score: number): string {
//   if (score > 150) return "rgba(255,95,31,0.6)";
//   if (score > 80)  return "rgba(0,255,255,0.55)";
//   return "rgba(155,89,255,0.5)";
// }

// export default function AdminGraphPage() {
//   const svgRef      = useRef<SVGSVGElement>(null);
//   const wrapRef     = useRef<HTMLDivElement>(null);
//   const [graph, setGraph]     = useState<{ nodes: GraphNode[]; links: GraphLink[] } | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [hovered, setHovered] = useState<GraphNode | null>(null);
//   const [stats, setStats]     = useState({ nodes: 0, edges: 0, maxScore: 0 });

//   useEffect(() => {
//     api.get("/api/admin/graph/users")
//       .then(res => {
//         const data = res.data.data;
//         setGraph(data);
//         setStats({
//           nodes: data.nodes.length,
//           edges: data.links.length,
//           maxScore: Math.max(...data.nodes.map((n: GraphNode) => n.activityScore), 0),
//         });
//       })
//       .finally(() => setLoading(false));
//   }, []);

//   const buildGraph = useCallback(() => {
//     if (!graph || !svgRef.current || !wrapRef.current) return;

//     const width  = wrapRef.current.clientWidth  || 900;
//     const height = wrapRef.current.clientHeight || 620;

//     const svg = d3.select(svgRef.current);
//     svg.selectAll("*").remove();
//     svg.attr("viewBox", `0 0 ${width} ${height}`);

//     // ── Defs: filters & gradients ──────────────────────────────────────────
//     const defs = svg.append("defs");

//     // glow filter
//     const filter = defs.append("filter").attr("id", "glow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
//     filter.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "blur");
//     const feMerge = filter.append("feMerge");
//     feMerge.append("feMergeNode").attr("in", "blur");
//     feMerge.append("feMergeNode").attr("in", "SourceGraphic");

//     // strong glow
//     const filterStrong = defs.append("filter").attr("id", "glow-strong").attr("x", "-80%").attr("y", "-80%").attr("width", "260%").attr("height", "260%");
//     filterStrong.append("feGaussianBlur").attr("stdDeviation", "8").attr("result", "blur");
//     const feMerge2 = filterStrong.append("feMerge");
//     feMerge2.append("feMergeNode").attr("in", "blur");
//     feMerge2.append("feMergeNode").attr("in", "SourceGraphic");

//     // radial gradient for bg
//     const radGrad = defs.append("radialGradient").attr("id", "bg-grad").attr("cx", "50%").attr("cy", "50%").attr("r", "70%");
//     radGrad.append("stop").attr("offset", "0%").attr("stop-color", "#12121f").attr("stop-opacity", 1);
//     radGrad.append("stop").attr("offset", "100%").attr("stop-color", "#0A0A0F").attr("stop-opacity", 1);

//     // ── Background ─────────────────────────────────────────────────────────
//     svg.append("rect").attr("width", width).attr("height", height).attr("fill", "url(#bg-grad)");

//     // subtle grid
//     const grid = svg.append("g").attr("opacity", 0.04);
//     for (let x = 0; x < width; x += 50) {
//       grid.append("line").attr("x1", x).attr("y1", 0).attr("x2", x).attr("y2", height).attr("stroke", "#fff").attr("stroke-width", 0.5);
//     }
//     for (let y = 0; y < height; y += 50) {
//       grid.append("line").attr("x1", 0).attr("y1", y).attr("x2", width).attr("y2", y).attr("stroke", "#fff").attr("stroke-width", 0.5);
//     }

//     // ── Force simulation ───────────────────────────────────────────────────
//     const nodes: GraphNode[] = graph.nodes.map(n => ({ ...n }));
//     const links: GraphLink[] = graph.links.map(l => ({ ...l }));

//     const simulation = d3.forceSimulation<GraphNode>(nodes)
//       .force("link", d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(d => 120 - (d.weight * 20)).strength(0.4))
//       .force("charge", d3.forceManyBody().strength(-350))
//       .force("center", d3.forceCenter(width / 2, height / 2))
//       .force("collision", d3.forceCollide<GraphNode>().radius(d => Math.max(14, Math.min(32, d.activityScore / 3)) + 12));

//     // ── Edge layer ─────────────────────────────────────────────────────────
//     const linkG = svg.append("g").attr("class", "links");
//     const link = linkG.selectAll<SVGLineElement, GraphLink>("line")
//       .data(links)
//       .join("line")
//       .attr("stroke", ACCENT_PURPLE)
//       .attr("stroke-opacity", d => Math.min(0.6, 0.15 + d.weight * 0.25))
//       .attr("stroke-width", d => Math.max(0.5, d.weight * 1.5))
//       .attr("filter", "url(#glow)");

//     // ── Node layer ─────────────────────────────────────────────────────────
//     const nodeG = svg.append("g").attr("class", "nodes");

//     const nodeGroup = nodeG.selectAll<SVGGElement, GraphNode>("g")
//       .data(nodes)
//       .join("g")
//       .style("cursor", "pointer")
//       .call(
//         d3.drag<SVGGElement, GraphNode>()
//           .on("start", (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
//           .on("drag",  (e, d) => { d.fx = e.x; d.fy = e.y; })
//           .on("end",   (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
//       );

//     // outer glow ring
//     nodeGroup.append("circle")
//       .attr("r", d => Math.max(14, Math.min(32, d.activityScore / 3)) + 8)
//       .attr("fill", d => nodeGlow(d.activityScore))
//       .attr("opacity", 0.15)
//       .attr("filter", "url(#glow-strong)");

//     // middle halo
//     nodeGroup.append("circle")
//       .attr("r", d => Math.max(14, Math.min(32, d.activityScore / 3)) + 2)
//       .attr("fill", "none")
//       .attr("stroke", d => nodeColor(d.activityScore))
//       .attr("stroke-width", 0.8)
//       .attr("stroke-opacity", 0.4);

//     // main node
//     const mainCircle = nodeGroup.append("circle")
//       .attr("r", d => Math.max(14, Math.min(32, d.activityScore / 3)))
//       .attr("fill", NODE_BASE)
//       .attr("stroke", d => nodeColor(d.activityScore))
//       .attr("stroke-width", 1.5)
//       .attr("filter", "url(#glow)");

//     // inner dot
//     nodeGroup.append("circle")
//       .attr("r", 3)
//       .attr("fill", d => nodeColor(d.activityScore))
//       .attr("opacity", 0.9);

//     // label
//     const labels = nodeGroup.append("text")
//       .text(d => d.name.split(" ")[0])
//       .attr("text-anchor", "middle")
//       .attr("dy", d => -(Math.max(14, Math.min(32, d.activityScore / 3)) + 14))
//       .attr("fill", "rgba(255,255,255,0.6)")
//       .attr("font-size", 9)
//       .attr("font-family", "'Syncopate', monospace")
//       .attr("letter-spacing", "0.1em")
//       .style("pointer-events", "none")
//       .style("user-select", "none");

//     // hover interactions
//     nodeGroup
//       .on("mouseenter", function(_, d) {
//         setHovered(d);
//         d3.select(this).select("circle:nth-child(3)")
//           .attr("stroke-width", 2.5)
//           .attr("r", Math.max(14, Math.min(32, d.activityScore / 3)) + 3);
//         d3.select(this).select("text")
//           .attr("fill", "#fff")
//           .attr("font-size", 10);
//       })
//       .on("mouseleave", function(_, d) {
//         setHovered(null);
//         d3.select(this).select("circle:nth-child(3)")
//           .attr("stroke-width", 1.5)
//           .attr("r", Math.max(14, Math.min(32, d.activityScore / 3)));
//         d3.select(this).select("text")
//           .attr("fill", "rgba(255,255,255,0.6)")
//           .attr("font-size", 9);
//       });

//     // ── Tick ───────────────────────────────────────────────────────────────
//     simulation.on("tick", () => {
//       link
//         .attr("x1", (d: any) => d.source.x)
//         .attr("y1", (d: any) => d.source.y)
//         .attr("x2", (d: any) => d.target.x)
//         .attr("y2", (d: any) => d.target.y);

//       nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
//     });

//     // ── Zoom & pan ─────────────────────────────────────────────────────────
//     const zoom = d3.zoom<SVGSVGElement, unknown>()
//       .scaleExtent([0.3, 4])
//       .on("zoom", e => {
//         linkG.attr("transform", e.transform);
//         nodeG.attr("transform", e.transform);
//       });
//     svg.call(zoom);

//     return () => { simulation.stop(); };
//   }, [graph]);

//   useEffect(() => {
//     const cleanup = buildGraph();
//     return cleanup;
//   }, [buildGraph]);

//   // ── Loading ──────────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
//         <div>
//           <p style={{
//             fontFamily: "'Syncopate', sans-serif",
//             fontSize: "0.5rem", letterSpacing: "0.4em",
//             textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
//           }}>
//             Initialising graph...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (!graph) {
//     return (
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
//         <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "0.5rem", letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)" }}>
//           No graph data available.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div style={{ minHeight: "100vh", background: "#0A0A0F", color: "#fff" }}>

//       {/* Header */}
//       <div style={{ marginBottom: "1.5rem" }}>
//         <p style={{
//           fontFamily: "'Syncopate', sans-serif",
//           fontSize: "1.1rem", letterSpacing: "0.25em",
//           textTransform: "uppercase", color: "#fff", fontWeight: 700,
//           marginBottom: "0.4rem",
//         }}>
//           User Graph
//         </p>
//         <p style={{
//           fontFamily: "'Syncopate', sans-serif",
//           fontSize: "0.48rem", letterSpacing: "0.2em",
//           textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
//         }}>
//           Similarity network · drag nodes · scroll to zoom
//         </p>
//       </div>

//       {/* Stats row */}
//       <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.25rem" }}>
//         {[
//           { label: "Nodes",    value: stats.nodes,    color: ACCENT_CYAN },
//           { label: "Edges",    value: stats.edges,    color: ACCENT_PURPLE },
//           { label: "Peak Score", value: stats.maxScore, color: ACCENT_ORANGE },
//         ].map(s => (
//           <div key={s.label} style={{
//             background: "#111118",
//             border: "1px solid rgba(255,255,255,0.07)",
//             borderRadius: "4px",
//             padding: "0.75rem 1.25rem",
//             minWidth: "90px",
//           }}>
//             <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "1.2rem", fontWeight: 700, color: s.color, marginBottom: "0.3rem", lineHeight: 1 }}>{s.value}</p>
//             <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "0.42rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{s.label}</p>
//           </div>
//         ))}

//         {/* Legend */}
//         <div style={{
//           marginLeft: "auto",
//           background: "#111118",
//           border: "1px solid rgba(255,255,255,0.07)",
//           borderRadius: "4px",
//           padding: "0.75rem 1.25rem",
//           display: "flex", flexDirection: "column", gap: "0.5rem",
//           justifyContent: "center",
//         }}>
//           {[
//             { color: ACCENT_ORANGE, label: "High activity  (>150)" },
//             { color: ACCENT_CYAN,   label: "Mid  activity  (>80)" },
//             { color: ACCENT_PURPLE, label: "Low  activity" },
//           ].map(l => (
//             <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
//               <span style={{
//                 width: 8, height: 8, borderRadius: "50%",
//                 background: l.color,
//                 boxShadow: `0 0 6px ${l.color}`,
//                 flexShrink: 0,
//               }} />
//               <span style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "0.42rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)" }}>
//                 {l.label}
//               </span>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Tooltip */}
//       {hovered && (
//         <div style={{
//           position: "fixed",
//           top: "5rem", right: "2rem",
//           background: "#111118",
//           border: `1px solid ${nodeColor(hovered.activityScore)}`,
//           borderRadius: "4px",
//           padding: "1rem 1.25rem",
//           zIndex: 200,
//           minWidth: "180px",
//           boxShadow: `0 0 20px ${nodeGlow(hovered.activityScore)}`,
//           pointerEvents: "none",
//         }}>
//           <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "0.65rem", letterSpacing: "0.15em", color: "#fff", marginBottom: "0.75rem", fontWeight: 700 }}>
//             {hovered.name}
//           </p>
//           <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
//             {[
//               { k: "ID",       v: hovered.id.slice(0, 12) + "…" },
//               { k: "Score",    v: hovered.activityScore },
//             ].map(row => (
//               <div key={row.k} style={{ display: "flex", justifyContent: "space-between", gap: "1.5rem" }}>
//                 <span style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "0.42rem", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)" }}>{row.k}</span>
//                 <span style={{ fontFamily: "monospace", fontSize: "0.72rem", color: nodeColor(hovered.activityScore) }}>{row.v}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Graph canvas */}
//       <div
//         ref={wrapRef}
//         style={{
//           background: "#0A0A0F",
//           border: "1px solid rgba(255,255,255,0.07)",
//           borderRadius: "4px",
//           overflow: "hidden",
//           height: "calc(100vh - 280px)",
//           minHeight: "420px",
//           position: "relative",
//         }}
//       >
//         <svg ref={svgRef} width="100%" height="100%" />

//         {/* Corner watermark */}
//         <div style={{
//           position: "absolute", bottom: "1rem", right: "1.25rem",
//           fontFamily: "'Syncopate', sans-serif",
//           fontSize: "0.4rem", letterSpacing: "0.2em",
//           textTransform: "uppercase",
//           color: "rgba(255,255,255,0.1)",
//           userSelect: "none",
//           pointerEvents: "none",
//         }}>
//           Lumina · Graph Engine
//         </div>
//       </div>

//       <p style={{
//         marginTop: "0.75rem",
//         fontFamily: "'Syncopate', sans-serif",
//         fontSize: "0.42rem", letterSpacing: "0.15em",
//         textTransform: "uppercase",
//         color: "rgba(255,255,255,0.2)",
//       }}>
//         Node radius = activity score · Edge opacity = similarity weight
//       </p>
//     </div>
//   );
// }

"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import api from "@/lib/api";
import * as d3 from "d3";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectionType =
  | "product_interest"
  | "skin_type"
  | "hair_type"
  | "skin_concern"
  | "discovery"
  | "co_purchase"
  | "co_wishlist"
  | "co_review"
  | "chatbot_user";

interface GraphNode extends d3.SimulationNodeDatum {
  id:              string;
  name:            string;
  activityScore:   number;
  role:            string;
  skinType:        string | null;
  hairType:        string | null;
  skinConcerns:    string | null;
  discoverySource: string | null;
  ordersCount:     number;
  chatCount:       number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  weight:      number;
  types:       ConnectionType[];
  primaryType: ConnectionType;
}

// ─── Connection meta ──────────────────────────────────────────────────────────

const CONN: Record<ConnectionType, { label: string; color: string; dash?: string }> = {
  co_purchase:      { label: "Co-Purchase",        color: "#FFD700" },
  co_wishlist:      { label: "Co-Wishlist",         color: "#FF69B4" },
  co_review:        { label: "Co-Review",           color: "#87CEEB" },
  product_interest: { label: "Product Interest",    color: "#00FFFF" },
  skin_type:        { label: "Skin Type",           color: "#FF5F1F" },
  skin_concern:     { label: "Skin Concern",        color: "#FF9F43" },
  hair_type:        { label: "Hair Type",           color: "#9B59FF" },
  discovery:        { label: "Discovery Source",    color: "#00FF87", dash: "4,3" },
  chatbot_user:     { label: "Chatbot Users",       color: "#B8B8FF", dash: "2,4" },
};

const ALL_TYPES = Object.keys(CONN) as ConnectionType[];

// ─── Node appearance ──────────────────────────────────────────────────────────

function nodeRadius(score: number): number {
  return Math.max(7, Math.min(28, 7 + score / 10));
}
function nodeColor(score: number): string {
  if (score > 150) return "#FF5F1F";
  if (score > 60)  return "#00FFFF";
  if (score > 0)   return "#9B59FF";
  return "#3A3A5C"; // inactive
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminGraphPage() {
  const svgRef  = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [rawGraph, setRawGraph] = useState<{ nodes: GraphNode[]; links: GraphLink[] } | null>(null);
  const [loading, setLoading]   = useState(true);
  const [hovered, setHovered]   = useState<GraphNode | null>(null);
  const [hoveredLink, setHoveredLink] = useState<GraphLink | null>(null);

  // active filter: which connection types to show
  const [activeTypes, setActiveTypes] = useState<Set<ConnectionType>>(new Set(ALL_TYPES));

  const toggleType = (t: ConnectionType) =>
    setActiveTypes(prev => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });

  const stats = useMemo(() => {
    if (!rawGraph) return { nodes: 0, edges: 0, isolated: 0, connections: {} as Record<string, number> };
    const connectedIds = new Set<string>();
    const filteredLinks = rawGraph.links.filter(l =>
      l.types.some(t => activeTypes.has(t))
    );
    filteredLinks.forEach(l => {
      connectedIds.add((l.source as any).id ?? l.source);
      connectedIds.add((l.target as any).id ?? l.target);
    });
    const counts: Record<string, number> = {};
    for (const t of ALL_TYPES) {
      counts[t] = rawGraph.links.filter(l => l.types.includes(t)).length;
    }
    return {
      nodes: rawGraph.nodes.length,
      edges: filteredLinks.length,
      isolated: rawGraph.nodes.length - connectedIds.size,
      connections: counts,
    };
  }, [rawGraph, activeTypes]);

  // fetch
  useEffect(() => {
    api.get("/api/admin/graph/users")
      .then(res => setRawGraph(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  // build / rebuild graph whenever data or filters change
  const buildGraph = useCallback(() => {
    if (!rawGraph || !svgRef.current || !wrapRef.current) return;

    const width  = wrapRef.current.clientWidth  || 960;
    const height = wrapRef.current.clientHeight || 640;

    // filter links by active types
    const filteredLinks: GraphLink[] = rawGraph.links
      .filter(l => l.types.some(t => activeTypes.has(t)))
      .map(l => {
        // pick best visible primary type
        const visibleTypes = l.types.filter(t => activeTypes.has(t));
        const primaries = ALL_TYPES.filter(t => visibleTypes.includes(t));
        return { ...l, primaryType: primaries[0] ?? l.primaryType };
      });

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // ── Defs ─────────────────────────────────────────────────────────────────
    const defs = svg.append("defs");

    // glow filter
    const glow = defs.append("filter").attr("id", "glow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    glow.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "blur");
    const m1 = glow.append("feMerge");
    m1.append("feMergeNode").attr("in", "blur");
    m1.append("feMergeNode").attr("in", "SourceGraphic");

    // strong glow
    const glowS = defs.append("filter").attr("id", "glow-strong").attr("x", "-80%").attr("y", "-80%").attr("width", "260%").attr("height", "260%");
    glowS.append("feGaussianBlur").attr("stdDeviation", "7").attr("result", "blur");
    const m2 = glowS.append("feMerge");
    m2.append("feMergeNode").attr("in", "blur");
    m2.append("feMergeNode").attr("in", "SourceGraphic");

    // per-type arrowhead markers
    for (const [type, meta] of Object.entries(CONN)) {
      defs.append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 -4 8 8")
        .attr("refX", 14)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-4L8,0L0,4")
        .attr("fill", meta.color)
        .attr("opacity", 0.6);
    }

    // bg gradient
    const bg = defs.append("radialGradient").attr("id", "bg").attr("cx", "50%").attr("cy", "50%").attr("r", "70%");
    bg.append("stop").attr("offset", "0%").attr("stop-color", "#0E0E1C");
    bg.append("stop").attr("offset", "100%").attr("stop-color", "#080810");

    // ── Background ───────────────────────────────────────────────────────────
    svg.append("rect").attr("width", width).attr("height", height).attr("fill", "url(#bg)");

    // subtle dot grid
    const pattern = defs.append("pattern")
      .attr("id", "dots").attr("x", 0).attr("y", 0)
      .attr("width", 30).attr("height", 30)
      .attr("patternUnits", "userSpaceOnUse");
    pattern.append("circle").attr("cx", 1).attr("cy", 1).attr("r", 0.8).attr("fill", "rgba(255,255,255,0.06)");
    svg.append("rect").attr("width", width).attr("height", height).attr("fill", "url(#dots)");

    // ── Simulation ───────────────────────────────────────────────────────────
    const nodes: GraphNode[] = rawGraph.nodes.map(n => ({ ...n }));
    const links: GraphLink[] = filteredLinks.map(l => ({ ...l }));

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(d => {
          // closer for strong connections
          if (d.primaryType === "co_purchase") return 80;
          if (d.primaryType === "co_wishlist") return 90;
          if (d.primaryType === "skin_type")   return 100;
          return 130;
        })
        .strength(d => 0.3 + d.weight * 0.4)
      )
      .force("charge", d3.forceManyBody().strength(d => {
        const r = nodeRadius((d as GraphNode).activityScore);
        return -(180 + r * 8);
      }))
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.08))
      .force("collision", d3.forceCollide<GraphNode>()
        .radius(d => nodeRadius(d.activityScore) + 10)
      );

    // ── Layers ───────────────────────────────────────────────────────────────
    const zoomG  = svg.append("g");
    const linkG  = zoomG.append("g").attr("class", "links");
    const nodeG  = zoomG.append("g").attr("class", "nodes");
    const labelG = zoomG.append("g").attr("class", "labels");

    // ── Edges ─────────────────────────────────────────────────────────────────
    const linkSel = linkG.selectAll<SVGLineElement, GraphLink>("line")
      .data(links)
      .join("line")
      .attr("stroke", d => CONN[d.primaryType].color)
      .attr("stroke-opacity", d => 0.12 + d.weight * 0.45)
      .attr("stroke-width", d => {
        const multi = d.types.length > 1 ? 1.4 : 1;
        return Math.max(0.5, d.weight * 2.2 * multi);
      })
      .attr("stroke-dasharray", d => CONN[d.primaryType].dash ?? null)
      .attr("marker-end", d => `url(#arrow-${d.primaryType})`)
      .style("cursor", "pointer")
      .on("mouseenter", function(_, d) {
        d3.select(this)
          .attr("stroke-opacity", 0.9)
          .attr("stroke-width", Math.max(1.5, d.weight * 3));
        setHoveredLink(d);
      })
      .on("mouseleave", function(_, d) {
        d3.select(this)
          .attr("stroke-opacity", 0.12 + d.weight * 0.45)
          .attr("stroke-width", Math.max(0.5, d.weight * 2.2));
        setHoveredLink(null);
      });

    // multi-type indicator: a small perpendicular tick on edges with 2+ types
    const multiLinks = links.filter(l => l.types.length > 1);
    linkG.selectAll<SVGCircleElement, GraphLink>("circle.multi-badge")
      .data(multiLinks)
      .join("circle")
      .attr("class", "multi-badge")
      .attr("r", 4)
      .attr("fill", "#111")
      .attr("stroke", d => CONN[d.primaryType].color)
      .attr("stroke-width", 1)
      .style("pointer-events", "none");

    // ── Nodes ─────────────────────────────────────────────────────────────────
    const nodeGroup = nodeG.selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .style("cursor", "grab")
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on("start", (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on("drag",  (e, d) => { d.fx = e.x; d.fy = e.y; })
          .on("end",   (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    // glow halo (hidden for inactive)
    nodeGroup.append("circle")
      .attr("r",   d => nodeRadius(d.activityScore) + 7)
      .attr("fill", d => `${nodeColor(d.activityScore)}22`)
      .attr("filter", "url(#glow-strong)")
      .attr("opacity", d => d.activityScore > 0 ? 1 : 0);

    // ring
    nodeGroup.append("circle")
      .attr("r",            d => nodeRadius(d.activityScore) + 1.5)
      .attr("fill",         "none")
      .attr("stroke",       d => nodeColor(d.activityScore))
      .attr("stroke-width", 0.6)
      .attr("stroke-opacity", d => d.activityScore > 0 ? 0.5 : 0.15);

    // main circle
    nodeGroup.append("circle")
      .attr("r",            d => nodeRadius(d.activityScore))
      .attr("fill",         "#0E0E1C")
      .attr("stroke",       d => nodeColor(d.activityScore))
      .attr("stroke-width", d => d.role === "admin" || d.role === "super_admin" ? 2.5 : 1.2)
      .attr("filter",       d => d.activityScore > 0 ? "url(#glow)" : null);

    // inner dot
    nodeGroup.append("circle")
      .attr("r",    d => Math.max(1.5, nodeRadius(d.activityScore) / 5))
      .attr("fill", d => nodeColor(d.activityScore))
      .attr("opacity", d => d.activityScore > 0 ? 0.8 : 0.25);

    // admin crown marker
    nodeGroup.filter(d => d.role === "admin" || d.role === "super_admin")
      .append("text")
      .text("♦")
      .attr("text-anchor", "middle")
      .attr("dy", d => -(nodeRadius(d.activityScore) + 4))
      .attr("fill", "#FFD700")
      .attr("font-size", 7)
      .style("pointer-events", "none");

    // hover
    nodeGroup
      .on("mouseenter", function(_, d) {
        setHovered(d);
        d3.select(this).select("circle:nth-child(3)")
          .attr("stroke-width", 2.5)
          .transition().duration(150)
          .attr("r", nodeRadius(d.activityScore) + 3);
        // highlight connected edges
        linkSel
          .attr("stroke-opacity", l => {
            const sId = (l.source as GraphNode).id;
            const tId = (l.target as GraphNode).id;
            return (sId === d.id || tId === d.id) ? 0.95 : 0.04;
          })
          .attr("stroke-width", l => {
            const sId = (l.source as GraphNode).id;
            const tId = (l.target as GraphNode).id;
            return (sId === d.id || tId === d.id) ? Math.max(2, l.weight * 3) : 0.4;
          });
      })
      .on("mouseleave", function(_, d) {
        setHovered(null);
        d3.select(this).select("circle:nth-child(3)")
          .attr("stroke-width", d.role === "admin" || d.role === "super_admin" ? 2.5 : 1.2)
          .transition().duration(150)
          .attr("r", nodeRadius(d.activityScore));
        // restore edges
        linkSel
          .attr("stroke-opacity", l => 0.12 + l.weight * 0.45)
          .attr("stroke-width",   l => Math.max(0.5, l.weight * 2.2));
      });

    // ── Labels ───────────────────────────────────────────────────────────────
    labelG.selectAll<SVGTextElement, GraphNode>("text")
      .data(nodes)
      .join("text")
      .text(d => d.name.split(" ")[0])
      .attr("text-anchor", "middle")
      .attr("dy", d => -(nodeRadius(d.activityScore) + 7))
      .attr("fill", d => d.activityScore > 0 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.2)")
      .attr("font-size", d => d.activityScore > 80 ? 10 : 8)
      .attr("font-family", "'Syncopate', monospace")
      .attr("letter-spacing", "0.08em")
      .style("pointer-events", "none")
      .style("user-select", "none");

    // ── Multi-badge positions ──────────────────────────────────────────────────
    const multiBadges = linkG.selectAll<SVGCircleElement, GraphLink>("circle.multi-badge");

    // ── Tick ─────────────────────────────────────────────────────────────────
    simulation.on("tick", () => {
      linkSel
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      labelG.selectAll<SVGTextElement, GraphNode>("text")
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);

      multiBadges.attr("cx", (d: any) => ((d.source.x + d.target.x) / 2))
                 .attr("cy", (d: any) => ((d.source.y + d.target.y) / 2));
    });

    // ── Zoom & Pan ───────────────────────────────────────────────────────────
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 5])
      .on("zoom", e => zoomG.attr("transform", e.transform));
    svg.call(zoom);

    return () => simulation.stop();
  }, [rawGraph, activeTypes]);

  useEffect(() => {
    const cleanup = buildGraph();
    return cleanup;
  }, [buildGraph]);

  // ── UI ─────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={S.centred}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#00FFFF",
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
        <p style={S.mono}>BUILDING GRAPH…</p>
        <style>{`@keyframes pulse { 0%,100%{opacity:.15;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
      </div>
    );
  }

  if (!rawGraph) {
    return <div style={S.centred}><p style={S.mono}>NO DATA AVAILABLE</p></div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080810", color: "#fff", padding: 0 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <p style={S.title}>User Relationship Graph</p>
        <p style={S.subtitle}>
          {stats.nodes} users · {stats.edges} connections visible
          {stats.isolated > 0 && ` · ${stats.isolated} isolated`}
          &nbsp;·&nbsp;drag · scroll to zoom
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem" }}>
        {ALL_TYPES.map(t => {
          const active = activeTypes.has(t);
          const count  = stats.connections[t] || 0;
          return (
            <button
              key={t}
              onClick={() => toggleType(t)}
              style={{
                background:   active ? `${CONN[t].color}18` : "rgba(255,255,255,0.03)",
                border:       `1px solid ${active ? CONN[t].color : "rgba(255,255,255,0.1)"}`,
                borderRadius: "3px",
                padding:      "0.3rem 0.65rem",
                cursor:       "pointer",
                display:      "flex",
                alignItems:   "center",
                gap:          "0.4rem",
                transition:   "all 0.15s",
                opacity:      count === 0 ? 0.35 : 1,
              }}
            >
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: active ? CONN[t].color : "transparent",
                border:     `1px solid ${CONN[t].color}`,
                flexShrink: 0,
                boxShadow:  active ? `0 0 5px ${CONN[t].color}` : "none",
              }} />
              <span style={{
                fontFamily: "'Syncopate', monospace",
                fontSize: "0.41rem",
                letterSpacing: "0.12em",
                color: active ? CONN[t].color : "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
              }}>
                {CONN[t].label}
              </span>
              <span style={{
                fontFamily: "monospace",
                fontSize: "0.6rem",
                color: "rgba(255,255,255,0.3)",
              }}>
                {count}
              </span>
            </button>
          );
        })}

        {/* quick toggles */}
        <button onClick={() => setActiveTypes(new Set(ALL_TYPES))} style={S.smallBtn}>ALL</button>
        <button onClick={() => setActiveTypes(new Set())} style={S.smallBtn}>NONE</button>
      </div>

      {/* ── Graph canvas ── */}
      <div
        ref={wrapRef}
        style={{
          width: "100%", height: "60vh", minHeight: 480,
          background: "#080810",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "4px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <svg ref={svgRef} width="100%" height="100%" />

        {/* ── Node tooltip ── */}
        {hovered && (
          <div style={{
            position: "absolute",
            top: "1rem", right: "1rem",
            background: "#0D0D1A",
            border: `1px solid ${nodeColor(hovered.activityScore)}`,
            borderRadius: "4px",
            padding: "1rem 1.2rem",
            minWidth: 210,
            pointerEvents: "none",
            boxShadow: `0 0 24px ${nodeColor(hovered.activityScore)}33`,
            zIndex: 100,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: nodeColor(hovered.activityScore),
                boxShadow: `0 0 8px ${nodeColor(hovered.activityScore)}`,
                flexShrink: 0,
              }} />
              <p style={{ fontFamily: "'Syncopate', monospace", fontSize: "0.65rem", letterSpacing: "0.12em", color: "#fff", fontWeight: 700 }}>
                {hovered.name}
              </p>
            </div>
            <TooltipRow k="Role"      v={hovered.role} color={hovered.role !== "user" ? "#FFD700" : undefined} />
            <TooltipRow k="Activity"  v={hovered.activityScore} />
            <TooltipRow k="Orders"    v={hovered.ordersCount} />
            <TooltipRow k="Chat msgs" v={hovered.chatCount} />
            {hovered.skinType        && <TooltipRow k="Skin"      v={hovered.skinType}        color="#FF5F1F" />}
            {hovered.hairType        && <TooltipRow k="Hair"      v={hovered.hairType}        color="#9B59FF" />}
            {hovered.skinConcerns    && <TooltipRow k="Concern"   v={hovered.skinConcerns}    color="#FF9F43" />}
            {hovered.discoverySource && <TooltipRow k="Heard via" v={hovered.discoverySource} color="#00FF87" />}
          </div>
        )}

        {/* ── Edge tooltip ── */}
        {hoveredLink && !hovered && (
          <div style={{
            position: "absolute",
            top: "1rem", right: "1rem",
            background: "#0D0D1A",
            border: `1px solid ${CONN[hoveredLink.primaryType].color}`,
            borderRadius: "4px",
            padding: "0.85rem 1.1rem",
            minWidth: 190,
            pointerEvents: "none",
            boxShadow: `0 0 18px ${CONN[hoveredLink.primaryType].color}33`,
            zIndex: 100,
          }}>
            <p style={{ fontFamily: "'Syncopate', monospace", fontSize: "0.48rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", marginBottom: "0.6rem" }}>
              CONNECTION
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {hoveredLink.types.map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: CONN[t].color, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Syncopate', monospace", fontSize: "0.42rem", letterSpacing: "0.1em", color: CONN[t].color }}>
                    {CONN[t].label}
                  </span>
                </div>
              ))}
              <p style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", marginTop: "0.35rem" }}>
                weight: {(hoveredLink.weight * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom stat bar ── */}
      <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
        {[
          { label: "Total Users",    value: stats.nodes,    color: "#fff" },
          { label: "Connections",    value: stats.edges,    color: "#00FFFF" },
          { label: "Isolated",       value: stats.isolated, color: "rgba(255,255,255,0.3)" },
        ].map(s => (
          <div key={s.label} style={{
            background: "#111118",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "3px",
            padding: "0.5rem 1rem",
          }}>
            <p style={{ fontFamily: "'Syncopate', monospace", fontSize: "1.1rem", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontFamily: "'Syncopate', monospace", fontSize: "0.38rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginTop: "0.2rem" }}>{s.label}</p>
          </div>
        ))}
        <div style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: "1.2rem",
          background: "#111118",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "3px",
          padding: "0.5rem 1rem",
        }}>
          {[
            { color: "#FF5F1F", label: ">150 score" },
            { color: "#00FFFF", label: ">60 score" },
            { color: "#9B59FF", label: "active" },
            { color: "#3A3A5C", label: "inactive" },
            { color: "#FFD700", label: "admin ♦" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: l.color, boxShadow: `0 0 4px ${l.color}`, flexShrink: 0 }} />
              <span style={{ fontFamily: "'Syncopate', monospace", fontSize: "0.38rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function TooltipRow({ k, v, color }: { k: string; v: string | number | null; color?: string }) {
  if (v === null || v === undefined || v === 0 && k !== "Orders") return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1.5rem", marginBottom: "0.3rem" }}>
      <span style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}>{k}</span>
      <span style={{ fontFamily: "monospace", fontSize: "0.6rem", color: color ?? "rgba(255,255,255,0.75)" }}>{v}</span>
    </div>
  );
}

// ─── Static styles ─────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  centred: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    height: "60vh", gap: "1rem",
  },
  title: {
    fontFamily: "'Syncopate', monospace",
    fontSize: "1.05rem", fontWeight: 700,
    letterSpacing: "0.22em", textTransform: "uppercase",
    color: "#fff", marginBottom: "0.3rem",
  },
  subtitle: {
    fontFamily: "'Syncopate', monospace",
    fontSize: "0.44rem", letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.3)",
  },
  mono: {
    fontFamily: "'Syncopate', monospace",
    fontSize: "0.48rem", letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.3)",
  },
  smallBtn: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "3px",
    padding: "0.3rem 0.55rem",
    cursor: "pointer",
    fontFamily: "'Syncopate', monospace",
    fontSize: "0.4rem",
    letterSpacing: "0.15em",
    color: "rgba(255,255,255,0.4)",
    alignSelf: "center",
  },
};