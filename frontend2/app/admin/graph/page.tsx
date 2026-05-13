"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import api from "@/lib/api";
import * as d3 from "d3";
import { useD } from "@/components/admin/AdminTokensContext";
import { AdminTokens } from "@/lib/adminTokens";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectionType =
  | "product_interest" | "skin_type" | "hair_type" | "skin_concern"
  | "discovery" | "co_purchase" | "co_wishlist" | "co_review" | "chatbot_user";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string; name: string; activityScore: number; role: string;
  skinType: string | null; hairType: string | null;
  skinConcerns: string | null; discoverySource: string | null;
  ordersCount: number; chatCount: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  weight: number; types: ConnectionType[]; primaryType: ConnectionType;
}

const ALL_TYPES: ConnectionType[] = [
  "product_interest","skin_type","hair_type","skin_concern",
  "discovery","co_purchase","co_wishlist","co_review","chatbot_user",
];

// ─── Theme-aware connection colours ──────────────────────────────────────────

function getConn(D: AdminTokens): Record<ConnectionType, { label: string; color: string; dash?: string }> {
  const dark = D.bg === "#0A0A0F";
  return {
    co_purchase:      { label: "Co-Purchase",     color: D.yellow },
    co_wishlist:      { label: "Co-Wishlist",      color: dark ? "#FF69B4" : "#B03070" },
    co_review:        { label: "Co-Review",        color: dark ? "#87CEEB" : "#2E7AAF" },
    product_interest: { label: "Product Interest", color: D.cyan },
    skin_type:        { label: "Skin Type",        color: D.orange },
    skin_concern:     { label: "Skin Concern",     color: dark ? "#FF9F43" : "#B86000" },
    hair_type:        { label: "Hair Type",        color: D.purple },
    discovery:        { label: "Discovery Source", color: D.green, dash: "4,3" },
    chatbot_user:     { label: "Chatbot Users",    color: dark ? "#B8B8FF" : "#6060CC", dash: "2,4" },
  };
}

// ─── Theme-aware node colour ──────────────────────────────────────────────────

function nodeRadius(score: number): number {
  return Math.max(7, Math.min(28, 7 + score / 10));
}

function getNodeColor(score: number, D: AdminTokens): string {
  if (score > 150) return D.orange;
  if (score > 60)  return D.cyan;
  if (score > 0)   return D.purple;
  return D.bg === "#0A0A0F" ? "#3A3A5C" : "#AAAABC";
}

// ─── Theme-aware static styles ────────────────────────────────────────────────

