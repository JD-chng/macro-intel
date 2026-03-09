import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext.jsx";
import { ARTICLES, THEMES } from "../data/seed.js";

export const CSS_VARS = `
  :root {
    --bg0:#060709;--bg1:#0d0f14;--bg2:#13161e;--bg3:#1a1e28;--bg4:#222636;
    --amber:#f0a500;--amber-dim:#a67200;--amber-glow:rgba(240,165,0,0.12);
    --cyan:#00d4ff;--red:#ff4444;--green:#00e676;--yellow:#ffeb3b;--purple:#bb86fc;
    --tp:#e8eaf0;--ts:#8892a4;--tm:#4a5568;--border:rgba(255,255,255,0.06);--borderlit:rgba(240,165,0,0.3);
    --card-bg:var(--bg2);--input-bg:var(--bg1);
  }
  [data-theme="light"] {
    --bg0:#f0f2f5;--bg1:#ffffff;--bg2:#f8f9fb;--bg3:#edf0f4;--bg4:#e2e6ed;
    --amber:#d4820a;--amber-dim:#a66008;--amber-glow:rgba(212,130,10,0.1);
    --cyan:#0088aa;--red:#cc2222;--green:#1a7a3a;--yellow:#997700;--purple:#7c3aed;
    --tp:#1a1e28;--ts:#4a5568;--tm:#8892a4;--border:rgba(0,0,0,0.08);--borderlit:rgba(212,130,10,0.4);
    --card-bg:#ffffff;--input-bg:#f8f9fb;
  }
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
  .fade-up{animation:fadeUp 0.25s ease both}
  .pulse{animation:pulse 1.5s ease infinite}
  .spin{animation:spin 1s linear infinite}
  .slide-in{animation:slideIn 0.3s ease both}
  .card{background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:16px 20px}
  .mono{font-family:'Space Mono',monospace}
  input:focus,button:focus{outline:none}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:var(--bg0)}
  ::-webkit-scrollbar-thumb{background:var(--bg4);border-radius:2px}
`;

export const heatColor = (h) => h > 80 ? "var(--red)" : h > 60 ? "var(--amber)" : h > 35 ? "var(--yellow)" : h > 15 ? "var(--cyan)" : "var(--tm)";
export const heatEmoji = (h) => h > 80 ? "🔴" : h > 60 ? "🟡" : h > 35 ? "🟡" : "🟢";
export const impColor = (d) => d === "positive" ? "var(--green)" : d === "negative" ? "var(--red)" : "var(--yellow)";

export const Sparkline = ({ data, color }) => {
  if (!data?.length || data.length < 2) return <svg width={72} height={28} />;
  const max = Math.max(...data), min = Math.min(...data), W = 72, H = 28;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / (max - min + 0.1)) * H}`).join(" ");
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      <polyline points={`0,${H} ${pts} ${W},${H}`} fill={color} fillOpacity={0.1} stroke="none" />
    </svg>
  );
};

export const Spinner = ({ size = 16 }) => (
  <div style={{ width: size, height: size, border: `2px solid var(--border)`, borderTopColor: "var(--amber)", borderRadius: "50%", flexShrink: 0 }} className="spin" />
);

export const SectionTitle = ({ children, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
    <div style={{ width: 3, height: 16, background: color || "var(--amber)", borderRadius: 2, flexShrink: 0 }} />
    <span className="mono" style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--ts)", textTransform: "uppercase" }}>{children}</span>
  </div>
);

export const Chip = ({ children, color = "var(--ts)", bg }) => (
  <span style={{ background: bg || `color-mix(in srgb, ${color} 12%, var(--bg3))`, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`, color, borderRadius: 4, padding: "2px 7px", fontSize: 10, fontFamily: "'Space Mono',monospace", whiteSpace: "nowrap" }}>{children}</span>
);

export const MarkdownText = ({ text }) => {
  const lines = text.split('\n');
  return (
    <div style={{ fontSize: 13, lineHeight: 1.8, color: "var(--tp)" }}>
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <div key={i} style={{ fontWeight: 700, fontSize: 15, color: "var(--tp)", marginTop: 12, marginBottom: 4 }}>{line.slice(3)}</div>;
        if (line.startsWith('# ')) return <div key={i} style={{ fontWeight: 800, fontSize: 17, color: "var(--amber)", marginTop: 16, marginBottom: 6 }}>{line.slice(2)}</div>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}><span style={{ color: "var(--amber)", flexShrink: 0 }}>▸</span><span style={{ color: "var(--ts)" }}>{line.slice(2)}</span></div>;
        if (line.startsWith('**') && line.endsWith('**')) return <div key={i} style={{ fontWeight: 700, color: "var(--tp)", marginBottom: 4 }}>{line.slice(2, -2)}</div>;
        if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return <div key={i} style={{ marginBottom: 3, color: "var(--ts)" }}>{parts.map((p, j) => p.startsWith('**') ? <strong key={j} style={{ color: "var(--tp)" }}>{p.slice(2,-2)}</strong> : p)}</div>;
      })}
    </div>
  );
};

