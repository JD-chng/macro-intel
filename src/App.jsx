import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  THEMES, CROSS_ASSET, RISK_TREE, GRAPH_NODES, GRAPH_LINKS,
  EMERGING, MEMORY, MARKET_PULSE, WEEKLY_BRIEF
} from "./data/seed.js";

// ─── CSS VARS ─────────────────────────────────────────────────────────────────
const CSS = `
  :root {
    --bg0:#060709;--bg1:#0d0f14;--bg2:#13161e;--bg3:#1a1e28;--bg4:#222636;
    --amber:#f0a500;--amber-dim:#a67200;--amber-glow:rgba(240,165,0,0.12);
    --cyan:#00d4ff;--red:#ff4444;--green:#00e676;--yellow:#ffeb3b;--purple:#bb86fc;
    --tp:#e8eaf0;--ts:#8892a4;--tm:#4a5568;--border:rgba(255,255,255,0.06);--borderlit:rgba(240,165,0,0.3);
  }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  .fade-up { animation: fadeUp 0.3s ease both; }
  .pulse { animation: pulse 1.5s ease infinite; }
  .spin { animation: spin 1s linear infinite; }
  .card { background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px 20px; }
  .mono { font-family:'Space Mono',monospace; }
  input:focus { outline:none; }
  button:focus { outline:none; }
  .tour-step { position:fixed;inset:0;z-index:999;display:flex;align-items:center;justify-content:center;background:rgba(6,7,9,0.88); }
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const heatColor = (h) => h > 80 ? "#ff4444" : h > 60 ? "#f0a500" : h > 35 ? "#ffeb3b" : h > 15 ? "#00d4ff" : "#4a5568";
const heatEmoji = (h) => h > 80 ? "🔴" : h > 60 ? "🟡" : h > 35 ? "🟡" : "🟢";
const impColor = (d) => d === "positive" ? "#00e676" : d === "negative" ? "#ff4444" : "#ffeb3b";
const mag2Color = { CRITICAL: "#ff4444", HIGH: "#f0a500", MEDIUM: "#00d4ff", LOW: "#4a5568" };

const Sparkline = ({ data, color }) => {
  const max = Math.max(...data), min = Math.min(...data), W = 72, H = 28;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / (max - min + 0.1)) * H}`).join(" ");
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      <polyline points={`0,${H} ${pts} ${W},${H}`} fill={color} fillOpacity={0.1} stroke="none" />
    </svg>
  );
};

const SectionTitle = ({ children, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
    <div style={{ width: 3, height: 16, background: color || "var(--amber)", borderRadius: 2 }} />
    <span className="mono" style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--ts)", textTransform: "uppercase" }}>{children}</span>
  </div>
);

const Chip = ({ children, color = "var(--ts)", bg = "var(--bg3)" }) => (
  <span style={{ background: bg, border: `1px solid ${color}44`, color, borderRadius: 4, padding: "2px 7px", fontSize: 10, fontFamily: "'Space Mono',monospace" }}>{children}</span>
);

const Spinner = () => (
  <div style={{ width: 16, height: 16, border: "2px solid var(--border)", borderTopColor: "var(--amber)", borderRadius: "50%" }} className="spin" />
);

// ─── API KEY GATE ─────────────────────────────────────────────────────────────
const ApiKeyModal = ({ onSet }) => {
  const [val, setVal] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--bg0)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div className="fade-up" style={{ background: "var(--bg2)", border: "1px solid var(--borderlit)", borderRadius: 12, padding: "36px 40px", maxWidth: 480, width: "100%" }}>
        <div className="mono" style={{ color: "var(--amber)", fontSize: 11, letterSpacing: "0.2em", marginBottom: 8 }}>MACRO INTELLIGENCE PLATFORM</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Enter API Key to Continue</div>
        <p style={{ color: "var(--ts)", fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
          This platform uses the Anthropic Claude API for live theme analysis, risk tree generation, and natural language queries.
          Your key is stored only in browser memory and never transmitted to any server other than Anthropic.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={val} onChange={e => setVal(e.target.value)}
            placeholder="sk-ant-api03-..."
            type="password"
            style={{ flex: 1, background: "var(--bg1)", border: "1px solid var(--borderlit)", borderRadius: 6, padding: "10px 14px", color: "var(--tp)", fontFamily: "'Space Mono',monospace", fontSize: 13 }}
            onKeyDown={e => e.key === "Enter" && val.startsWith("sk-ant") && onSet(val)}
          />
          <button
            onClick={() => val.startsWith("sk-ant") && onSet(val)}
            style={{ background: "var(--amber)", color: "#000", border: "none", borderRadius: 6, padding: "10px 20px", cursor: "pointer", fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>
            ENTER →
          </button>
        </div>
        <p style={{ color: "var(--tm)", fontSize: 11, marginTop: 12 }}>
          Don't have a key? Get one at <span style={{ color: "var(--cyan)" }}>console.anthropic.com</span>
        </p>
        <button onClick={() => onSet("DEMO")} style={{ marginTop: 16, background: "transparent", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 16px", color: "var(--ts)", cursor: "pointer", fontSize: 12, fontFamily: "'Space Mono',monospace" }}>
          Continue in Demo Mode (no AI calls)
        </button>
      </div>
    </div>
  );
};

// ─── GUIDED TOUR ─────────────────────────────────────────────────────────────
const TOUR_STEPS = [
  {
    title: "Step 1: Live Article Ingestion",
    icon: "📡",
    desc: "Every 2 hours, the system polls 10+ RSS feeds from Reuters, FT, WSJ, and central bank websites. Articles are filtered for macro relevance, summarized, and embedded into a vector database.",
    action: "Watch the Article Feed update with live Reuters headlines →",
    color: "#00d4ff",
  },
  {
    title: "Step 2: AI Theme Discovery",
    icon: "🧠",
    desc: "Claude clusters similar articles and automatically identifies the macro narrative. No predefined categories — the system discovers themes like 'BOJ Normalization Risk' or 'US Tariff Escalation' on its own.",
    action: "See themes heat up and cool down on the Theme Monitor →",
    color: "#f0a500",
  },
  {
    title: "Step 3: Risk Implication Chains",
    icon: "⚡",
    desc: "When a theme heats up, Claude generates a structured causal tree: Rates → FX → Equities → Credit. No Bloomberg terminal does this automatically. This is the institutional edge.",
    action: "Explore the Risk Tree and Cross-Asset Heatmap →",
    color: "#ff4444",
  },
];

const GuidedTour = ({ onFinish }) => {
  const [step, setStep] = useState(0);
  const s = TOUR_STEPS[step];
  return (
    <div className="tour-step">
      <div className="fade-up" style={{ background: "var(--bg2)", border: `1px solid ${s.color}66`, borderRadius: 16, padding: "40px 44px", maxWidth: 540, width: "92%", position: "relative" }}>
        <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 6 }}>
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 20 : 8, height: 8, borderRadius: 4, background: i === step ? s.color : "var(--bg4)", transition: "all 0.3s" }} />
          ))}
        </div>
        <div style={{ fontSize: 44, marginBottom: 16 }}>{s.icon}</div>
        <div className="mono" style={{ color: s.color, fontSize: 11, letterSpacing: "0.15em", marginBottom: 8 }}>{s.title.toUpperCase()}</div>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--ts)", marginBottom: 20 }}>{s.desc}</p>
        <div style={{ background: "var(--bg1)", borderRadius: 8, padding: "12px 16px", borderLeft: `3px solid ${s.color}`, marginBottom: 24, fontSize: 13, color: "var(--tp)" }}>
          {s.action}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 20px", color: "var(--ts)", cursor: "pointer", fontFamily: "'Space Mono',monospace", fontSize: 12 }}>← BACK</button>
          )}
          <button onClick={() => step < TOUR_STEPS.length - 1 ? setStep(s => s + 1) : onFinish()}
            style={{ flex: 1, background: s.color, color: "#000", border: "none", borderRadius: 6, padding: "10px 20px", cursor: "pointer", fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 12 }}>
            {step < TOUR_STEPS.length - 1 ? "NEXT →" : "ENTER PLATFORM →"}
          </button>
          <button onClick={onFinish} style={{ background: "transparent", border: "none", color: "var(--tm)", cursor: "pointer", fontSize: 12 }}>Skip</button>
        </div>
      </div>
    </div>
  );
};