function makeS(D: AdminTokens): Record<string, React.CSSProperties> {
  return {
    centred: {
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "60vh", gap: "1rem",
    },
    title: {
      fontFamily: D.font, fontSize: "1.05rem", fontWeight: 700,
      letterSpacing: "0.22em", textTransform: "uppercase" as const,
      color: D.text, marginBottom: "0.3rem",
    },
    subtitle: {
      fontFamily: D.font, fontSize: "0.44rem",
      letterSpacing: "0.18em", textTransform: "uppercase" as const,
      color: D.dim,
    },
    mono: {
      fontFamily: D.mono, fontSize: "0.48rem",
      letterSpacing: "0.3em", textTransform: "uppercase" as const,
      color: D.dim,
    },
    smallBtn: {
      background: D.panelB, border: `1px solid ${D.border}`,
      borderRadius: "3px", padding: "0.3rem 0.55rem", cursor: "pointer",
      fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.15em",
      color: D.dim, alignSelf: "center",
    } as React.CSSProperties,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminGraphPage() {
  const D    = useD();
  const CONN = useMemo(() => getConn(D), [D]);
  const S    = useMemo(() => makeS(D),   [D]);
  const nc   = useCallback((score: number) => getNodeColor(score, D), [D]);

  const svgRef  = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [rawGraph, setRawGraph] = useState<{ nodes: GraphNode[]; links: GraphLink[] } | null>(null);
  const [loading, setLoading]   = useState(true);
  const [hovered, setHovered]   = useState<GraphNode | null>(null);
  const [hoveredLink, setHoveredLink] = useState<GraphLink | null>(null);
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
    const filteredLinks = rawGraph.links.filter(l => l.types.some(t => activeTypes.has(t)));
    filteredLinks.forEach(l => {
      connectedIds.add((l.source as any).id ?? l.source);
      connectedIds.add((l.target as any).id ?? l.target);
    });
    const counts: Record<string, number> = {};
    for (const t of ALL_TYPES) counts[t] = rawGraph.links.filter(l => l.types.includes(t)).length;
    return {
      nodes: rawGraph.nodes.length, edges: filteredLinks.length,
      isolated: rawGraph.nodes.length - connectedIds.size, connections: counts,
    };
  }, [rawGraph, activeTypes]);

  useEffect(() => {
    api.get("/api/admin/graph/users")
      .then(res => setRawGraph(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const buildGraph = useCallback(() => {
    if (!rawGraph || !svgRef.current || !wrapRef.current) return;

    const width  = wrapRef.current.clientWidth  || 960;
    const height = wrapRef.current.clientHeight || 640;

    const filteredLinks: GraphLink[] = rawGraph.links
      .filter(l => l.types.some(t => activeTypes.has(t)))
      .map(l => {
        const visibleTypes = l.types.filter(t => activeTypes.has(t));
        const primaries = ALL_TYPES.filter(t => visibleTypes.includes(t));
        return { ...l, primaryType: primaries[0] ?? l.primaryType };
      });

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // ── Defs ──────────────────────────────────────────────────────────────────
    const defs = svg.append("defs");

    const glow = defs.append("filter").attr("id", "glow")
      .attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    glow.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "blur");
    const m1 = glow.append("feMerge");
    m1.append("feMergeNode").attr("in", "blur");
    m1.append("feMergeNode").attr("in", "SourceGraphic");

    const glowS = defs.append("filter").attr("id", "glow-strong")
      .attr("x", "-80%").attr("y", "-80%").attr("width", "260%").attr("height", "260%");
    glowS.append("feGaussianBlur").attr("stdDeviation", "7").attr("result", "blur");
    const m2 = glowS.append("feMerge");
    m2.append("feMergeNode").attr("in", "blur");
    m2.append("feMergeNode").attr("in", "SourceGraphic");

    for (const [type, meta] of Object.entries(CONN)) {
      defs.append("marker")
        .attr("id", `arrow-${type}`).attr("viewBox", "0 -4 8 8")
        .attr("refX", 14).attr("markerWidth", 5).attr("markerHeight", 5).attr("orient", "auto")
        .append("path").attr("d", "M0,-4L8,0L0,4").attr("fill", meta.color).attr("opacity", 0.6);
    }

    // bg gradient uses D tokens
    const bgGrad = defs.append("radialGradient").attr("id", "bg")
      .attr("cx", "50%").attr("cy", "50%").attr("r", "70%");
    bgGrad.append("stop").attr("offset", "0%").attr("stop-color", D.panel);
    bgGrad.append("stop").attr("offset", "100%").attr("stop-color", D.bg);
    svg.append("rect").attr("width", width).attr("height", height).attr("fill", "url(#bg)");

    // dot grid
    const pattern = defs.append("pattern").attr("id", "dots")
      .attr("x", 0).attr("y", 0).attr("width", 30).attr("height", 30)
      .attr("patternUnits", "userSpaceOnUse");
    pattern.append("circle").attr("cx", 1).attr("cy", 1).attr("r", 0.8).attr("fill", D.border);
    svg.append("rect").attr("width", width).attr("height", height).attr("fill", "url(#dots)");

    // ── Simulation ────────────────────────────────────────────────────────────
    const nodes: GraphNode[] = rawGraph.nodes.map(n => ({ ...n }));
    const links: GraphLink[] = filteredLinks.map(l => ({ ...l }));

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(d => {
          if (d.primaryType === "co_purchase") return 80;
          if (d.primaryType === "co_wishlist") return 90;
          if (d.primaryType === "skin_type")   return 100;
          return 130;
        })
        .strength(d => 0.3 + d.weight * 0.4))
      .force("charge", d3.forceManyBody().strength(d => -(180 + nodeRadius((d as GraphNode).activityScore) * 8)))
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.08))
      .force("collision", d3.forceCollide<GraphNode>().radius(d => nodeRadius(d.activityScore) + 10));

    const zoomG  = svg.append("g");
    const linkG  = zoomG.append("g").attr("class", "links");
    const nodeG  = zoomG.append("g").attr("class", "nodes");
    const labelG = zoomG.append("g").attr("class", "labels");

    // ── Edges ─────────────────────────────────────────────────────────────────
    const linkSel = linkG.selectAll<SVGLineElement, GraphLink>("line")
      .data(links).join("line")
      .attr("stroke", d => CONN[d.primaryType].color)
      .attr("stroke-opacity", d => 0.12 + d.weight * 0.45)
      .attr("stroke-width", d => Math.max(0.5, d.weight * 2.2 * (d.types.length > 1 ? 1.4 : 1)))
      .attr("stroke-dasharray", d => CONN[d.primaryType].dash ?? null)
      .attr("marker-end", d => `url(#arrow-${d.primaryType})`)
      .style("cursor", "pointer")
      .on("mouseenter", function(_, d) {
        d3.select(this).attr("stroke-opacity", 0.9).attr("stroke-width", Math.max(1.5, d.weight * 3));
        setHoveredLink(d);
      })
      .on("mouseleave", function(_, d) {
        d3.select(this).attr("stroke-opacity", 0.12 + d.weight * 0.45).attr("stroke-width", Math.max(0.5, d.weight * 2.2));
        setHoveredLink(null);
      });

    const multiLinks = links.filter(l => l.types.length > 1);
    linkG.selectAll<SVGCircleElement, GraphLink>("circle.multi-badge")
      .data(multiLinks).join("circle")
      .attr("class", "multi-badge").attr("r", 4)
      .attr("fill", D.panel)
      .attr("stroke", d => CONN[d.primaryType].color)
      .attr("stroke-width", 1).style("pointer-events", "none");

    // ── Nodes ─────────────────────────────────────────────────────────────────
    const nodeGroup = nodeG.selectAll<SVGGElement, GraphNode>("g")
      .data(nodes).join("g")
      .style("cursor", "grab")
      .call(d3.drag<SVGGElement, GraphNode>()
        .on("start", (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag",  (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on("end",   (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

    nodeGroup.append("circle")
      .attr("r", d => nodeRadius(d.activityScore) + 7)
      .attr("fill", d => `${nc(d.activityScore)}22`)
      .attr("filter", "url(#glow-strong)")
      .attr("opacity", d => d.activityScore > 0 ? 1 : 0);

    nodeGroup.append("circle")
      .attr("r", d => nodeRadius(d.activityScore) + 1.5)
      .attr("fill", "none")
      .attr("stroke", d => nc(d.activityScore))
      .attr("stroke-width", 0.6)
      .attr("stroke-opacity", d => d.activityScore > 0 ? 0.5 : 0.15);

    nodeGroup.append("circle")
      .attr("r", d => nodeRadius(d.activityScore))
      .attr("fill", D.panelB)
      .attr("stroke", d => nc(d.activityScore))
      .attr("stroke-width", d => d.role === "admin" || d.role === "super_admin" ? 2.5 : 1.2)
      .attr("filter", d => d.activityScore > 0 ? "url(#glow)" : null);

    nodeGroup.append("circle")
      .attr("r", d => Math.max(1.5, nodeRadius(d.activityScore) / 5))
      .attr("fill", d => nc(d.activityScore))
      .attr("opacity", d => d.activityScore > 0 ? 0.8 : 0.25);

    nodeGroup.filter(d => d.role === "admin" || d.role === "super_admin")
      .append("text").text("♦")
      .attr("text-anchor", "middle")
      .attr("dy", d => -(nodeRadius(d.activityScore) + 4))
      .attr("fill", D.yellow).attr("font-size", 7)
      .style("pointer-events", "none");

    nodeGroup
      .on("mouseenter", function(_, d) {
        setHovered(d);
        d3.select(this).select("circle:nth-child(3)")
          .attr("stroke-width", 2.5).transition().duration(150).attr("r", nodeRadius(d.activityScore) + 3);
        linkSel
          .attr("stroke-opacity", l => {
            const sId = (l.source as GraphNode).id; const tId = (l.target as GraphNode).id;
            return (sId === d.id || tId === d.id) ? 0.95 : 0.04;
          })
          .attr("stroke-width", l => {
            const sId = (l.source as GraphNode).id; const tId = (l.target as GraphNode).id;
            return (sId === d.id || tId === d.id) ? Math.max(2, l.weight * 3) : 0.4;
          });
      })
      .on("mouseleave", function(_, d) {
        setHovered(null);
        d3.select(this).select("circle:nth-child(3)")
          .attr("stroke-width", d.role === "admin" || d.role === "super_admin" ? 2.5 : 1.2)
          .transition().duration(150).attr("r", nodeRadius(d.activityScore));
        linkSel
          .attr("stroke-opacity", l => 0.12 + l.weight * 0.45)
          .attr("stroke-width", l => Math.max(0.5, l.weight * 2.2));
      });

    // ── Labels ────────────────────────────────────────────────────────────────
    labelG.selectAll<SVGTextElement, GraphNode>("text")
      .data(nodes).join("text")
      .text(d => d.name.split(" ")[0])
      .attr("text-anchor", "middle")
      .attr("dy", d => -(nodeRadius(d.activityScore) + 7))
      .attr("fill", d => d.activityScore > 0 ? D.muted : D.dim)
      .attr("font-size", d => d.activityScore > 80 ? 10 : 8)
      .attr("font-family", D.font)
      .attr("letter-spacing", "0.08em")
      .style("pointer-events", "none")
      .style("user-select", "none");

    const multiBadges = linkG.selectAll<SVGCircleElement, GraphLink>("circle.multi-badge");

    simulation.on("tick", () => {
      linkSel
        .attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      labelG.selectAll<SVGTextElement, GraphNode>("text")
        .attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
      multiBadges
        .attr("cx", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("cy", (d: any) => (d.source.y + d.target.y) / 2);
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 5])
      .on("zoom", e => zoomG.attr("transform", e.transform));
    svg.call(zoom);

    return () => simulation.stop();
  }, [rawGraph, activeTypes, D, CONN, nc]);

  useEffect(() => { const cleanup = buildGraph(); return cleanup; }, [buildGraph]);

  // ── UI ─────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={S.centred}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: "50%", background: D.cyan,
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
        <p style={S.mono}>BUILDING GRAPH…</p>
        <style>{`@keyframes pulse{0%,100%{opacity:.15;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
      </div>
    );
  }

  if (!rawGraph) {
    return <div style={S.centred}><p style={S.mono}>NO DATA AVAILABLE</p></div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: D.bg, color: D.text, padding: 0 }}>

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
            <button key={t} onClick={() => toggleType(t)} style={{
              background:   active ? `${CONN[t].color}18` : D.panelB,
              border:       `1px solid ${active ? CONN[t].color : D.border}`,
              borderRadius: "3px", padding: "0.3rem 0.65rem", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "0.4rem",
              transition: "all 0.15s", opacity: count === 0 ? 0.35 : 1,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: active ? CONN[t].color : "transparent",
                border: `1px solid ${CONN[t].color}`, flexShrink: 0,
                boxShadow: active ? `0 0 5px ${CONN[t].color}` : "none",
              }} />
              <span style={{
                fontFamily: D.font, fontSize: "0.41rem", letterSpacing: "0.12em",
                color: active ? CONN[t].color : D.dim, textTransform: "uppercase",
              }}>
                {CONN[t].label}
              </span>
              <span style={{ fontFamily: D.mono, fontSize: "0.6rem", color: D.dim }}>{count}</span>
            </button>
          );
        })}
        <button onClick={() => setActiveTypes(new Set(ALL_TYPES))} style={S.smallBtn}>ALL</button>
        <button onClick={() => setActiveTypes(new Set())} style={S.smallBtn}>NONE</button>
      </div>

      {/* ── Graph canvas ── */}
      <div ref={wrapRef} style={{
        width: "100%", height: "60vh", minHeight: 480,
        background: D.bg, border: `1px solid ${D.border}`,
        borderRadius: "4px", overflow: "hidden", position: "relative",
      }}>
        <svg ref={svgRef} width="100%" height="100%" />

        {/* Node tooltip */}
        {hovered && (
          <div style={{
            position: "absolute", top: "1rem", right: "1rem",
            background: D.panelB, border: `1px solid ${nc(hovered.activityScore)}`,
            borderRadius: "4px", padding: "1rem 1.2rem", minWidth: 210,
            pointerEvents: "none", boxShadow: `0 0 24px ${nc(hovered.activityScore)}33`, zIndex: 100,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: nc(hovered.activityScore), boxShadow: `0 0 8px ${nc(hovered.activityScore)}`, flexShrink: 0 }} />
              <p style={{ fontFamily: D.font, fontSize: "0.65rem", letterSpacing: "0.12em", color: D.text, fontWeight: 700 }}>
                {hovered.name}
              </p>
            </div>
            <TooltipRow k="Role"      v={hovered.role} color={hovered.role !== "user" ? D.yellow : undefined} />
            <TooltipRow k="Activity"  v={hovered.activityScore} />
            <TooltipRow k="Orders"    v={hovered.ordersCount} />
            <TooltipRow k="Chat msgs" v={hovered.chatCount} />
            {hovered.skinType        && <TooltipRow k="Skin"      v={hovered.skinType}        color={D.orange} />}
            {hovered.hairType        && <TooltipRow k="Hair"      v={hovered.hairType}        color={D.purple} />}
            {hovered.skinConcerns    && <TooltipRow k="Concern"   v={hovered.skinConcerns}    color={D.yellow} />}
            {hovered.discoverySource && <TooltipRow k="Heard via" v={hovered.discoverySource} color={D.green}  />}
          </div>
        )}

        {/* Edge tooltip */}
        {hoveredLink && !hovered && (
          <div style={{
            position: "absolute", top: "1rem", right: "1rem",
            background: D.panelB, border: `1px solid ${CONN[hoveredLink.primaryType].color}`,
            borderRadius: "4px", padding: "0.85rem 1.1rem", minWidth: 190,
            pointerEvents: "none", boxShadow: `0 0 18px ${CONN[hoveredLink.primaryType].color}33`, zIndex: 100,
          }}>
            <p style={{ fontFamily: D.font, fontSize: "0.48rem", color: D.dim, letterSpacing: "0.15em", marginBottom: "0.6rem" }}>
              CONNECTION
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {hoveredLink.types.map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: CONN[t].color, flexShrink: 0 }} />
                  <span style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.1em", color: CONN[t].color }}>
                    {CONN[t].label}
                  </span>
                </div>
              ))}
              <p style={{ fontFamily: D.mono, fontSize: "0.6rem", color: D.dim, marginTop: "0.35rem" }}>
                weight: {(hoveredLink.weight * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom stat bar ── */}
      <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
        {[
          { label: "Total Users",  value: stats.nodes,    color: D.text },
          { label: "Connections",  value: stats.edges,    color: D.cyan },
          { label: "Isolated",     value: stats.isolated, color: D.dim  },
        ].map(s => (
          <div key={s.label} style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: "3px", padding: "0.5rem 1rem" }}>
            <p style={{ fontFamily: D.font, fontSize: "1.1rem", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.15em", textTransform: "uppercase", color: D.dim, marginTop: "0.2rem" }}>{s.label}</p>
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "1.2rem", background: D.panel, border: `1px solid ${D.border}`, borderRadius: "3px", padding: "0.5rem 1rem" }}>
          {[
            { color: D.orange, label: ">150 score" },
            { color: D.cyan,   label: ">60 score" },
            { color: D.purple, label: "active" },
            { color: D.bg === "#0A0A0F" ? "#3A3A5C" : "#AAAABC", label: "inactive" },
            { color: D.yellow, label: "admin ♦" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: l.color, boxShadow: `0 0 4px ${l.color}`, flexShrink: 0 }} />
              <span style={{ fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.1em", color: D.dim }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TooltipRow({ k, v, color }: { k: string; v: string | number | null; color?: string }) {
  const D = useD();
  if (v === null || v === undefined || (v === 0 && k !== "Orders")) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1.5rem", marginBottom: "0.3rem" }}>
      <span style={{ fontFamily: D.mono, fontSize: "0.6rem", color: D.dim }}>{k}</span>
      <span style={{ fontFamily: D.mono, fontSize: "0.6rem", color: color ?? D.muted }}>{v}</span>
    </div>
  );
}