// ─── THEME DETAIL POPUP ────────────────────────────────────────────────────────
export const ThemeDetailPopup = ({ theme, onClose, apiKey, onOpenArticles }) => {
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const relatedArticles = ARTICLES.filter(a => theme.relatedArticles?.includes(a.id));

  useEffect(() => {
    if (!apiKey || apiKey === "DEMO") return;
    setAiLoading(true);
    callClaude(apiKey,
      "You are a senior macro analyst. Provide a 3-sentence AI summary of latest developments for a macro theme. Be specific and forward-looking.",
      `Theme: ${theme.name}\nHeat: ${theme.heat}/100\nStatus: ${theme.status}\nDescription: ${theme.description}\nTags: ${theme.tags.join(", ")}\n\nSummarize latest developments and key forward-looking risk in 3 sentences.`
    ).then(t => { setAiSummary(t); setAiLoading(false); }).catch(() => setAiLoading(false));
  }, [theme.id, apiKey]);

  const trend90 = theme.trend90 || theme.trend || [];
  const W = 380, H = 80;
  const hasTrend = trend90.length >= 2;
  const max = hasTrend ? Math.max(...trend90) : 100, min = hasTrend ? Math.min(...trend90) : 0;
  const pts = hasTrend ? trend90.map((v, i) => `${(i / (trend90.length - 1)) * W},${H - ((v - min) / (max - min + 0.1)) * H}`).join(" ") : "";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(6,7,9,0.8)" }} onClick={onClose}>
      <div className="fade-up" onClick={e => e.stopPropagation()}
        style={{ background: "var(--card-bg)", border: `1px solid ${theme.color}55`, borderRadius: 12, padding: "24px 28px", maxWidth: 560, width: "94%", maxHeight: "85vh", overflow: "auto", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 18, background: "none", border: "none", color: "var(--tm)", cursor: "pointer", fontSize: 22, lineHeight: 1 }}>×</button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>{heatEmoji(theme.heat)}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "var(--tp)" }}>{theme.name}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              <span style={{ background: theme.color + "22", border: `1px solid ${theme.color}55`, color: theme.color, padding: "2px 8px", borderRadius: 3, fontSize: 11, fontFamily: "monospace" }}>{theme.status}</span>
              <span className="mono" style={{ color: "var(--ts)", fontSize: 11 }}>First detected {theme.first_detected}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
          {[["Heat Score", theme.heat + "/100", theme.color], ["Coverage", theme.change, theme.heat > 50 ? "var(--red)" : "var(--cyan)"], ["Articles", theme.articles, "var(--amber)"]].map(([l, v, c]) => (
            <div key={l} style={{ background: "var(--bg1)", borderRadius: 6, padding: "10px 12px", textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 4 }}>{l}</div>
              <div className="mono" style={{ color: c, fontSize: 18, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* 90-day chart */}
        <div style={{ background: "var(--bg1)", borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 8 }}>HEAT SCORE — 90 DAY TREND</div>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
            <polyline points={pts} fill="none" stroke={theme.color} strokeWidth={2} strokeLinecap="round" />
            <polyline points={`0,${H} ${pts} ${W},${H}`} fill={theme.color} fillOpacity={0.1} stroke="none" />
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span className="mono" style={{ fontSize: 9, color: "var(--tm)" }}>90d ago</span>
            <span className="mono" style={{ fontSize: 9, color: "var(--tm)" }}>today</span>
          </div>
        </div>

        {/* Description */}
        <p style={{ color: "var(--ts)", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{theme.description}</p>

        {/* Tags */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {theme.tags?.map(t => <Chip key={t}>{t}</Chip>)}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {theme.countries?.map(c => <Chip key={c} color="var(--cyan)">{c}</Chip>)}
          {theme.assets?.map(a => <Chip key={a} color="var(--amber)">{a}</Chip>)}
        </div>

        {/* Risk tree summary */}
        {theme.riskTree && (
          <div style={{ background: "var(--bg3)", borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 8 }}>KEY RISK IMPLICATIONS</div>
            {Object.entries(theme.riskTree.implications || {}).slice(0, 3).map(([ch, items]) => (
              <div key={ch} style={{ marginBottom: 6 }}>
                <span className="mono" style={{ color: "var(--amber)", fontSize: 11 }}>{ch}: </span>
                <span style={{ color: "var(--ts)", fontSize: 12 }}>{items[0]}</span>
              </div>
            ))}
          </div>
        )}

        {/* AI Summary */}
        <div style={{ background: "var(--bg1)", borderRadius: 8, padding: "12px 14px", marginBottom: 14, border: "1px solid var(--borderlit)" }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--amber)", marginBottom: 8 }}>AI ANALYSIS</div>
          {aiLoading ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Spinner /><span style={{ color: "var(--ts)", fontSize: 12 }}>Generating analysis...</span></div>
            : aiSummary ? <p style={{ color: "var(--ts)", fontSize: 13, lineHeight: 1.6 }}>{aiSummary}</p>
            : <p style={{ color: "var(--tm)", fontSize: 12 }}>Enter Anthropic API key to generate AI analysis</p>}
        </div>

        {/* Related articles */}
        {relatedArticles.length > 0 && (
          <div>
            <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 8 }}>RELATED ARTICLES</div>
            {relatedArticles.map(a => (
              <ArticleSourceLink key={a.id} article={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ARTICLE SOURCE LINK (hover popup + click to modal) ───────────────────────
export const ArticleSourceLink = ({ article, compact }) => {
  const { showArticleHover, hideArticleHover, openArticleModal } = useApp();
  const [hovering, setHovering] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e) => {
    setHovering(true);
    const rect = e.currentTarget.getBoundingClientRect();
    showArticleHover(article, rect.left, rect.bottom + 6);
  };

  if (!article) return null;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => { setHovering(false); hideArticleHover(); }}
      onClick={() => openArticleModal(article.id)}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, background: hovering ? "var(--bg3)" : "var(--bg1)", cursor: "pointer", marginBottom: 4, border: "1px solid var(--border)", transition: "background .15s" }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: heatColor(article.heat || 60), flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: compact ? 11 : 12, color: "var(--tp)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{article.title}</div>
        {!compact && <div style={{ fontSize: 10, color: "var(--ts)", marginTop: 2 }}>{article.source} · {article.time}</div>}
      </div>
      <span style={{ color: "var(--amber)", fontSize: 10, fontFamily: "monospace", flexShrink: 0 }}>{article.source}</span>
    </div>
  );
};

// ─── ARTICLE HOVER POPUP ──────────────────────────────────────────────────────
export const ArticleHoverPopup = () => {
  const { hoveredArticle, hoverPos } = useApp();
  if (!hoveredArticle) return null;
  return (
    <div style={{ position: "fixed", left: Math.min(hoverPos.x, window.innerWidth - 320), top: hoverPos.y, zIndex: 9000, background: "var(--card-bg)", border: "1px solid var(--borderlit)", borderRadius: 8, padding: "12px 14px", maxWidth: 300, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", pointerEvents: "none" }} className="fade-up">
      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--tp)", marginBottom: 6, lineHeight: 1.4 }}>{hoveredArticle.title}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <span style={{ color: "var(--amber)", fontSize: 11, fontFamily: "monospace" }}>{hoveredArticle.source}</span>
        <span style={{ color: "var(--tm)", fontSize: 11 }}>·</span>
        <span style={{ color: "var(--ts)", fontSize: 11 }}>{hoveredArticle.url}</span>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {hoveredArticle.themes?.map(t => <Chip key={t}>{t}</Chip>)}
      </div>
      <div style={{ marginTop: 8, color: "var(--cyan)", fontSize: 11, fontFamily: "monospace" }}>Click to open in Article Feed →</div>
    </div>
  );
};

// ─── ARTICLE FEED MODAL ───────────────────────────────────────────────────────
export const ArticleFeedModal = ({ onClose }) => {
  const { articleModal } = useApp();
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 700, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(6,7,9,0.85)" }} onClick={onClose}>
      <div className="fade-up" onClick={e => e.stopPropagation()}
        style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px 28px", maxWidth: 680, width: "94%", maxHeight: "80vh", overflow: "auto", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div className="mono" style={{ color: "var(--amber)", fontSize: 11, letterSpacing: "0.15em" }}>ARTICLE REFERENCE HUB</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--tm)", cursor: "pointer", fontSize: 22 }}>×</button>
        </div>
        {ARTICLES.map(a => (
          <div key={a.id} style={{ padding: "12px 14px", borderRadius: 8, marginBottom: 10, background: a.id === articleModal ? "var(--amber-glow)" : "var(--bg1)", border: `1px solid ${a.id === articleModal ? "var(--borderlit)" : "var(--border)"}`, transition: "all .3s" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.isLive ? "var(--green)" : heatColor(a.heat || 60), marginTop: 5, flexShrink: 0 }} className={a.isLive ? "pulse" : ""} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: "var(--tp)", lineHeight: 1.4 }}>{a.title}</div>
                <p style={{ color: "var(--ts)", fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>{a.summary}</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ color: "var(--amber)", fontSize: 11, fontFamily: "monospace" }}>{a.source}</span>
                  <span style={{ color: "var(--tm)", fontSize: 11 }}>{a.time}</span>
                  {a.themes?.map(t => <Chip key={t}>{t}</Chip>)}
                  <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "auto", color: "var(--cyan)", fontSize: 11, fontFamily: "monospace", textDecoration: "none" }}>Open ↗</a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── CLAUDE API ───────────────────────────────────────────────────────────────
export async function callClaude(apiKey, systemPrompt, userPrompt, maxTokens = 800) {
  if (!apiKey || apiKey === "DEMO") return "[ Demo mode — enter an Anthropic API key to see live AI responses ]";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: maxTokens, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.[0]?.text || "";
}
