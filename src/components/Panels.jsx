import { useState } from "react";
import { SectionTitle, Chip, Spinner, heatColor, callClaude } from "./shared.jsx";
import { useApp } from "../context/AppContext.jsx";
import { fetchMemory, saveMemory } from "../lib/supabase.js";

// ─── ARTICLE FEED ─────────────────────────────────────────────────────────────
export function ArticleFeedPanel({ articles = [], themes = [], liveArticles = [] }) {
  const { articleModal } = useApp();
  const [filter, setFilter] = useState("all");

  const allArticles = articles.length > 0 ? articles : liveArticles;
  const themeNames = ["all", ...new Set(themes.slice(0, 5).map(t => t.name))];
  const filtered = filter === "all" ? allArticles : allArticles.filter(a => a.themes?.includes(filter));

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <SectionTitle>Article Intelligence Feed — Source Reference Hub</SectionTitle>
        <p style={{ color: "var(--ts)", fontSize: 12, marginBottom: 12 }}>
          Live articles from RSS feeds and NewsAPI, classified by Claude AI. {allArticles.length} articles in database.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {themeNames.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ background: filter === f ? "var(--amber)" : "var(--bg3)", color: filter === f ? "#000" : "var(--ts)", border: `1px solid var(--border)`, borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontFamily: "monospace", fontWeight: filter === f ? 700 : 400 }}>
              {f === "all" ? "All" : f.split(" ").slice(0,2).join(" ")}
            </button>
          ))}
          {allArticles.filter(a => a.is_live).length > 0 && (
            <span style={{ fontSize: 11, color: "var(--green)", fontFamily: "monospace", paddingTop: 4 }}>
              ● {allArticles.filter(a => a.is_live).length} live
            </span>
          )}
        </div>
      </div>
      <div className="card">
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px", color: "var(--ts)", fontFamily: "monospace", fontSize: 13 }}>
            No articles yet — backend will populate on next ingestion cycle
          </div>
        )}
        {filtered.map((a, i) => (
          <div key={a.id || i} id={`article-${a.id}`}
            style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", background: a.id === articleModal ? "var(--amber-glow)" : "transparent", transition: "all .3s" }}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.is_live ? "var(--green)" : heatColor(a.heat_score || 60), marginTop: 5, flexShrink: 0 }} className={a.is_live ? "pulse" : ""} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 6, lineHeight: 1.4, color: "var(--tp)" }}>{a.title}</div>
                {a.summary && <p style={{ color: "var(--ts)", fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>{a.summary}</p>}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ color: "var(--amber)", fontSize: 11, fontFamily: "monospace" }}>{a.source}</span>
                  <span style={{ color: "var(--tm)", fontSize: 11 }}>
                    {a.published_at ? new Date(a.published_at).toLocaleDateString() : ""}
                  </span>
                  {a.is_live && <span style={{ color: "var(--green)", fontSize: 10, fontFamily: "monospace", border: "1px solid var(--green)44", padding: "1px 6px", borderRadius: 3 }}>● LIVE</span>}
                  {a.sentiment && <span className="mono" style={{ fontSize: 10, color: a.sentiment === "bearish" ? "var(--red)" : a.sentiment === "bullish" ? "var(--green)" : "var(--ts)" }}>{a.sentiment}</span>}
                  {(a.themes || []).slice(0, 2).map(t => <Chip key={t}>{t.split(" ").slice(0,2).join(" ")}</Chip>)}
                  {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "auto", color: "var(--cyan)", fontSize: 11, fontFamily: "monospace", textDecoration: "none" }}>Open ↗</a>}
                  {a.heat_score && <span className="mono" style={{ fontSize: 12, color: heatColor(a.heat_score) }}>HEAT {a.heat_score}</span>}
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
export function MemoryPanel({ themes = [], articles = [] }) {
  const [q, setQ] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [memoryRecords, setMemoryRecords] = useState([]);
  const [memLoading, setMemLoading] = useState(false);

  useState(() => {
    setMemLoading(true);
    fetchMemory().then(m => { setMemoryRecords(m || []); setMemLoading(false); }).catch(() => setMemLoading(false));
  }, []);

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const themeCtx = themes.slice(0, 8).map(t => `${t.name} (heat: ${t.heat}, status: ${t.status})`).join("; ");
      const memCtx = memoryRecords.slice(0, 10).map(m => `[${m.created_at?.slice(0,10)}] ${m.summary} (themes: ${(m.themes||[]).join(", ")})`).join("\n");
      const recentHeadlines = articles.slice(0, 10).map(a => `- ${a.title}`).join("\n");

      const text = await callClaude(
        "You are an institutional memory system for a macro hedge fund. Answer queries about past analysis and current themes. Be specific and reference dates/heat scores where available.",
        `Query: "${q}"\n\nCurrent live themes: ${themeCtx}\n\nPast analyses:\n${memCtx || "No records yet"}\n\nRecent headlines:\n${recentHeadlines}\n\nAnswer in 3-4 sentences, referencing specific themes and dates.`
      );
      setResult(text);

      // Save query to memory
      await saveMemory({ query_text: q, summary: text.slice(0, 300), themes: themes.slice(0,3).map(t => t.name), heat_at_time: themes[0]?.heat || 0 });
    } catch (e) { setResult("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <SectionTitle>Institutional Memory — Semantic Search</SectionTitle>
        <p style={{ color: "var(--ts)", fontSize: 12, marginBottom: 14 }}>Search past AI analyses and current theme intelligence. Every query is saved for future reference.</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search()}
            placeholder='e.g. "What did we say about Fed policy?" or "Current tariff risks"'
            style={{ flex: 1, background: "var(--bg1)", border: "1px solid var(--borderlit)", borderRadius: 6, padding: "10px 14px", color: "var(--tp)", fontFamily: "'Space Mono',monospace", fontSize: 13 }} />
          <button onClick={search} disabled={loading}
            style={{ background: "var(--cyan)", color: "#000", border: "none", borderRadius: 6, padding: "10px 20px", cursor: "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
            {loading ? <><Spinner /> Searching...</> : "Recall →"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["What themes are heating up?", "Current EM risks", "Fed vs BOJ divergence"].map(s => (
            <button key={s} onClick={() => { setQ(s); setTimeout(search, 0); }}
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
        {memLoading && <div style={{ textAlign: "center", padding: 20 }}><Spinner /></div>}
        {!memLoading && memoryRecords.length === 0 && (
          <div style={{ color: "var(--ts)", fontSize: 12, textAlign: "center", padding: 20, fontFamily: "monospace" }}>
            No archived analyses yet — queries will be saved here automatically
          </div>
        )}
        {memoryRecords.map((m, i) => (
          <div key={m.id || i} style={{ background: "var(--bg1)", borderRadius: 8, padding: "12px 16px", marginBottom: 10, borderLeft: "3px solid var(--cyan)55" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
              <span className="mono" style={{ color: "var(--amber)", fontSize: 12 }}>{m.created_at?.slice(0,10)}</span>
              {(m.themes || []).map(t => <Chip key={t}>{t}</Chip>)}
              {m.heat_at_time > 0 && <span className="mono" style={{ marginLeft: "auto", color: "var(--cyan)", fontSize: 12 }}>Heat {m.heat_at_time}</span>}
            </div>
            <p style={{ color: "var(--ts)", fontSize: 13, lineHeight: 1.5 }}>{m.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI QUERY ─────────────────────────────────────────────────────────────────
export function AIQueryPanel({ themes = [], articles = [] }) {
  const [q, setQ] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const EXAMPLES = [
    "What macro themes are most urgent right now?",
    "Which themes are heating up this week?",
    "What are the biggest tail risks across current themes?",
    "Compare the top 2 themes by risk profile",
    "What should a portfolio manager watch this week?",
  ];
  const ask = async (query) => {
    const finalQ = query || q;
    if (!finalQ.trim()) return;
    setLoading(true); setResult("");
    try {
      const topThemes = [...themes].sort((a, b) => (b.heat || 0) - (a.heat || 0)).slice(0, 8);
      const themeCtx = topThemes.map(t => `${t.name} (heat: ${t.heat}/100, status: ${t.status || "Active"}, change: ${t.change_pct || "0%"})`).join("; ");
      const headlines = articles.slice(0, 10).map(a => `- ${a.title} (${a.source})`).join("\n");
      const ctx = `You are a senior macro intelligence analyst at a $50bn asset manager. 
Current live themes: ${themeCtx || "No themes loaded yet"}.
Recent headlines: ${headlines || "No headlines yet"}.
Answer concisely in 4-5 sentences. Be specific, quantitative, and actionable.`;
      const text = await callClaude( ctx, finalQ);
      setResult(text);
    } catch (e) { setResult("Error: " + e.message); }
    setLoading(false);
  };
  return (
    <div className="card fade-up">
      <SectionTitle>Natural Language Macro Query</SectionTitle>
      <p style={{ color: "var(--ts)", fontSize: 13, marginBottom: 16 }}>
        AI synthesizes {themes.length} live themes and {articles.length} articles to answer your query.
      </p>
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
          time: new Date(p.data.created_utc * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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

export function SocialPulsePanel({ socialMetrics = null }) {
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

  // Use live Supabase metrics if available, otherwise defaults
  const fearGreed = socialMetrics?.fear_greed ?? 50;
  const fearGreedLabel = socialMetrics?.fear_greed_label ?? "Neutral";
  const fearGreedBySource = socialMetrics?.fear_greed_by_source ?? { Reddit: 48, StockTwits: 52 };
  const trending = socialMetrics?.trending ?? [];
  const sentimentShifts = socialMetrics?.sentiment_shifts ?? [];
  const contrarian = socialMetrics?.contrarian ?? [];

  const fearColor = fearGreed < 25 ? "var(--red)" : fearGreed < 45 ? "var(--amber)" : fearGreed < 55 ? "var(--yellow)" : fearGreed < 75 ? "var(--cyan)" : "var(--green)";

  return (
    <div>
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
          <div className="card">
            <SectionTitle color={fearColor}>Social Fear & Greed Index</SectionTitle>
            {!socialMetrics && <div style={{ color: "var(--ts)", fontSize: 12, marginBottom: 12, fontFamily: "monospace" }}>⟳ Waiting for social data ingestion...</div>}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div className="mono" style={{ fontSize: 60, fontWeight: 700, color: fearColor, lineHeight: 1 }}>{fearGreed}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: fearColor, marginTop: 6 }}>{fearGreedLabel}</div>
              <div style={{ color: "var(--ts)", fontSize: 12, marginTop: 4 }}>Derived from Reddit + StockTwits</div>
            </div>
            <div style={{ height: 12, background: `linear-gradient(90deg, var(--red), var(--amber) 25%, var(--yellow) 50%, var(--cyan) 75%, var(--green))`, borderRadius: 6, position: "relative", marginBottom: 20 }}>
              <div style={{ position: "absolute", left: `${fearGreed}%`, top: "50%", transform: "translate(-50%,-50%)", width: 18, height: 18, borderRadius: "50%", background: fearColor, border: "3px solid var(--bg0)", boxShadow: `0 0 8px ${fearColor}` }} />
            </div>
            <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 8, textTransform: "uppercase" }}>By Source</div>
            {Object.entries(fearGreedBySource).map(([src, val]) => {
              const c = val < 35 ? "var(--red)" : val < 50 ? "var(--amber)" : "var(--green)";
              return (
                <div key={src} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: "var(--ts)", fontSize: 12, minWidth: 80 }}>{src}</span>
                  <div style={{ flex: 1, height: 5, background: "var(--bg3)", borderRadius: 3 }}>
                    <div style={{ width: `${val}%`, height: "100%", background: c, borderRadius: 3 }} />
                  </div>
                  <span className="mono" style={{ color: c, fontSize: 12, fontWeight: 700, minWidth: 28 }}>{val}</span>
                </div>
              );
            })}
          </div>
          <div className="card">
            <SectionTitle color="var(--purple)">Trending Topics</SectionTitle>
            {trending.length === 0 && <div style={{ color: "var(--ts)", fontSize: 12, fontFamily: "monospace" }}>⟳ Waiting for social data...</div>}
            {trending.map((t, i) => (
              <div key={t.topic || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <span className="mono" style={{ color: "var(--tm)", fontSize: 13, minWidth: 20 }}>#{i+1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--tp)", marginBottom: 3 }}>{t.topic}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span className="mono" style={{ fontSize: 11, color: "var(--ts)" }}>{t.mentions} mentions</span>
                    <span style={{ color: t.sentiment === "bearish" ? "var(--red)" : "var(--green)", fontSize: 11, fontFamily: "monospace" }}>{t.sentiment}</span>
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
          {trending.length === 0 && <div style={{ color: "var(--ts)", fontSize: 13, fontFamily: "monospace", textAlign: "center", padding: 24 }}>⟳ No trending data yet — waiting for ingestion cycle</div>}
          {trending.map((t, i) => (
            <div key={t.topic || i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <span className="mono" style={{ color: "var(--tm)", fontSize: 14, minWidth: 20 }}>#{i+1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--tp)" }}>{t.topic}</span>
                  <span style={{ background: t.sentiment === "bearish" ? "var(--red)22" : "var(--green)22", border: `1px solid ${t.sentiment === "bearish" ? "var(--red)44" : "var(--green)44"}`, color: t.sentiment === "bearish" ? "var(--red)" : "var(--green)", padding: "2px 6px", borderRadius: 3, fontSize: 10, fontFamily: "monospace" }}>{t.sentiment}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {(t.sources || []).map(s => <Chip key={s} color="var(--purple)">{s}</Chip>)}
                </div>
              </div>
              <span className="mono" style={{ color: "var(--ts)", fontSize: 12 }}>{t.mentions}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "sentiment" && (
        <div className="card fade-up">
          <SectionTitle color="var(--amber)">Sentiment Signals</SectionTitle>
          {sentimentShifts.length === 0 && contrarian.length === 0 && (
            <div style={{ color: "var(--ts)", fontSize: 13, fontFamily: "monospace", textAlign: "center", padding: 24 }}>⟳ No sentiment signals yet — will populate after multiple ingestion cycles</div>
          )}
          {sentimentShifts.map((s, i) => (
            <div key={i} style={{ background: "var(--bg1)", borderRadius: 8, padding: "12px 14px", marginBottom: 10, borderLeft: "3px solid var(--amber)" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--tp)", marginBottom: 6 }}>{s.topic}</div>
              <div style={{ color: "var(--ts)", fontSize: 12 }}>{s.from} → {s.to}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "feed" && (
        <div className="card fade-up">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <SectionTitle>Live Social Feed — Reddit · StockTwits</SectionTitle>
            {!fetched && <span style={{ color: "var(--tm)", fontSize: 11, fontFamily: "monospace" }}>Click "Fetch Live Data" to load posts</span>}
          </div>
          {liveData.length === 0 && fetched && <div style={{ color: "var(--ts)", fontSize: 13, fontFamily: "monospace", textAlign: "center", padding: 20 }}>No live posts fetched</div>}
          {!fetched && <div style={{ color: "var(--ts)", fontSize: 13, fontFamily: "monospace", textAlign: "center", padding: 20 }}>Click ⚡ Fetch Live Data above</div>}
          {liveData.map((p, i) => (
            <div key={p.id || i} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ background: p.source === "Reddit" ? "#ff450022" : "#00aaff22", border: `1px solid ${p.source === "Reddit" ? "#ff450044" : "#00aaff44"}`, borderRadius: 5, padding: "3px 7px", fontSize: 10, fontFamily: "monospace", color: p.source === "Reddit" ? "#ff4500" : "#00aaff", flexShrink: 0 }}>{p.source}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    {p.subreddit && <span style={{ color: "var(--ts)", fontSize: 11 }}>{p.subreddit}</span>}
                    <span style={{ color: "var(--amber)", fontSize: 11, fontFamily: "monospace" }}>@{p.author}</span>
                    <span style={{ color: "var(--tm)", fontSize: 11, marginLeft: "auto" }}>{p.time}</span>
                  </div>
                  <p style={{ color: "var(--tp)", fontSize: 13, lineHeight: 1.55, marginBottom: 6 }}>{p.content}</p>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ color: "var(--ts)", fontSize: 11 }}>▲ {(p.upvotes || 0).toLocaleString()}</span>
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