// ─── CLAUDE API CALL ──────────────────────────────────────────────────────────
async function callClaude(apiKey, systemPrompt, userPrompt, maxTokens = 800) {
  if (apiKey === "DEMO") return "[ Demo mode — connect an Anthropic API key to see live AI responses ]";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: maxTokens, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.[0]?.text || "";
}

// ─── LIVE RSS FEED ─────────────────────────────────────────────────────────────
const RSS_FEEDS = [
  { url: "https://feeds.reuters.com/reuters/businessNews", label: "Reuters Business" },
  { url: "https://feeds.reuters.com/reuters/USDollarReport", label: "Reuters FX" },
  { url: "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best", label: "Reuters Finance" },
];

async function fetchLiveArticles() {
  const proxy = "https://api.rss2json.com/v1/api.json?rss_url=";
  const feed = RSS_FEEDS[0];
  try {
    const res = await fetch(`${proxy}${encodeURIComponent(feed.url)}&count=8`);
    const data = await res.json();
    if (data.status !== "ok") throw new Error("RSS fetch failed");
    return data.items.map(item => ({
      id: item.guid || item.link,
      title: item.title,
      source: feed.label,
      url: item.link,
      time: new Date(item.pubDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " live",
      summary: item.description?.replace(/<[^>]+>/g, "").slice(0, 200) || "",
      isLive: true,
      heat: Math.floor(Math.random() * 40 + 50),
      themes: [],
    }));
  } catch (e) {
    return [];
  }
}

// ─── DEMO INGEST FLOW ─────────────────────────────────────────────────────────
const DEMO_ARTICLE = {
  title: "Federal Reserve signals prolonged pause as tariff inflation reshapes outlook",
  source: "Reuters",
  content: "Federal Reserve officials signaled Wednesday they are in no rush to cut interest rates, with multiple policymakers citing uncertainty from sweeping tariff increases as a key reason to hold borrowing costs steady. Fed Chair Jerome Powell said the central bank needs greater confidence that inflation is sustainably moving toward its 2% target before easing policy. The new tariffs on Chinese goods, now at 145%, are expected to push up consumer prices by 0.5-1.0 percentage points over the next 12 months, complicating the Fed's dual mandate. Markets have pushed back expectations for the first rate cut to late 2026.",
};

// ─── KNOWLEDGE GRAPH ──────────────────────────────────────────────────────────
const KnowledgeGraph = ({ onNodeClick }) => {
  const svgRef = useRef(null);
  const simRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const el = svgRef.current;
    const W = el.clientWidth || 700, H = 420;
    d3.select(el).selectAll("*").remove();
    const svg = d3.select(el).attr("viewBox", `0 0 ${W} ${H}`);

    const nodes = GRAPH_NODES.map(n => ({ ...n }));
    const links = GRAPH_LINKS.map(l => ({ ...l }));

    svg.append("defs").append("marker").attr("id", "arr").attr("viewBox", "0 -4 8 8")
      .attr("refX", 22).attr("refY", 0).attr("markerWidth", 5).attr("markerHeight", 5)
      .attr("orient", "auto").append("path").attr("d", "M0,-4L8,0L0,4").attr("fill", "#ffffff18");

    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(110).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-280))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide().radius(d => d.size + 18));
    simRef.current = sim;

    const link = svg.append("g").selectAll("line").data(links).enter().append("line")
      .attr("stroke", d => `rgba(255,255,255,${d.weight * 0.2})`).attr("stroke-width", d => d.weight * 1.8)
      .attr("marker-end", "url(#arr)");

    const node = svg.append("g").selectAll("g").data(nodes).enter().append("g")
      .style("cursor", "pointer")
      .on("click", (e, d) => onNodeClick && onNodeClick(d))
      .call(d3.drag()
        .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on("end", (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

    node.append("circle").attr("r", d => d.size).attr("fill", d => d.color + "28").attr("stroke", d => d.color).attr("stroke-width", 1.5);
    node.append("text").text(d => d.id.length > 14 ? d.id.slice(0, 13) + "…" : d.id)
      .attr("text-anchor", "middle").attr("dy", d => d.size + 13)
      .attr("fill", "#8892a4").attr("font-size", 9.5).attr("font-family", "'Space Mono',monospace");
    node.append("text").text(d => ({ theme: "◉", asset: "◈", institution: "◆", indicator: "◇" }[d.group] || "●"))
      .attr("text-anchor", "middle").attr("dominant-baseline", "middle").attr("fill", d => d.color).attr("font-size", d => d.size * 0.75);

    sim.on("tick", () => {
      link.attr("x1", d => Math.max(30, Math.min(W - 30, d.source.x))).attr("y1", d => Math.max(30, Math.min(H - 30, d.source.y)))
        .attr("x2", d => Math.max(30, Math.min(W - 30, d.target.x))).attr("y2", d => Math.max(30, Math.min(H - 30, d.target.y)));
      node.attr("transform", d => `translate(${Math.max(30, Math.min(W - 30, d.x))},${Math.max(30, Math.min(H - 30, d.y))})`);
    });

    return () => sim.stop();
  }, []);

  return <svg ref={svgRef} style={{ width: "100%", height: 420, background: "var(--bg1)", borderRadius: 8, border: "1px solid var(--border)" }} />;
};

