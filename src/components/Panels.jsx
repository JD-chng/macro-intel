import { useState, useEffect, useCallback } from "react";
import { ARTICLES, THEMES, MEMORY, SOCIAL_DATA } from "../data/seed.js";
import { SectionTitle, Chip, Spinner, heatColor, heatEmoji, callClaude, ArticleSourceLink } from "./shared.jsx";
import { useApp } from "../context/AppContext.jsx";

// ─── ARTICLE FEED ─────────────────────────────────────────────────────────────
export function ArticleFeedPanel({ liveArticles }) {
  const { articleModal } = useApp();
  const [filter, setFilter] = useState("all");

  const allArticles = [...liveArticles, ...ARTICLES];
  const themeFilters = ["all", ...new Set(THEMES.slice(0, 5).map(t => t.name))];
  const filtered = filter === "all" ? allArticles : allArticles.filter(a => a.themes?.includes(filter));

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <SectionTitle>Article Intelligence Feed — Source Reference Hub</SectionTitle>
        <p style={{ color: "var(--ts)", fontSize: 12, marginBottom: 12 }}>Primary source audit trail for all AI-generated insights. Hover any source across the platform for a preview, click to return here.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {themeFilters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ background: filter === f ? "var(--amber)" : "var(--bg3)", color: filter === f ? "#000" : "var(--ts)", border: `1px solid var(--border)`, borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontFamily: "monospace", fontWeight: filter === f ? 700 : 400 }}>
              {f === "all" ? "All" : f.split(" ").slice(0,2).join(" ")}
            </button>
          ))}
          {liveArticles.length > 0 && <span style={{ fontSize: 11, color: "var(--green)", fontFamily: "monospace", paddingTop: 4 }}>● {liveArticles.length} live from Reuters</span>}
        </div>
      </div>
      <div className="card">
        {filtered.map((a, i) => (
          <div key={a.id || i} id={`article-${a.id}`}
            style={{ padding: a.id === articleModal ? "12px 20px" : "12px 0", borderBottom: "1px solid var(--border)", background: a.id === articleModal ? "var(--amber-glow)" : "transparent", margin: a.id === articleModal ? "0 -20px" : "0", transition: "all .3s", borderRadius: a.id === articleModal ? 6 : 0 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.isLive ? "var(--green)" : heatColor(a.heat||60), marginTop: 5, flexShrink: 0 }} className={a.isLive ? "pulse" : ""} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 6, lineHeight: 1.4, color: "var(--tp)" }}>{a.title}</div>
                {a.summary && <p style={{ color: "var(--ts)", fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>{a.summary}</p>}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ color: "var(--amber)", fontSize: 11, fontFamily: "monospace" }}>{a.source}</span>
                  <span style={{ color: "var(--tm)", fontSize: 11 }}>{a.time}</span>
                  {a.isLive && <span style={{ color: "var(--green)", fontSize: 10, fontFamily: "monospace", border: "1px solid var(--green)44", padding: "1px 6px", borderRadius: 3 }}>● LIVE</span>}
                  {a.themes?.map(t => <Chip key={t}>{t}</Chip>)}
                  <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "auto", color: "var(--cyan)", fontSize: 11, fontFamily: "monospace", textDecoration: "none" }}>Open ↗</a>
                  {a.heat && <span className="mono" style={{ fontSize: 12, color: heatColor(a.heat) }}>HEAT {a.heat}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── INSTITUTIONAL MEMORY ──────────────────────────────────────────────────────
export function MemoryPanel({ apiKey }) {
  const [q, setQ] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const text = await callClaude(apiKey,
        "You are an institutional memory system for a macro hedge fund. Answer queries about past analysis based on historical records. Be specific about dates, heat scores, and whether predictions proved accurate.",
        `Query: "${q}"\n\nHistorical records:\n${JSON.stringify(MEMORY, null, 2)}\n\nAnswer in 3-4 sentences, referencing specific dates, heat scores, and accuracy of past calls.`
      );
      setResult(text);
    } catch (e) { setResult("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <SectionTitle>Institutional Memory — Semantic Search</SectionTitle>
        <p style={{ color: "var(--ts)", fontSize: 12, marginBottom: 14 }}>Search past AI analyses, risk assessments, and theme calls. Every output is timestamped and accuracy-tracked.</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search()}
            placeholder='e.g. "What did we say about Fed policy in October?"'
            style={{ flex: 1, background: "var(--bg1)", border: "1px solid var(--borderlit)", borderRadius: 6, padding: "10px 14px", color: "var(--tp)", fontFamily: "'Space Mono',monospace", fontSize: 13 }} />
          <button onClick={search} disabled={loading}
            style={{ background: "var(--cyan)", color: "#000", border: "none", borderRadius: 6, padding: "10px 20px", cursor: "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
            {loading ? <><Spinner /> Searching...</> : "Recall →"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["What did we miss on China?", "How accurate was BOJ call?", "Fed pivot prediction"].map(s => (
            <button key={s} onClick={() => { setQ(s); setTimeout(() => search(), 0); }}
              style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 10px", color: "var(--ts)", fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>{s}</button>
          ))}
        </div>
        {result && (
          <div className="fade-up" style={{ marginTop: 14, background: "var(--bg1)", borderRadius: 8, padding: "14px 16px", border: "1px solid var(--cyan)44" }}>
            <div className="mono" style={{ color: "var(--cyan)", fontSize: 10, marginBottom: 8 }}>MEMORY RECALL</div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--tp)" }}>{result}</p>
          </div>
        )}
      </div>
      <div className="card">
        <SectionTitle>Analysis Archive</SectionTitle>
        {MEMORY.map(m => (
          <div key={m.id} style={{ background: "var(--bg1)", borderRadius: 8, padding: "12px 16px", marginBottom: 10, borderLeft: "3px solid var(--cyan)55" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
              <span className="mono" style={{ color: "var(--amber)", fontSize: 12 }}>{m.date}</span>
              {m.themes.map(t => <Chip key={t}>{t}</Chip>)}
              <span className="mono" style={{ marginLeft: "auto", color: "var(--cyan)", fontSize: 12 }}>Heat {m.heat}</span>
            </div>
            <p style={{ color: "var(--ts)", fontSize: 13, lineHeight: 1.5, marginBottom: 6 }}>{m.summary}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: m.accuracy.startsWith("Correct") ? "var(--green)" : m.accuracy.startsWith("Partially") ? "var(--amber)" : "var(--red)", fontFamily: "monospace" }}>
                {m.accuracy.startsWith("Correct") ? "✓" : m.accuracy.startsWith("Partially") ? "~" : "✗"} {m.accuracy}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI QUERY ─────────────────────────────────────────────────────────────────
export function AIQueryPanel({ apiKey }) {
  const [q, setQ] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const EXAMPLES = [
    "What macro themes are affecting emerging markets?",
    "Which themes are heating up this week?",
    "How has the Fed narrative evolved?",
    "What are the biggest tail risks right now?",
    "Compare BOJ vs Fed policy risk profiles",
  ];
  const ask = async (query) => {
    const finalQ = query || q;
    if (!finalQ.trim()) return;
    setLoading(true); setResult("");
    try {
      const ctx = `You are a senior macro intelligence analyst. Active themes: ${THEMES.map(t => `${t.name} (heat ${t.heat}, ${t.status})`).join("; ")}. Answer concisely in 4-5 sentences. Be specific and actionable.`;
      const text = await callClaude(apiKey, ctx, finalQ);
      setResult(text);
    } catch (e) { setResult("Error: " + e.message); }
    setLoading(false);
  };
  return (
    <div className="card fade-up">
      <SectionTitle>Natural Language Macro Query</SectionTitle>
      <p style={{ color: "var(--ts)", fontSize: 13, marginBottom: 16 }}>Ask any question about current macro themes, risks, or market dynamics. The AI synthesizes live intelligence to answer.</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && ask()}
          placeholder="Ask the macro intelligence engine..."
          style={{ flex: 1, background: "var(--bg1)", border: "1px solid var(--borderlit)", borderRadius: 6, padding: "11px 14px", color: "var(--tp)", fontFamily: "'Space Mono',monospace", fontSize: 13 }} />
        <button onClick={() => ask()} disabled={loading}
          style={{ background: loading ? "var(--bg3)" : "var(--amber)", color: "#000", border: "none", borderRadius: 6, padding: "11px 22px", cursor: "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
          {loading ? <><Spinner /> Analyzing...</> : "Query →"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {EXAMPLES.map(ex => (
          <button key={ex} onClick={() => { setQ(ex); ask(ex); }}
            style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 10px", color: "var(--ts)", fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>{ex}</button>
        ))}
      </div>
      {result && (
        <div className="fade-up" style={{ background: "var(--bg1)", borderRadius: 8, padding: 20, border: "1px solid var(--borderlit)" }}>
          <div className="mono" style={{ color: "var(--green)", fontSize: 10, marginBottom: 8 }}>AI MACRO INTELLIGENCE RESPONSE</div>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--tp)" }}>{result}</p>
        </div>
      )}
    </div>
  );
}

// ─── SOCIAL PULSE ─────────────────────────────────────────────────────────────
async function fetchReddit() {
  try {
    const feeds = ["investing","MacroEconomics","wallstreetbets","economics"];
    const results = await Promise.all(feeds.map(sub =>
      fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=5&t=day`, { headers: { "Accept": "application/json" } })
        .then(r => r.json()).then(d => (d.data?.children || []).map(p => ({
          id: p.data.id, source: "Reddit", subreddit: `r/${sub}`, author: p.data.author,
          content: p.data.title, upvotes: p.data.score, comments: p.data.num_comments,
          time: new Date(p.data.created_utc * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " ago",
          url: `https://reddit.com${p.data.permalink}`, sentiment: p.data.upvote_ratio > 0.7 ? "bullish" : "bearish",
        }))).catch(() => [])
    ));
    return results.flat().slice(0, 15);
  } catch { return []; }
}

async function fetchStockTwits() {
  try {
    const res = await fetch("https://api.stocktwits.com/api/2/streams/trending.json");
    const data = await res.json();
    return (data.messages || []).slice(0, 8).map(m => ({
      id: m.id, source: "StockTwits", author: m.user.username,
      content: m.body, upvotes: m.likes?.total || 0, comments: 0,
      time: "recent", sentiment: m.entities?.sentiment?.basic === "Bullish" ? "bullish" : "bearish",
    }));
  } catch { return []; }
}

export function SocialPulsePanel() {
  const [tab, setTab] = useState("overview");
  const [liveData, setLiveData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchLive = async () => {
    setLoading(true);
    const [reddit, stocktwits] = await Promise.all([fetchReddit(), fetchStockTwits()]);
    setLiveData([...reddit, ...stocktwits]);
    setFetched(true);
    setLoading(false);
  };

  const d = SOCIAL_DATA;
  const displayPosts = liveData.length > 0 ? liveData : d.posts;

  const fearColor = d.fearGreed < 25 ? "var(--red)" : d.fearGreed < 45 ? "var(--amber)" : d.fearGreed < 55 ? "var(--yellow)" : d.fearGreed < 75 ? "var(--cyan)" : "var(--green)";

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["overview","trending","sentiment","feed"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ background: tab === t ? "var(--amber)" : "var(--bg3)", color: tab === t ? "#000" : "var(--ts)", border: `1px solid ${tab === t ? "transparent" : "var(--border)"}`, borderRadius: 5, padding: "6px 14px", cursor: "pointer", fontFamily: "monospace", fontSize: 12, fontWeight: tab === t ? 700 : 400, textTransform: "capitalize" }}>
            {t === "overview" ? "Overview" : t === "trending" ? "Trending" : t === "sentiment" ? "Sentiment Signals" : "Live Feed"}
          </button>
        ))}
        <button onClick={fetchLive} disabled={loading}
          style={{ marginLeft: "auto", background: "var(--bg3)", border: "1px solid var(--borderlit)", borderRadius: 5, padding: "6px 14px", color: "var(--amber)", cursor: "pointer", fontFamily: "monospace", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
          {loading ? <><Spinner size={12} /> Fetching...</> : fetched ? "↻ Refresh Live" : "⚡ Fetch Live Data"}
        </button>
      </div>

      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Fear & Greed */}
          <div className="card">
            <SectionTitle color={fearColor}>Social Fear & Greed Index</SectionTitle>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div className="mono" style={{ fontSize: 60, fontWeight: 700, color: fearColor, lineHeight: 1 }}>{d.fearGreed}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: fearColor, marginTop: 6 }}>{d.fearGreedLabel}</div>
              <div style={{ color: "var(--ts)", fontSize: 12, marginTop: 4 }}>Derived from Reddit + StockTwits + Twitter/X + YouTube</div>
            </div>
            <div style={{ height: 12, background: `linear-gradient(90deg, var(--red), var(--amber) 25%, var(--yellow) 50%, var(--cyan) 75%, var(--green))`, borderRadius: 6, position: "relative", marginBottom: 20 }}>
              <div style={{ position: "absolute", left: `${d.fearGreed}%`, top: "50%", transform: "translate(-50%,-50%)", width: 18, height: 18, borderRadius: "50%", background: fearColor, border: "3px solid var(--bg0)", boxShadow: `0 0 8px ${fearColor}` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              {["Extreme Fear","Fear","Neutral","Greed","Extreme Greed"].map(l => (
                <span key={l} style={{ fontSize: 9, color: "var(--tm)", fontFamily: "monospace", textAlign: "center", maxWidth: 50 }}>{l}</span>
              ))}
            </div>
            {/* By source */}
            <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 8, textTransform: "uppercase" }}>By Source</div>
            {Object.entries(d.fearGreedBySource).map(([src, val]) => {
              const c = val < 35 ? "var(--red)" : val < 50 ? "var(--amber)" : "var(--green)";
              return (
                <div key={src} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: "var(--ts)", fontSize: 12, minWidth: 70 }}>{src}</span>
                  <div style={{ flex: 1, height: 5, background: "var(--bg3)", borderRadius: 3 }}>
                    <div style={{ width: `${val}%`, height: "100%", background: c, borderRadius: 3 }} />
                  </div>
                  <span className="mono" style={{ color: c, fontSize: 12, fontWeight: 700, minWidth: 28 }}>{val}</span>
                </div>
              );
            })}
          </div>

          {/* Lead Time Indicator */}
          <div className="card">
            <SectionTitle color="var(--purple)">Social → News Lead Time</SectionTitle>
            <div style={{ background: "var(--bg1)", borderRadius: 8, padding: "14px 16px", marginBottom: 16, border: "1px solid var(--purple)44" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ color: "var(--ts)", fontSize: 13 }}>Average lead time</span>
                <span className="mono" style={{ color: "var(--purple)", fontSize: 22, fontWeight: 700 }}>{d.leadTimeAvg}h</span>
              </div>
              <p style={{ color: "var(--tm)", fontSize: 11, lineHeight: 1.5 }}>Social buzz precedes mainstream news coverage by an average of {d.leadTimeAvg} hours — giving you an early warning edge.</p>
            </div>
            {d.leadTimeHistory.map((h, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "var(--tp)", fontSize: 12, fontWeight: 600 }}>{h.theme}</span>
                  <span className="mono" style={{ color: "var(--purple)", fontSize: 12, fontWeight: 700 }}>+{h.leadHours}h lead</span>
                </div>
                <div style={{ position: "relative", height: 24, background: "var(--bg3)", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.min(60, h.leadHours/72*100)}%`, background: "var(--purple)44", borderRight: "2px solid var(--purple)", display: "flex", alignItems: "center", paddingLeft: 6 }}>
                    <span style={{ fontSize: 9, color: "var(--purple)", fontFamily: "monospace", whiteSpace: "nowrap" }}>Social {h.socialBuzzDate}</span>
                  </div>
                  <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${100 - Math.min(60, h.leadHours/72*100)}%`, background: "var(--cyan)22", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6 }}>
                    <span style={{ fontSize: 9, color: "var(--cyan)", fontFamily: "monospace", whiteSpace: "nowrap" }}>News {h.newsPickupDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "trending" && (
        <div className="card fade-up">
          <SectionTitle color="var(--red)">Trending Macro Topics — Social Velocity</SectionTitle>
          {d.trending.map((t, i) => (
            <div key={t.topic} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <span className="mono" style={{ color: "var(--tm)", fontSize: 14, minWidth: 20 }}>#{i+1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--tp)" }}>{t.topic}</span>
                  <span style={{ background: t.sentiment === "bearish" ? "var(--red)22" : "var(--green)22", border: `1px solid ${t.sentiment === "bearish" ? "var(--red)44" : "var(--green)44"}`, color: t.sentiment === "bearish" ? "var(--red)" : "var(--green)", padding: "2px 6px", borderRadius: 3, fontSize: 10, fontFamily: "monospace" }}>{t.sentiment}</span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ flex: 1, height: 4, background: "var(--bg3)", borderRadius: 2 }}>
                    <div style={{ width: `${(t.mentions/8500)*100}%`, height: "100%", background: t.sentiment === "bearish" ? "var(--red)" : "var(--green)", borderRadius: 2 }} />
                  </div>
                  <span className="mono" style={{ color: "var(--ts)", fontSize: 11, minWidth: 40 }}>{(t.mentions/1000).toFixed(1)}k</span>
                  <span className="mono" style={{ color: t.change.startsWith("+") ? "var(--red)" : "var(--cyan)", fontSize: 11 }}>{t.change}</span>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                  {t.sources.map(s => <Chip key={s} color="var(--purple)">{s}</Chip>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "sentiment" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="fade-up">
          <div className="card">
            <SectionTitle color="var(--amber)">Sentiment Shift Alerts</SectionTitle>
            {d.sentimentShifts.map((s, i) => (
              <div key={i} style={{ background: "var(--bg1)", borderRadius: 8, padding: "12px 14px", marginBottom: 10, borderLeft: `3px solid ${s.from === "Bearish" ? "var(--green)" : "var(--red)"}` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--tp)", marginBottom: 6 }}>{s.topic}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ color: s.from === "Bearish" ? "var(--red)" : s.from === "Bullish" ? "var(--green)" : "var(--ts)", fontFamily: "monospace", fontSize: 12 }}>{s.from}</span>
                  <span style={{ color: "var(--amber)", fontSize: 14 }}>→</span>
                  <span style={{ color: s.to === "Bearish" ? "var(--red)" : s.to === "Bullish" ? "var(--green)" : "var(--ts)", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{s.to}</span>
                </div>
                <div style={{ color: "var(--ts)", fontSize: 11 }}>{s.magnitude} signal · {s.hoursAgo}h ago</div>
              </div>
            ))}
          </div>
          <div className="card">
            <SectionTitle color="var(--cyan)">Contrarian Signals</SectionTitle>
            <p style={{ color: "var(--ts)", fontSize: 12, marginBottom: 14 }}>When social sentiment diverges from news coverage — often the most actionable signal.</p>
            {d.contrarian.map((c, i) => (
              <div key={i} style={{ background: "var(--bg1)", borderRadius: 8, padding: "14px 16px", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--tp)", marginBottom: 10 }}>{c.topic}</div>
                <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div className="mono" style={{ fontSize: 9, color: "var(--purple)", marginBottom: 4 }}>SOCIAL BULL%</div>
                    <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: c.socialSentiment > 50 ? "var(--green)" : "var(--red)" }}>{c.socialSentiment}%</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="mono" style={{ fontSize: 9, color: "var(--cyan)", marginBottom: 4 }}>NEWS BULL%</div>
                    <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: c.newsSentiment > 50 ? "var(--green)" : "var(--red)" }}>{c.newsSentiment}%</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="mono" style={{ fontSize: 9, color: "var(--amber)", marginBottom: 4 }}>DIVERGENCE</div>
                    <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: Math.abs(c.divergence) > 40 ? "var(--red)" : "var(--amber)" }}>{Math.abs(c.divergence)}pts</div>
                  </div>
                </div>
                <div style={{ background: "var(--bg3)", borderRadius: 6, padding: "8px 10px" }}>
                  <p style={{ color: "var(--ts)", fontSize: 12, lineHeight: 1.5 }}>{c.signal}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "feed" && (
        <div className="card fade-up">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <SectionTitle>Live Social Feed — Reddit · StockTwits · Twitter/X</SectionTitle>
            {!fetched && <span style={{ color: "var(--tm)", fontSize: 11, fontFamily: "monospace" }}>Click "Fetch Live Data" to load real posts</span>}
          </div>
          {displayPosts.map((p, i) => (
            <div key={p.id || i} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ background: p.source === "Reddit" ? "#ff450022" : p.source === "StockTwits" ? "#00aaff22" : "#1da1f222", border: `1px solid ${p.source === "Reddit" ? "#ff450044" : p.source === "StockTwits" ? "#00aaff44" : "#1da1f244"}`, borderRadius: 5, padding: "3px 7px", fontSize: 10, fontFamily: "monospace", color: p.source === "Reddit" ? "#ff4500" : p.source === "StockTwits" ? "#00aaff" : "#1da1f2", flexShrink: 0 }}>{p.source}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    {p.subreddit && <span style={{ color: "var(--ts)", fontSize: 11 }}>{p.subreddit}</span>}
                    <span style={{ color: "var(--amber)", fontSize: 11, fontFamily: "monospace" }}>@{p.author}</span>
                    <span style={{ color: "var(--tm)", fontSize: 11, marginLeft: "auto" }}>{p.time}</span>
                  </div>
                  <p style={{ color: "var(--tp)", fontSize: 13, lineHeight: 1.55, marginBottom: 6 }}>{p.content}</p>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ color: "var(--ts)", fontSize: 11 }}>▲ {p.upvotes?.toLocaleString()}</span>
                    {p.comments > 0 && <span style={{ color: "var(--ts)", fontSize: 11 }}>💬 {p.comments}</span>}
                    <span style={{ background: p.sentiment === "bearish" ? "var(--red)22" : "var(--green)22", color: p.sentiment === "bearish" ? "var(--red)" : "var(--green)", border: `1px solid ${p.sentiment === "bearish" ? "var(--red)44" : "var(--green)44"}`, padding: "2px 6px", borderRadius: 3, fontSize: 10, fontFamily: "monospace" }}>{p.sentiment}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
