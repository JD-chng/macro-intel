import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { GRAPH_NODES, GRAPH_LINKS } from "../data/seed.js";
import { SectionTitle, Chip } from "./shared.jsx";

function findStrongestChain(startId, nodes, links) {
  // BFS to find the strongest causal chain from startId
  const visited = new Set([startId]);
  const chain = [startId];
  const chainLinks = [];
  let current = startId;
  for (let depth = 0; depth < 5; depth++) {
    const outgoing = links
      .filter(l => (l.source?.id || l.source) === current && !visited.has(l.target?.id || l.target))
      .sort((a, b) => b.weight - a.weight);
    if (!outgoing.length) break;
    const best = outgoing[0];
    const nextId = best.target?.id || best.target;
    chain.push(nextId);
    chainLinks.push(best);
    visited.add(nextId);
    current = nextId;
  }
  return { chain, chainLinks };
}

export default function KnowledgeGraph() {
  const svgRef = useRef(null);
  const simRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [chain, setChain] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [focusNode, setFocusNode] = useState(null);

  const handleSearch = (q) => {
    setSearchQ(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchResults(GRAPH_NODES.filter(n => n.id.toLowerCase().includes(q.toLowerCase())));
  };

  const focusOnNode = (nodeId) => {
    setFocusNode(nodeId);
    const node = GRAPH_NODES.find(n => n.id === nodeId);
    if (node) {
      setSelected(node);
      const { chain: c, chainLinks: cl } = findStrongestChain(nodeId, GRAPH_NODES, GRAPH_LINKS);
      setChain({ ids: c, links: cl });
    }
    setSearchQ("");
    setSearchResults([]);
  };

  useEffect(() => {
    if (!svgRef.current) return;
    const el = svgRef.current;
    const W = el.clientWidth || 700, H = 420;
    d3.select(el).selectAll("*").remove();

    const chainSet = new Set(chain?.ids || []);
    const svg = d3.select(el).attr("viewBox", `0 0 ${W} ${H}`);

    const nodes = GRAPH_NODES.map(n => ({ ...n }));
    const links = GRAPH_LINKS.map(l => ({ ...l }));

    svg.append("defs").append("marker").attr("id", "arr").attr("viewBox", "0 -4 8 8")
      .attr("refX", 24).attr("refY", 0).attr("markerWidth", 5).attr("markerHeight", 5)
      .attr("orient", "auto").append("path").attr("d", "M0,-4L8,0L0,4").attr("fill", "#ffffff18");

    svg.append("defs").append("marker").attr("id", "arr-chain").attr("viewBox", "0 -4 8 8")
      .attr("refX", 24).attr("refY", 0).attr("markerWidth", 6).attr("markerHeight", 6)
      .attr("orient", "auto").append("path").attr("d", "M0,-4L8,0L0,4").attr("fill", "#f0a500");

    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(110).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-280))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide().radius(d => d.size + 18));
    simRef.current = sim;

    const link = svg.append("g").selectAll("line").data(links).enter().append("line")
      .attr("stroke", l => {
        const src = l.source?.id || l.source, tgt = l.target?.id || l.target;
        const inChain = chain?.ids && chain.ids.includes(src) && chain.ids.includes(tgt);
        return inChain ? "#f0a500" : "rgba(255,255,255,0.12)";
      })
      .attr("stroke-width", l => {
        const src = l.source?.id || l.source, tgt = l.target?.id || l.target;
        const inChain = chain?.ids && chain.ids.includes(src) && chain.ids.includes(tgt);
        return inChain ? 2.5 : l.weight * 1.5;
      })
      .attr("marker-end", l => {
        const src = l.source?.id || l.source, tgt = l.target?.id || l.target;
        const inChain = chain?.ids && chain.ids.includes(src) && chain.ids.includes(tgt);
        return inChain ? "url(#arr-chain)" : "url(#arr)";
      });

    const node = svg.append("g").selectAll("g").data(nodes).enter().append("g")
      .style("cursor", "pointer")
      .on("click", (e, d) => focusOnNode(d.id))
      .call(d3.drag()
        .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on("end", (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

    node.append("circle")
      .attr("r", d => chainSet.has(d.id) ? d.size + 3 : d.size)
      .attr("fill", d => d.color + (chainSet.has(d.id) ? "44" : "22"))
      .attr("stroke", d => chainSet.has(d.id) ? d.color : d.color + "88")
      .attr("stroke-width", d => chainSet.has(d.id) ? 2.5 : 1.5);

    node.append("text").text(d => d.id.length > 14 ? d.id.slice(0, 13) + "…" : d.id)
      .attr("text-anchor", "middle").attr("dy", d => d.size + 13)
      .attr("fill", d => chainSet.has(d.id) ? "#e8eaf0" : "#8892a4").attr("font-size", 9.5).attr("font-family", "'Space Mono',monospace");

    node.append("text").text(d => ({ theme: "◉", asset: "◈", institution: "◆", indicator: "◇" }[d.group] || "●"))
      .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
      .attr("fill", d => chainSet.has(d.id) ? d.color : d.color + "aa").attr("font-size", d => d.size * 0.75);

    sim.on("tick", () => {
      link.attr("x1", d => Math.max(30, Math.min(W-30, d.source.x))).attr("y1", d => Math.max(30, Math.min(H-30, d.source.y)))
          .attr("x2", d => Math.max(30, Math.min(W-30, d.target.x))).attr("y2", d => Math.max(30, Math.min(H-30, d.target.y)));
      node.attr("transform", d => `translate(${Math.max(30, Math.min(W-30, d.x))},${Math.max(30, Math.min(H-30, d.y))})`);
    });

    return () => sim.stop();
  }, [chain]);

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <SectionTitle>Macro Relationships — Knowledge Graph</SectionTitle>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <input value={searchQ} onChange={e => handleSearch(e.target.value)}
              placeholder="Search node (e.g. US Tariffs, Fed Policy, JPY...)"
              style={{ width: "100%", background: "var(--bg1)", border: "1px solid var(--borderlit)", borderRadius: 6, padding: "9px 12px", color: "var(--tp)", fontFamily: "'Space Mono',monospace", fontSize: 13 }} />
            {searchResults.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--card-bg)", border: "1px solid var(--borderlit)", borderRadius: 8, zIndex: 10, overflow: "hidden", marginTop: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
                {searchResults.map(n => (
                  <div key={n.id} onClick={() => focusOnNode(n.id)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--tp)" }}>{n.id}</span>
                    <span style={{ color: "var(--ts)", fontSize: 11, textTransform: "capitalize", marginLeft: "auto" }}>{n.group}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[["theme","var(--red)"],["asset","var(--cyan)"],["institution","var(--green)"],["indicator","var(--yellow)"]].map(([k,c]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
                <span style={{ color: "var(--ts)", fontSize: 12, textTransform: "capitalize" }}>{k}</span>
              </div>
            ))}
          </div>
        </div>
        <svg ref={svgRef} style={{ width: "100%", height: 420, background: "var(--bg1)", borderRadius: 8, border: "1px solid var(--border)" }} />
        <div style={{ color: "var(--tm)", fontSize: 11, fontFamily: "monospace", marginTop: 8, textAlign: "center" }}>
          Click a node to trace its strongest causal chain · Drag to rearrange
        </div>
      </div>

      {/* Chain caption */}
      {chain && chain.ids.length > 1 && (
        <div className="card fade-up" style={{ border: "1px solid var(--amber)44" }}>
          <SectionTitle color="var(--amber)">Causal Chain — {chain.ids[0]}</SectionTitle>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 0, flexWrap: "wrap", marginBottom: 16 }}>
            {chain.ids.map((id, i) => (
              <div key={id} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                <div style={{ background: "var(--bg1)", borderRadius: 6, padding: "6px 10px", border: "1px solid var(--amber)55" }}>
                  <span style={{ color: "var(--amber)", fontFamily: "monospace", fontWeight: 700, fontSize: 13 }}>{id}</span>
                </div>
                {i < chain.ids.length - 1 && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 6px" }}>
                    <span style={{ color: "var(--amber)", fontSize: 16 }}>→</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Arrow explanations */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {chain.links.map((l, i) => {
              const src = l.source?.id || l.source, tgt = l.target?.id || l.target;
              return (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "var(--bg1)", borderRadius: 8, padding: "10px 14px", borderLeft: "3px solid var(--amber)55" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 180, flexShrink: 0 }}>
                    <span className="mono" style={{ color: "var(--amber)", fontSize: 11, fontWeight: 700 }}>{src}</span>
                    <span style={{ color: "var(--tm)", fontSize: 12 }}>→</span>
                    <span className="mono" style={{ color: "var(--cyan)", fontSize: 11, fontWeight: 700 }}>{tgt}</span>
                  </div>
                  <div>
                    <div className="mono" style={{ color: "var(--tm)", fontSize: 10, marginBottom: 3 }}>via: {l.label}</div>
                    <div style={{ color: "var(--ts)", fontSize: 12, lineHeight: 1.5 }}>{getCausalExplanation(src, tgt, l.label)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected node connections */}
      {selected && (
        <div className="card fade-up" style={{ marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: selected.color }} />
            <span style={{ color: selected.color, fontFamily: "monospace", fontWeight: 700, fontSize: 14 }}>{selected.id}</span>
            <span style={{ color: "var(--ts)", fontSize: 12, textTransform: "capitalize" }}>— {selected.group}</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {GRAPH_LINKS.filter(l => (l.source?.id||l.source) === selected.id || (l.target?.id||l.target) === selected.id)
              .slice(0, 8).map(l => {
                const isOut = (l.source?.id||l.source) === selected.id;
                const other = isOut ? (l.target?.id||l.target) : (l.source?.id||l.source);
                return (
                  <div key={l.label+other} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 10px", fontSize: 11 }}>
                    <span style={{ color: isOut ? "var(--amber)" : "var(--cyan)" }}>{isOut ? "→" : "←"}</span>
                    <span style={{ color: "var(--ts)", marginLeft: 4 }}>{other}</span>
                    <span style={{ color: "var(--tm)", marginLeft: 4 }}>({l.label})</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function getCausalExplanation(src, tgt, label) {
  const map = {
    "inflationary pressure": "Tariff-driven import price inflation passes through to CPI, forcing the Fed to maintain a hawkish stance longer than markets expect.",
    "dollar shock": "Tariff uncertainty and safe-haven demand strengthen the USD, directly pressuring EM currencies that have dollar-denominated debt obligations.",
    "trade shock": "Direct export demand destruction for China plus supply chain disruption creates deflationary pressure on Chinese property collateral values.",
    "safe haven flow": "Risk-off sentiment from trade war uncertainty drives institutional capital into USD-denominated assets, strengthening the dollar index.",
    "policy transmission": "Fed rate decisions directly determine the risk-free rate, setting the floor for all lending rates across the US economy.",
    "rate differential": "Higher US rates relative to other central banks attract capital flows into USD, strengthening the dollar via interest rate parity dynamics.",
    "discount rate": "Equity valuations are derived from discounted future cash flows — higher rates compress P/E multiples even if earnings are unchanged.",
    "sets policy": "The Federal Reserve sets the federal funds rate, which is the primary lever for US monetary policy and global dollar liquidity.",
    "unwind trigger": "BOJ rate hike makes yen-funded carry trades uneconomic, forcing systematic unwind of leveraged positions across global risk assets.",
    "JGB selling": "Japanese institutions holding US Treasuries may repatriate capital as JGB yields become more attractive, increasing US Treasury supply.",
    "contagion": "China stress reduces risk appetite for EM assets broadly, with investors drawing parallels and reducing EM exposure preemptively.",
    "stimulus response": "PBOC monetary and fiscal stimulus attempts to offset property sector drag, with mixed efficacy given structural supply overhang.",
    "drives hawkishness": "Above-target CPI data gives Fed cover to maintain restrictive policy, reducing probability of near-term rate cuts.",
    "safe haven": "EM currency stress triggers safe-haven demand for gold as a hedge against dollar dominance and EM contagion risk.",
    "global risk-off": "JPY carry unwind creates forced selling across EM assets as leveraged positions are liquidated to cover margin calls.",
    "reserve drain": "Currency defense requires selling FX reserves, reducing the buffer against future shocks and signaling vulnerability.",
  };
  return map[label] || `${src} movements directly influence ${tgt} through ${label} transmission channel.`;
}