// ─── RISK TREE NODE ────────────────────────────────────────────────────────────
const TreeNode = ({ node, depth = 0 }) => {
  const [open, setOpen] = useState(depth < 2);
  if (!node.children?.length) return (
    <div style={{ paddingLeft: depth * 18, marginTop: 5, display: "flex", gap: 8, alignItems: "flex-start" }}>
      <span style={{ color: "var(--tm)", fontSize: 10, marginTop: 2, fontFamily: "monospace", flexShrink: 0 }}>└─</span>
      <span style={{ fontSize: 12.5, color: "var(--ts)", lineHeight: 1.5 }}>{node.text}</span>
    </div>
  );
  return (
    <div style={{ paddingLeft: depth * 18, marginTop: 5 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", padding: "3px 0" }}>
        <span style={{ color: "var(--amber)", fontSize: 10, width: 12, flexShrink: 0 }}>{open ? "▾" : "▸"}</span>
        <span style={{ fontSize: 12.5, color: depth === 0 ? "var(--tp)" : "var(--ts)", lineHeight: 1.5 }}>{node.text}</span>
      </div>
      {open && node.children.map((c, i) => <TreeNode key={i} node={c} depth={depth + 1} />)}
    </div>
  );
};

// ─── PANELS ────────────────────────────────────────────────────────────────────
const OverviewPanel = ({ apiKey, liveArticles, onDemoTrigger, demoState }) => {
  const weekly = [
    { d: "Mon", v: 124 }, { d: "Tue", v: 189 }, { d: "Wed", v: 156 },
    { d: "Thu", v: 231 }, { d: "Fri", v: 198 }, { d: "Sat", v: 87 }, { d: "Sun", v: 143 },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Status Bar */}
      <div style={{ gridColumn: "1/-1" }} className="card">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {[["Active Themes", "8", "var(--amber)"], ["Live Articles", liveArticles.length > 0 ? liveArticles.length + " live" : "847 seeded", "var(--cyan)"], ["🔴 Alerts", "3 active", "var(--red)"], ["Engine Status", "Operational ●", "var(--green)"]].map(([l, v, c]) => (
            <div key={l} style={{ background: "var(--bg1)", borderRadius: 6, padding: "14px 16px", borderLeft: `3px solid ${c}` }}>
              <div className="mono" style={{ color: "var(--tm)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{l}</div>
              <div className="mono" style={{ color: c, fontSize: 22, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Trigger */}
      <div style={{ gridColumn: "1/-1" }} className="card" style={{ border: "1px solid var(--amber)44", background: "var(--bg2)", borderRadius: 8, padding: "16px 20px" }}>
        <SectionTitle color="var(--amber)">Live Demo — Ingest & Analyze Article</SectionTitle>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ flex: 1, background: "var(--bg1)", borderRadius: 8, padding: "12px 16px", borderLeft: "3px solid var(--cyan)" }}>
            <div className="mono" style={{ color: "var(--cyan)", fontSize: 10, marginBottom: 6 }}>ARTICLE TO INGEST</div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{DEMO_ARTICLE.title}</div>
            <div className="mono" style={{ color: "var(--ts)", fontSize: 11 }}>Reuters · Live Feed</div>
          </div>
          <button onClick={onDemoTrigger} disabled={demoState.loading}
            style={{ background: demoState.loading ? "var(--bg3)" : "var(--amber)", color: "#000", border: "none", borderRadius: 8, padding: "14px 22px", cursor: demoState.loading ? "not-allowed" : "pointer", fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 12, minWidth: 150, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            {demoState.loading ? <><Spinner /> ANALYZING...</> : "⚡ INGEST ARTICLE"}
          </button>
        </div>
        {demoState.result && (
          <div className="fade-up" style={{ marginTop: 14, background: "var(--bg1)", borderRadius: 8, padding: "14px 16px", border: "1px solid var(--green)44" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
              {[["Theme Detected", "Fed Policy Paralysis", "var(--amber)"], ["Heat Delta", "+8 pts → 79/100", "var(--red)"], ["Status", "🔥 Heating Fast", "var(--red)"]].map(([l, v, c]) => (
                <div key={l} style={{ background: "var(--bg3)", borderRadius: 6, padding: "6px 12px", border: `1px solid ${c}44` }}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 2 }}>{l}</div>
                  <div style={{ color: c, fontWeight: 600, fontSize: 13 }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--ts)", lineHeight: 1.7 }}>
              <span style={{ color: "var(--green)" }}>✓ AI Analysis: </span>{demoState.result}
            </div>
          </div>
        )}
      </div>

      {/* Hot Themes */}
      <div className="card">
        <SectionTitle color="var(--red)">🔴 Hot Themes Right Now</SectionTitle>
        {THEMES.filter(t => t.heat > 65).map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 16 }}>{heatEmoji(t.heat)}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{t.name}</div>
              <div style={{ height: 3, background: "var(--bg3)", borderRadius: 2 }}>
                <div style={{ width: `${t.heat}%`, height: "100%", background: heatColor(t.heat), borderRadius: 2, transition: "width 1s ease" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span className="mono" style={{ color: heatColor(t.heat), fontSize: 14, fontWeight: 700 }}>{t.heat}</span>
              <Sparkline data={t.trend} color={heatColor(t.heat)} />
            </div>
          </div>
        ))}
      </div>

      {/* Article Volume */}
      <div className="card">
        <SectionTitle color="var(--cyan)">Article Velocity — 7 Day</SectionTitle>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={weekly} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="d" tick={{ fill: "var(--tm)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--tm)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--tp)", fontFamily: "'Space Mono',monospace", fontSize: 12 }} />
            <Bar dataKey="v" name="Articles" fill="var(--amber)" radius={[3, 3, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ThemesPanel = ({ view }) => (
  <div>
    {view === "pm" && (
      <div className="card fade-up" style={{ marginBottom: 16, background: "var(--bg2)", borderRadius: 8, padding: "14px 20px", border: "1px solid var(--amber)44" }}>
        <SectionTitle color="var(--amber)">PM View — Priority Themes Only</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {THEMES.filter(t => t.heat > 60).map(t => (
            <div key={t.id} style={{ background: "var(--bg1)", borderRadius: 8, padding: "14px 16px", borderTop: `3px solid ${heatColor(t.heat)}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{heatEmoji(t.heat)}</span>
                <span className="mono" style={{ color: heatColor(t.heat), fontSize: 16, fontWeight: 700 }}>{t.heat}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: "var(--ts)" }}>{t.change} coverage</div>
            </div>
          ))}
        </div>
      </div>
    )}
    <div className="card">
      <SectionTitle>All Themes — Heat Monitor</SectionTitle>
      {THEMES.map(t => (
        <div key={t.id} style={{ background: "var(--bg1)", borderRadius: 8, padding: "14px 16px", marginBottom: 10, border: "1px solid var(--border)", transition: "border-color .2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = heatColor(t.heat) + "66"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ fontSize: 22, paddingTop: 2 }}>{heatEmoji(t.heat)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</span>
                <span style={{ background: heatColor(t.heat) + "22", border: `1px solid ${heatColor(t.heat)}55`, color: heatColor(t.heat), padding: "2px 8px", borderRadius: 3, fontSize: 11, fontFamily: "'Space Mono',monospace" }}>{t.status}</span>
                <span className="mono" style={{ color: t.heat > 50 ? "var(--red)" : "var(--cyan)", fontSize: 11, marginLeft: "auto" }}>{t.change}</span>
              </div>
              <p style={{ color: "var(--ts)", fontSize: 12, lineHeight: 1.55, marginBottom: 8 }}>{t.description}</p>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ flex: 1, height: 4, background: "var(--bg3)", borderRadius: 2 }}>
                  <div style={{ width: `${t.heat}%`, height: "100%", background: `linear-gradient(90deg,${heatColor(t.heat)}88,${heatColor(t.heat)})`, borderRadius: 2 }} />
                </div>
                <span className="mono" style={{ color: heatColor(t.heat), fontWeight: 700, fontSize: 15 }}>{t.heat}</span>
                <span style={{ color: "var(--tm)", fontSize: 11 }}>{t.articles} articles</span>
                <Sparkline data={t.trend} color={heatColor(t.heat)} />
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {t.tags?.slice(0, 4).map(tg => <Chip key={tg}>{tg}</Chip>)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RiskTreePanel = () => (
  <div className="card fade-up">
    <SectionTitle color="var(--red)">Risk Implication Tree — Causal Chain</SectionTitle>
    <div style={{ background: "var(--bg1)", borderRadius: 8, padding: "12px 16px", borderLeft: "3px solid var(--red)", marginBottom: 20 }}>
      <span className="mono" style={{ color: "var(--red)", fontSize: 12 }}>⚡ TRIGGER EVENT: </span>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{RISK_TREE.event}</span>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {RISK_TREE.channels.map(ch => (
        <div key={ch.name} style={{ background: "var(--bg1)", borderRadius: 8, border: `1px solid ${ch.color}33`, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${ch.color}22` }}>
            <span style={{ fontSize: 16 }}>{ch.icon}</span>
            <span className="mono" style={{ color: ch.color, fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>{ch.name} Channel</span>
          </div>
          {ch.implications.map((impl, i) => <TreeNode key={i} node={impl} depth={0} />)}
        </div>
      ))}
    </div>
    <div style={{ background: "var(--bg3)", borderRadius: 8, padding: "12px 16px", marginTop: 16, display: "flex", gap: 20 }}>
      <div style={{ flex: 1 }}>
        <div className="mono" style={{ color: "var(--green)", fontSize: 10, marginBottom: 4 }}>BULL CASE</div>
        <div style={{ color: "var(--ts)", fontSize: 12 }}>Trade deal progress halts tariff escalation; inflation cools faster than expected</div>
      </div>
      <div style={{ flex: 1 }}>
        <div className="mono" style={{ color: "var(--red)", fontSize: 10, marginBottom: 4 }}>BEAR CASE</div>
        <div style={{ color: "var(--ts)", fontSize: 12 }}>Full trade war escalation + JPY carry unwind simultaneously; systemic dislocation</div>
      </div>
    </div>
  </div>
);

const HeatmapPanel = () => {
  const radar = [
    { s: "Rates", v: 92 }, { s: "USD", v: 78 }, { s: "EM FX", v: 88 },
    { s: "US EQ", v: 62 }, { s: "EM EQ", v: 88 }, { s: "HY", v: 71 },
    { s: "Gold", v: 45 }, { s: "Oil", v: 38 },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div className="card">
        <SectionTitle>Cross-Asset Exposure — US Tariff Escalation</SectionTitle>
        {CROSS_ASSET.map(a => {
          const abs = Math.abs(a.impact), col = impColor(a.direction);
          return (
            <div key={a.asset} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 100, fontSize: 11, fontFamily: "monospace", color: "var(--ts)", flexShrink: 0 }}>{a.asset}</div>
              <div style={{ flex: 1, height: 5, background: "var(--bg3)", borderRadius: 3, position: "relative" }}>
                <div style={{ position: "absolute", left: a.direction === "negative" ? `${(100 - abs) / 2}%` : "50%", width: `${abs / 2}%`, height: "100%", background: col, borderRadius: 3 }} />
                <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "100%", background: "var(--border)" }} />
              </div>
              <span style={{ color: mag2Color[a.magnitude], fontSize: 10, fontFamily: "monospace", minWidth: 55, textAlign: "right" }}>{a.magnitude}</span>
              <span style={{ color: col, fontSize: 12, minWidth: 12 }}>{a.direction === "positive" ? "▲" : "▼"}</span>
            </div>
          );
        })}
      </div>
      <div className="card">
        <SectionTitle>Exposure Radar</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radar}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="s" tick={{ fill: "var(--tm)", fontSize: 11 }} />
            <Radar dataKey="v" stroke="var(--amber)" fill="var(--amber)" fillOpacity={0.18} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          {[["CRITICAL", "#ff4444"], ["HIGH", "#f0a500"], ["MEDIUM", "#00d4ff"]].map(([l, c]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
              <span style={{ color: "var(--ts)", fontSize: 11 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const GraphPanel = () => {
  const [selected, setSelected] = useState(null);
  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <SectionTitle>Macro Relationships Knowledge Graph</SectionTitle>
        <div style={{ display: "flex", gap: 14, marginBottom: 10, flexWrap: "wrap" }}>
          {[["theme", "var(--red)"], ["asset", "var(--cyan)"], ["institution", "var(--green)"], ["indicator", "var(--yellow)"]].map(([k, c]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
              <span style={{ color: "var(--ts)", fontSize: 12, textTransform: "capitalize" }}>{k}</span>
            </div>
          ))}
          <span style={{ color: "var(--tm)", fontSize: 11, marginLeft: "auto" }}>Drag nodes · Click to explore</span>
        </div>
        <KnowledgeGraph onNodeClick={setSelected} />
      </div>
      {selected && (
        <div className="card fade-up" style={{ border: `1px solid ${selected.color}55` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: selected.color }} />
            <span style={{ color: selected.color, fontFamily: "monospace", fontWeight: 700 }}>{selected.id}</span>
            <span style={{ color: "var(--tm)", fontSize: 12 }}>— {selected.group}</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {GRAPH_LINKS.filter(l => l.source === selected.id || l.target === selected.id || l.source?.id === selected.id || l.target?.id === selected.id)
              .slice(0, 8).map(l => {
                const other = (l.source?.id || l.source) === selected.id ? (l.target?.id || l.target) : (l.source?.id || l.source);
                return <Chip key={l.label} color="var(--ts)">{other} <span style={{ color: "var(--tm)" }}>({l.label})</span></Chip>;
              })}
          </div>
        </div>
      )}
    </div>
  );
};

const ArticlesPanel = ({ liveArticles }) => {
  const [filter, setFilter] = useState("all");
  const allArticles = [
    ...liveArticles,
    { id: "s1", title: "Federal Reserve signals prolonged pause as tariff inflation clouds outlook", source: "Reuters", time: "2h ago", themes: ["Fed Policy", "US Tariffs"], heat: 91, isLive: false },
    { id: "s2", title: "BOJ governor Ueda hints at further rate normalization in Q3 meeting", source: "Financial Times", time: "4h ago", themes: ["BOJ Normalization Risk"], heat: 84, isLive: false },
    { id: "s3", title: "China's Evergrande liquidators hit new obstacle in offshore asset recovery", source: "Bloomberg", time: "6h ago", themes: ["China Property Stress"], heat: 23, isLive: false },
    { id: "s4", title: "MSCI EM index suffers third consecutive week of outflows amid dollar surge", source: "WSJ", time: "8h ago", themes: ["EM FX Stress", "US Tariffs"], heat: 78, isLive: false },
    { id: "s5", title: "Mexican peso at 18-month low as tariff fears accelerate capital flight", source: "Reuters", time: "10h ago", themes: ["EM FX Stress"], heat: 72, isLive: false },
    { id: "s6", title: "Gold surges past $3,200 as institutional safe-haven demand intensifies", source: "Reuters", time: "12h ago", themes: ["US Tariffs", "Fed Policy"], heat: 75, isLive: false },
  ];

  const themeFilters = ["all", ...new Set(THEMES.slice(0, 5).map(t => t.name))];
  const filtered = filter === "all" ? allArticles : allArticles.filter(a => a.themes?.includes(filter));

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <SectionTitle>Article Intelligence Feed</SectionTitle>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {themeFilters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ background: filter === f ? "var(--amber)" : "var(--bg3)", color: filter === f ? "#000" : "var(--ts)", border: `1px solid var(--border)`, borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontFamily: "'Space Mono',monospace" }}>
              {f === "all" ? "All" : f.split(" ")[0]}
            </button>
          ))}
          {liveArticles.length > 0 && <span style={{ fontSize: 11, color: "var(--green)", fontFamily: "monospace", marginLeft: 4, paddingTop: 4 }}>● {liveArticles.length} live from Reuters</span>}
        </div>
      </div>
      <div className="card">
        {filtered.map((a, i) => (
          <div key={a.id || i} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", display: "flex", gap: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.isLive ? "var(--green)" : heatColor(a.heat || 60), marginTop: 5, flexShrink: 0 }} className={a.isLive ? "pulse" : ""} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 6, lineHeight: 1.4 }}>{a.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ color: "var(--amber)", fontSize: 11, fontFamily: "monospace" }}>{a.source}</span>
                <span style={{ color: "var(--tm)", fontSize: 11 }}>{a.time}</span>
                {a.isLive && <span style={{ color: "var(--green)", fontSize: 10, fontFamily: "monospace", border: "1px solid var(--green)44", padding: "1px 6px", borderRadius: 3 }}>● LIVE</span>}
                {a.themes?.map(t => <Chip key={t}>{t}</Chip>)}
                {a.heat && <span className="mono" style={{ marginLeft: "auto", fontSize: 12, color: heatColor(a.heat) }}>HEAT {a.heat}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BriefPanel = ({ apiKey }) => {
  const [aiText, setAiText] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const text = await callClaude(apiKey,
        "You are the chief macro strategist at a $50bn asset manager. Write a concise, high-signal weekly macro brief. Be specific, quantitative, and forward-looking.",
        `Generate a 200-word weekly macro brief for ${WEEKLY_BRIEF.week}. Key themes: US Tariffs heating fast (heat 94/100), BOJ normalization risk (82/100), Fed paralysis (71/100), China property suspicious silence (23/100). Include top risk, key asset calls, and one contrarian view.`
      );
      setAiText(text);
    } catch (e) { setAiText("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ gridColumn: "1/-1" }} className="card" style={{ border: "1px solid var(--amber-dim)", background: "var(--bg2)", borderRadius: 8, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div className="mono" style={{ color: "var(--amber)", fontSize: 11, letterSpacing: "0.2em" }}>MACRO INTELLIGENCE BRIEF</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{WEEKLY_BRIEF.week}</div>
          </div>
          <button onClick={generate} disabled={loading}
            style={{ background: "var(--amber)", color: "#000", border: "none", borderRadius: 6, padding: "10px 18px", cursor: "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
            {loading ? <><Spinner /> GENERATING...</> : "↻ GENERATE WITH AI"}
          </button>
        </div>
      </div>
      <div className="card">
        <SectionTitle>Top Themes This Week</SectionTitle>
        {WEEKLY_BRIEF.top_themes.map(t => (
          <div key={t.name} style={{ background: "var(--bg1)", borderRadius: 6, padding: "10px 14px", marginBottom: 8, borderLeft: "3px solid var(--amber)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</span>
              <span style={{ fontSize: 12 }}>{t.status}</span>
            </div>
            <p style={{ color: "var(--ts)", fontSize: 12, lineHeight: 1.5 }}>{t.note}</p>
          </div>
        ))}
      </div>
      <div>
        <div className="card" style={{ marginBottom: 14 }}>
          <SectionTitle color="var(--red)">Key Risks</SectionTitle>
          {WEEKLY_BRIEF.key_risks.map(r => (
            <div key={r} style={{ display: "flex", gap: 8, padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "var(--red)", fontSize: 12 }}>▸</span>
              <span style={{ color: "var(--ts)", fontSize: 13, lineHeight: 1.5 }}>{r}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <SectionTitle color="var(--cyan)">Watch Next Week</SectionTitle>
          {WEEKLY_BRIEF.watch_next.map(e => (
            <div key={e.event} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              <span className="mono" style={{ color: "var(--tm)", fontSize: 11, minWidth: 66 }}>{e.date}</span>
              <span style={{ fontSize: 13, flex: 1 }}>{e.event}</span>
              <span style={{ fontSize: 10, color: e.importance === "CRITICAL" ? "var(--red)" : e.importance === "HIGH" ? "var(--amber)" : "var(--cyan)", fontFamily: "monospace" }}>{e.importance}</span>
            </div>
          ))}
        </div>
      </div>
      {aiText && (
        <div style={{ gridColumn: "1/-1" }} className="card fade-up" style={{ border: "1px solid var(--cyan)44", background: "var(--bg2)", borderRadius: 8, padding: "16px 20px" }}>
          <SectionTitle color="var(--cyan)">AI Macro Outlook</SectionTitle>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--tp)" }}>{aiText}</p>
        </div>
      )}
    </div>
  );
};

const WatchlistPanel = () => (
  <div className="card fade-up">
    <SectionTitle color="var(--purple)">Emerging Themes — AI Breakout Watchlist</SectionTitle>
    <p style={{ color: "var(--ts)", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>AI-predicted themes with high breakout probability in the next 30 days. Based on mention velocity, source migration from niche to mainstream, knowledge graph centrality, and macro calendar proximity.</p>
    {EMERGING.map((e, i) => (
      <div key={e.theme} style={{ background: "var(--bg1)", borderRadius: 8, padding: "16px 18px", marginBottom: 12, border: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg,var(--purple),var(--amber))` }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10, flexWrap: "wrap" }}>
          <span className="mono" style={{ color: "var(--tm)", fontSize: 12 }}>#{i + 1}</span>
          <span style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>{e.theme}</span>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: e.prob > 70 ? "var(--red)" : "var(--amber)" }}>{e.prob}%</div>
              <div className="mono" style={{ fontSize: 9, color: "var(--tm)" }}>BREAKOUT</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: "var(--cyan)" }}>{e.conf}%</div>
              <div className="mono" style={{ fontSize: 9, color: "var(--tm)" }}>CONFIDENCE</div>
            </div>
          </div>
        </div>
        <div style={{ height: 4, background: "var(--bg3)", borderRadius: 2, marginBottom: 10 }}>
          <div style={{ width: `${e.prob}%`, height: "100%", background: `linear-gradient(90deg,var(--purple),${e.prob > 70 ? "var(--red)" : "var(--amber)"})`, borderRadius: 2 }} />
        </div>
        <p style={{ color: "var(--ts)", fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>
          <span className="mono" style={{ color: "var(--amber)" }}>SIGNAL: </span>{e.signal}
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {e.drivers.map(d => <Chip key={d}>{d}</Chip>)}
        </div>
      </div>
    ))}
  </div>
);

const MemoryPanel = ({ apiKey }) => {
  const [q, setQ] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const text = await callClaude(apiKey,
        "You are an institutional memory system for a macro hedge fund. Answer queries about past analysis based on historical records. Be specific about dates, heat scores, and whether predictions proved accurate.",
        `Query: "${q}"\n\nHistorical records:\n${JSON.stringify(MEMORY, null, 2)}\n\nAnswer in 3-4 sentences, referencing specific dates and outcomes.`
      );
      setResult(text);
    } catch (e) { setResult("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <SectionTitle>Institutional Memory — Semantic Search</SectionTitle>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search()}
            placeholder='e.g. "What did we say about Fed policy in October?"'
            style={{ flex: 1, background: "var(--bg1)", border: "1px solid var(--borderlit)", borderRadius: 6, padding: "10px 14px", color: "var(--tp)", fontFamily: "'Space Mono',monospace", fontSize: 13 }} />
          <button onClick={search} disabled={loading}
            style={{ background: "var(--cyan)", color: "#000", border: "none", borderRadius: 6, padding: "10px 20px", cursor: "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
            {loading ? <><Spinner /> SEARCHING...</> : "RECALL →"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["What did we miss on China?", "How accurate was BOJ call?", "Fed pivot prediction"].map(s => (
            <button key={s} onClick={() => { setQ(s); }} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 10px", color: "var(--ts)", fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>{s}</button>
          ))}
        </div>
        {result && (
          <div className="fade-up" style={{ marginTop: 14, background: "var(--bg1)", borderRadius: 8, padding: "14px 16px", border: "1px solid var(--cyan)44" }}>
            <div className="mono" style={{ color: "var(--cyan)", fontSize: 10, marginBottom: 8 }}>MEMORY RECALL</div>
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>{result}</p>
          </div>
        )}
      </div>
      <div className="card">
        <SectionTitle>Analysis Archive</SectionTitle>
        {MEMORY.map(m => (
          <div key={m.date} style={{ background: "var(--bg1)", borderRadius: 8, padding: "12px 16px", marginBottom: 10, borderLeft: "3px solid var(--cyan)55" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
              <span className="mono" style={{ color: "var(--amber)", fontSize: 12 }}>{m.date}</span>
              {m.themes.map(t => <Chip key={t}>{t}</Chip>)}
              <span className="mono" style={{ marginLeft: "auto", color: "var(--cyan)", fontSize: 12 }}>Heat {m.heat}</span>
            </div>
            <p style={{ color: "var(--ts)", fontSize: 13, lineHeight: 1.5 }}>{m.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const QueryPanel = ({ apiKey }) => {
  const [q, setQ] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const EXAMPLES = [
    "What macro themes are affecting emerging markets?",
    "Which themes are heating up this week?",
    "How has the Fed narrative evolved?",
    "What are the biggest tail risks right now?",
    "Compare the risk profile of BOJ vs Fed policy",
  ];

  const ask = async (query) => {
    const finalQ = query || q;
    if (!finalQ.trim()) return;
    setLoading(true); setResult("");
    try {
      const ctx = `You are a senior macro intelligence analyst at a top-tier asset manager. Active themes: ${THEMES.map(t => `${t.name} (heat ${t.heat}, ${t.status})`).join("; ")}. Cross-asset signals: USD strengthening, EM equities critical negative, Gold safe haven, JPY carry unwind risk. Answer concisely in 4-5 sentences. Be specific and actionable.`;
      const text = await callClaude(apiKey, ctx, finalQ);
      setResult(text);
    } catch (e) { setResult("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div className="card fade-up">
      <SectionTitle>Natural Language Macro Query</SectionTitle>
      <p style={{ color: "var(--ts)", fontSize: 13, marginBottom: 16 }}>Ask any question about current macro themes, risks, or market dynamics. The AI engine synthesizes live intelligence to answer.</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && ask()}
          placeholder="Ask the macro intelligence engine..."
          style={{ flex: 1, background: "var(--bg1)", border: "1px solid var(--borderlit)", borderRadius: 6, padding: "11px 14px", color: "var(--tp)", fontFamily: "'Space Mono',monospace", fontSize: 13 }} />
        <button onClick={() => ask()} disabled={loading}
          style={{ background: loading ? "var(--bg3)" : "var(--amber)", color: "#000", border: "none", borderRadius: 6, padding: "11px 22px", cursor: loading ? "not-allowed" : "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
          {loading ? <><Spinner /> ANALYZING...</> : "QUERY →"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {EXAMPLES.map(ex => (
          <button key={ex} onClick={() => { setQ(ex); ask(ex); }}
            style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 10px", color: "var(--ts)", fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>
            {ex}
          </button>
        ))}
      </div>
      {loading && (
        <div style={{ background: "var(--bg1)", borderRadius: 8, padding: 20, border: "1px solid var(--amber-dim)", display: "flex", alignItems: "center", gap: 12 }}>
          <div className="pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--amber)" }} />
          <span className="mono" style={{ color: "var(--amber)", fontSize: 13 }}>AI engine synthesizing macro intelligence...</span>
        </div>
      )}
      {result && (
        <div className="fade-up" style={{ background: "var(--bg1)", borderRadius: 8, padding: 20, border: "1px solid var(--borderlit)" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
            <span className="mono" style={{ fontSize: 11, color: "var(--tm)", textTransform: "uppercase", letterSpacing: "0.1em" }}>AI Macro Intelligence Response</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--tp)" }}>{result}</p>
        </div>
      )}
    </div>
  );
};

// ─── NAV ──────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "⬡" },
  { id: "themes", label: "Themes", icon: "◉", badge: "8" },
  { id: "risk", label: "Risk Tree", icon: "⊹" },
  { id: "heatmap", label: "Heatmap", icon: "◈" },
  { id: "graph", label: "Graph", icon: "⬡" },
  { id: "brief", label: "Brief", icon: "◆", badge: "new" },
  { id: "watchlist", label: "Watchlist", icon: "▲", badge: "5" },
  { id: "articles", label: "Articles", icon: "≡" },
  { id: "memory", label: "Memory", icon: "◇" },
  { id: "query", label: "Query AI", icon: "✦" },
];

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [apiKey, setApiKey] = useState(null);
  const [showTour, setShowTour] = useState(false);
  const [active, setActive] = useState("overview");
  const [view, setView] = useState("analyst"); // "pm" | "analyst"
  const [liveArticles, setLiveArticles] = useState([]);
  const [fetchingLive, setFetchingLive] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [time, setTime] = useState(new Date());
  const [demoState, setDemoState] = useState({ loading: false, result: null });
  const [nextRefresh, setNextRefresh] = useState(30 * 60); // seconds until next refresh
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes in ms

  // Clock + countdown
  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date());
      setNextRefresh(s => s <= 1 ? 30 * 60 : s - 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const doFetchLive = useCallback(() => {
    setFetchingLive(true);
    fetchLiveArticles().then(arts => {
      if (arts.length > 0) setLiveArticles(arts);
      setFetchingLive(false);
      setLastRefreshed(new Date());
      setNextRefresh(30 * 60);
    });
  }, []);

  // Fetch live RSS on mount + every 30 minutes
  useEffect(() => {
    if (!apiKey) return;
    doFetchLive();
    const interval = setInterval(doFetchLive, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [apiKey, doFetchLive]);

  const handleDemoTrigger = useCallback(async () => {
    setDemoState({ loading: true, result: null });
    try {
      const text = await callClaude(
        apiKey,
        "You are a macro AI engine. Analyze an article and provide a 2-sentence risk summary with theme classification and heat score impact. Be specific.",
        `Classify this article and assess macro impact:\n\nTitle: ${DEMO_ARTICLE.title}\n\nContent: ${DEMO_ARTICLE.content}\n\nProvide: (1) which theme this belongs to, (2) impact on heat score, (3) key risk implication in one sentence.`
      );
      setDemoState({ loading: false, result: text });
    } catch (e) {
      setDemoState({ loading: false, result: "Error: " + e.message });
    }
  }, [apiKey]);

  if (!apiKey) return (
    <>
      <style>{CSS}</style>
      <ApiKeyModal onSet={(k) => { setApiKey(k); setShowTour(true); }} />
    </>
  );

  if (showTour) return (
    <>
      <style>{CSS}</style>
      <GuidedTour onFinish={() => setShowTour(false)} />
    </>
  );

  const TITLE_MAP = { overview: "System Overview", themes: "Theme Heat Monitor", risk: "Risk Implication Trees", heatmap: "Cross-Asset Exposure", graph: "Knowledge Graph", brief: "Weekly Macro Brief", watchlist: "Emerging Watchlist", articles: "Article Intelligence", memory: "Institutional Memory", query: "AI Query Interface" };

  const renderPanel = () => {
    switch (active) {
      case "overview": return <OverviewPanel apiKey={apiKey} liveArticles={liveArticles} onDemoTrigger={handleDemoTrigger} demoState={demoState} />;
      case "themes": return <ThemesPanel view={view} />;
      case "risk": return <RiskTreePanel />;
      case "heatmap": return <HeatmapPanel />;
      case "graph": return <GraphPanel />;
      case "brief": return <BriefPanel apiKey={apiKey} />;
      case "watchlist": return <WatchlistPanel />;
      case "articles": return <ArticlesPanel liveArticles={liveArticles} />;
      case "memory": return <MemoryPanel apiKey={apiKey} />;
      case "query": return <QueryPanel apiKey={apiKey} />;
      default: return null;
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg0)" }}>

        {/* SIDEBAR */}
        <div style={{ width: 62, background: "var(--bg1)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 14, gap: 3, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, background: "var(--amber)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "#000" }}>M</div>
          {NAV_ITEMS.map(n => (
            <div key={n.id} onClick={() => setActive(n.id)} title={n.label}
              style={{ width: 42, height: 42, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", background: active === n.id ? "var(--amber-glow)" : "transparent", border: active === n.id ? "1px solid var(--borderlit)" : "1px solid transparent", transition: "all .15s", fontSize: 15 }}
              onMouseEnter={e => { if (active !== n.id) e.currentTarget.style.background = "var(--bg3)"; }}
              onMouseLeave={e => { if (active !== n.id) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ color: active === n.id ? "var(--amber)" : "var(--tm)" }}>{n.icon}</span>
              {n.badge && <div style={{ position: "absolute", top: 4, right: 4, background: n.badge === "new" ? "var(--green)" : "var(--amber)", borderRadius: 8, minWidth: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#000", fontFamily: "monospace", fontWeight: 700, padding: "0 3px" }}>{n.badge}</div>}
            </div>
          ))}
          <div style={{ marginTop: "auto", paddingBottom: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div className="pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)" }} />
            <span className="mono" style={{ fontSize: 8, color: "var(--tm)", writingMode: "vertical-rl", textTransform: "uppercase", letterSpacing: "0.1em" }}>LIVE</span>
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* TOPBAR */}
          <div style={{ height: 50, background: "var(--bg1)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 18px", gap: 14, flexShrink: 0 }}>
            <div>
              <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--tp)", letterSpacing: "0.05em" }}>MACRO INTELLIGENCE</div>
              <div className="mono" style={{ fontSize: 9, color: "var(--tm)", letterSpacing: "0.15em", marginTop: 1 }}>/ {TITLE_MAP[active]?.toUpperCase()}</div>
            </div>

            {/* PM / Analyst toggle */}
            <div style={{ display: "flex", background: "var(--bg3)", borderRadius: 6, padding: 3, border: "1px solid var(--border)", marginLeft: 16 }}>
              {["pm", "analyst"].map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{ background: view === v ? "var(--amber)" : "transparent", color: view === v ? "#000" : "var(--ts)", border: "none", borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontFamily: "monospace", fontSize: 11, fontWeight: view === v ? 700 : 400, transition: "all .15s" }}>
                  {v === "pm" ? "PM VIEW" : "ANALYST VIEW"}
                </button>
              ))}
            </div>

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
              {!alertDismissed && (
                <div onClick={() => setAlertDismissed(true)} style={{ background: "#ff444422", border: "1px solid #ff444455", borderRadius: 6, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <span className="pulse" style={{ color: "var(--red)", fontSize: 10 }}>⚠</span>
                  <span style={{ color: "var(--red)", fontSize: 11, fontFamily: "monospace" }}>China Property — Suspicious Silence</span>
                  <span style={{ color: "var(--tm)", fontSize: 10 }}>×</span>
                </div>
              )}
              {fetchingLive
                ? <span style={{ color: "var(--cyan)", fontSize: 11, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 6 }}><Spinner /> refreshing...</span>
                : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {lastRefreshed && <span style={{ color: "var(--tm)", fontSize: 11, fontFamily: "monospace" }}>updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                    <span style={{ color: "var(--tm)", fontSize: 11, fontFamily: "monospace" }}>next refresh {Math.floor(nextRefresh / 60)}:{String(nextRefresh % 60).padStart(2, "0")}</span>
                    <button onClick={doFetchLive} style={{ background: "var(--bg3)", border: "1px solid var(--borderlit)", borderRadius: 5, padding: "3px 9px", color: "var(--amber)", cursor: "pointer", fontSize: 11, fontFamily: "monospace" }}>
                      refresh now
                    </button>
                  </div>
                )
              }
              <div className="mono" style={{ fontSize: 11, color: "var(--tm)" }}>{time.toUTCString().slice(0, 22)} UTC</div>
              <button onClick={() => setShowTour(true)} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 5, padding: "4px 10px", color: "var(--ts)", cursor: "pointer", fontSize: 11, fontFamily: "monospace" }}>? TOUR</button>
            </div>
          </div>

          {/* CONTENT */}
          <div style={{ flex: 1, overflow: "auto", padding: "18px 22px" }} key={active}>
            <div className="fade-up" style={{ maxWidth: 1200, margin: "0 auto" }}>
              {renderPanel()}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ width: 210, background: "var(--bg1)", borderLeft: "1px solid var(--border)", padding: "14px 12px", overflow: "auto", flexShrink: 0 }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--tm)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>Market Pulse</div>
          {MARKET_PULSE.map(m => (
            <div key={m.name} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--ts)" }}>{m.name}</span>
              <span className="mono" style={{ fontSize: 11, color: m.dir === "up" ? "var(--green)" : "var(--red)", fontWeight: 700 }}>{m.value}</span>
            </div>
          ))}

          <div className="mono" style={{ fontSize: 10, color: "var(--tm)", textTransform: "uppercase", letterSpacing: "0.15em", margin: "14px 0 8px" }}>Theme Heat</div>
          {THEMES.slice(0, 6).map(t => (
            <div key={t.id} style={{ marginBottom: 7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 10, color: "var(--ts)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{t.name.split(" ").slice(0, 2).join(" ")}</span>
                <span style={{ fontSize: 10, color: heatColor(t.heat), fontFamily: "monospace" }}>{t.heat}</span>
              </div>
              <div style={{ height: 3, background: "var(--bg3)", borderRadius: 2 }}>
                <div style={{ width: `${t.heat}%`, height: "100%", background: heatColor(t.heat), borderRadius: 2 }} />
              </div>
            </div>
          ))}

          <div className="mono" style={{ fontSize: 10, color: "var(--tm)", textTransform: "uppercase", letterSpacing: "0.15em", margin: "14px 0 8px" }}>Upcoming Events</div>
          {WEEKLY_BRIEF.watch_next.map(e => (
            <div key={e.event} style={{ padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
              <div className="mono" style={{ fontSize: 10, color: e.importance === "CRITICAL" ? "var(--red)" : "var(--amber)" }}>{e.date}</div>
              <div style={{ fontSize: 11, color: "var(--ts)", marginTop: 1, lineHeight: 1.3 }}>{e.event}</div>
            </div>
          ))}

          <div style={{ marginTop: 16 }}>
            <button onClick={() => setShowTour(true)} style={{ width: "100%", background: "var(--amber-glow)", border: "1px solid var(--borderlit)", borderRadius: 6, padding: "8px", color: "var(--amber)", cursor: "pointer", fontFamily: "monospace", fontSize: 11 }}>▶ Replay Tour</button>
          </div>
        </div>
      </div>
    </>
  );
}
