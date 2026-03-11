import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { SectionTitle, Chip, Spinner, heatColor, heatColorHex, heatEmoji, ThemeDetailPopup, callClaude } from "./shared.jsx";

async function fetchAlphaVantage(ticker, avKey) {
  if (!avKey) return null;
  try {
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&apikey=${avKey}&limit=50`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.feed) return null;
    let bull = 0, bear = 0, neut = 0;
    data.feed.forEach(item => {
      const s = parseFloat(item.overall_sentiment_score || 0);
      if (s > 0.15) bull++; else if (s < -0.15) bear++; else neut++;
    });
    const total = bull + bear + neut || 1;
    return { bullish: Math.round(bull/total*100), bearish: Math.round(bear/total*100), neutral: Math.round(neut/total*100), articleCount: data.feed.length, topHeadline: data.feed[0]?.title || "" };
  } catch { return null; }
}

export default function OverviewPanel({ themes = [], articles = [], articleCount = 0, velocityArticles = [], socialMetrics = null }) {
  const avKey = import.meta.env.VITE_AV_KEY || "";
  const [popupTheme, setPopupTheme] = useState(null);
  const [sentimentIdx, setSentimentIdx] = useState(0);
  const [sentimentLive, setSentimentLive] = useState({});
  const [sentLoading, setSentLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Use live themes for sentiment tabs
  const topThemes = [...themes].sort((a, b) => (b.heat || 0) - (a.heat || 0)).slice(0, 5);
  const selectedTheme = topThemes[sentimentIdx] || null;
  const liveSent = selectedTheme ? sentimentLive[selectedTheme.name] : null;

  const loadSentiment = async (idx) => {
    setSentimentIdx(idx);
    const t = topThemes[idx];
    if (!t || !avKey || sentimentLive[t.name]) return;
    setSentLoading(true);
    const ticker = t.assets?.[0] || "SPY";
    const result = await fetchAlphaVantage(ticker, avKey);
    if (result) setSentimentLive(prev => ({ ...prev, [t.name]: result }));
    setSentLoading(false);
  };

  const searchResults = searchQ.trim()
    ? themes.filter(t =>
        t.name?.toLowerCase().includes(searchQ.toLowerCase()) ||
        t.tags?.some(tag => tag?.toLowerCase().includes(searchQ.toLowerCase())) ||
        t.description?.toLowerCase().includes(searchQ.toLowerCase())
      )
    : [];

  const askAI = async (q) => {
    const finalQ = q || query;
    if (!finalQ.trim()) return;
    setAiLoading(true); setAiResult("");
    try {
      const themeCtx = topThemes.map(t => `${t.name} (heat ${t.heat}/100, status: ${t.status || "Active"})`).join("; ");
      const headlines = articles.slice(0, 8).map(a => `- ${a.title}`).join("\n");
      const ctx = `You are a senior macro intelligence analyst. Live themes: ${themeCtx || "No themes loaded"}. Recent headlines:\n${headlines}\nAnswer concisely in 4-5 sentences. Be specific and actionable.`;
      const text = await callClaude(ctx, finalQ);
      setAiResult(text);
    } catch (e) { setAiResult("Error: " + e.message); }
    setAiLoading(false);
  };

  const EXAMPLE_QUERIES = [
    "What themes are heating up?",
    "Biggest tail risks right now?",
    "How does BOJ affect EM?",
    "Fed vs ECB divergence?",
  ];

  // Article velocity chart — uses all articles from last 7 days, not just the fetched 50
  const sourceArticles = velocityArticles.length > 0 ? velocityArticles : articles;
  const velocityData = Array.from({ length: 7 }, (_, i) => {
    const dayLabel = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i];
    const count = sourceArticles.filter(a => {
      const d = new Date(a.published_at || 0);
      return d.getDay() === (i + 1) % 7; // Mon=1..Sun=0 → align correctly
    }).length;
    return { d: dayLabel, v: count };
  });

  const fearGreed = socialMetrics?.fear_greed ?? 50;
  const fearGreedLabel = socialMetrics?.fear_greed_label ?? "Neutral";
  const fearColor = fearGreed < 25 ? "var(--red)" : fearGreed < 45 ? "var(--amber)" : fearGreed < 55 ? "var(--yellow)" : fearGreed < 75 ? "var(--cyan)" : "var(--green)";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {popupTheme && <ThemeDetailPopup theme={popupTheme} onClose={() => setPopupTheme(null)} articles={articles} />}

      {/* Status Bar */}
      <div style={{ gridColumn: "1/-1" }} className="card">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {[
            ["Active Themes", themes.length > 0 ? `${themes.length} live` : "Waiting...", "var(--amber)"],
            ["Live Articles", `${articleCount || articles.length} indexed`, "var(--cyan)"],
            ["Fear & Greed", `${fearGreed} — ${fearGreedLabel}`, fearColor],
            ["Engine Status", "Operational ●", "var(--green)"],
          ].map(([l, v, c]) => (
            <div key={l} style={{ background: "var(--bg1)", borderRadius: 6, padding: "14px 16px", borderLeft: `3px solid ${c}` }}>
              <div className="mono" style={{ color: "var(--tm)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{l}</div>
              <div className="mono" style={{ color: c, fontSize: 18, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Query */}
      <div className="card" style={{ gridColumn: "1/-1", border: "1px solid var(--borderlit)" }}>
        <SectionTitle color="var(--amber)">Ask the Macro Intelligence Engine</SectionTitle>
        <p style={{ color: "var(--ts)", fontSize: 12, marginBottom: 10 }}>AI has context of {themes.length} live themes and {articleCount || articles.length} real articles.</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && askAI()}
            placeholder="e.g. What are the biggest macro risks this week?"
            style={{ flex: 1, background: "var(--bg1)", border: "1px solid var(--borderlit)", borderRadius: 6, padding: "10px 14px", color: "var(--tp)", fontFamily: "'Space Mono',monospace", fontSize: 13 }} />
          <button onClick={() => askAI()} disabled={aiLoading}
            style={{ background: aiLoading ? "var(--bg3)" : "var(--amber)", color: "#000", border: "none", borderRadius: 6, padding: "10px 20px", cursor: aiLoading ? "not-allowed" : "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
            {aiLoading ? <><Spinner /> Analyzing...</> : "Query →"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: aiResult ? 10 : 0 }}>
          {EXAMPLE_QUERIES.map(ex => (
            <button key={ex} onClick={() => { setQuery(ex); askAI(ex); }}
              style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 10px", color: "var(--ts)", fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>{ex}</button>
          ))}
        </div>
        {aiResult && (
          <div className="fade-up" style={{ marginTop: 12, background: "var(--bg1)", borderRadius: 8, padding: "14px 16px", border: "1px solid var(--amber)33" }}>
            <div className="mono" style={{ color: "var(--amber)", fontSize: 10, marginBottom: 8 }}>AI RESPONSE — LIVE CONTEXT</div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--tp)" }}>{aiResult}</p>
          </div>
        )}
      </div>

      {/* Hot Themes */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SectionTitle>Hot Themes — Live Heat</SectionTitle>
          <div style={{ position: "relative" }}>
            <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)} onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              placeholder="Search themes..."
              style={{ background: "var(--bg1)", border: "1px solid var(--borderlit)", borderRadius: 5, padding: "5px 10px", color: "var(--tp)", fontFamily: "monospace", fontSize: 11, width: 140 }} />
            {showSearch && searchResults.length > 0 && (
              <div style={{ position: "absolute", top: "100%", right: 0, background: "var(--card-bg)", border: "1px solid var(--borderlit)", borderRadius: 8, zIndex: 50, minWidth: 200, boxShadow: "0 8px 24px #00000066" }}>
                {searchResults.map(t => (
                  <div key={t.id} onMouseDown={() => { setPopupTheme(t); setSearchQ(""); }}
                    style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ fontSize: 12, color: "var(--tp)", fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: heatColor(t.heat || 0), fontFamily: "monospace" }}>Heat {t.heat}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {themes.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--ts)", fontFamily: "monospace", fontSize: 12 }}>
            ⟳ Waiting for backend ingestion cycle...
          </div>
        )}
        {topThemes.map(t => (
          <div key={t.id || t.name} onClick={() => setPopupTheme(t)}
            style={{ background: "var(--bg1)", borderRadius: 8, padding: "12px 14px", marginBottom: 10, border: "1px solid var(--border)", cursor: "pointer", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = heatColor(t.heat || 0) + "66"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{heatEmoji(t.heat || 0)}</span>
              <span style={{ fontWeight: 700, fontSize: 13, flex: 1, color: "var(--tp)" }}>{t.name}</span>
              <span className="mono" style={{ color: heatColor(t.heat || 0), fontWeight: 700, fontSize: 16 }}>{t.heat}</span>
            </div>
            <div style={{ height: 4, background: "var(--bg3)", borderRadius: 2, marginBottom: 8 }}>
              <div style={{ width: `${t.heat || 0}%`, height: "100%", background: `linear-gradient(90deg,${heatColorHex(t.heat || 0)}88,${heatColorHex(t.heat || 0)})`, borderRadius: 2 }} />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(t.tags || []).slice(0, 3).map(tg => <Chip key={tg}>{tg}</Chip>)}
            </div>
          </div>
        ))}
      </div>

      {/* Article Velocity */}
      <div className="card">
        <SectionTitle color="var(--cyan)">Article Velocity — This Week</SectionTitle>
        <p style={{ color: "var(--ts)", fontSize: 11, marginBottom: 12 }}>{articleCount || articles.length} articles indexed from live RSS + NewsAPI feeds</p>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={velocityData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
            <XAxis dataKey="d" tick={{ fill: "var(--tm)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--tm)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 }} />
            <Area type="monotone" dataKey="v" stroke="var(--cyan)" fill="var(--cyan)" fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 14 }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 8, textTransform: "uppercase" }}>Recent Headlines</div>
          {articles.slice(0, 4).map((a, i) => (
            <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--tp)", lineHeight: 1.4, marginBottom: 3 }}>{a.title}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: "var(--amber)", fontSize: 10, fontFamily: "monospace" }}>{a.source}</span>
                {a.sentiment && <span style={{ color: a.sentiment === "bearish" ? "var(--red)" : a.sentiment === "bullish" ? "var(--green)" : "var(--ts)", fontSize: 10, fontFamily: "monospace" }}>{a.sentiment}</span>}
              </div>
            </div>
          ))}
          {articles.length === 0 && <div style={{ color: "var(--ts)", fontSize: 12, fontFamily: "monospace" }}>⟳ Waiting for articles...</div>}
        </div>
      </div>

      {/* Alpha Vantage Sentiment */}
      <div style={{ gridColumn: "1/-1" }} className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <SectionTitle color="var(--purple)">Market News Sentiment — Live Themes</SectionTitle>
          {!avKey
            ? <span style={{ fontSize: 11, color: "var(--tm)", fontFamily: "monospace", background: "var(--bg3)", padding: "3px 10px", borderRadius: 4, border: "1px solid var(--border)" }}>Alpha Vantage key not configured</span>
            : <span style={{ fontSize: 11, color: "var(--green)", fontFamily: "monospace" }}>● Live via Alpha Vantage</span>
          }
        </div>

        {topThemes.length === 0 ? (
          <div style={{ color: "var(--ts)", fontSize: 13, fontFamily: "monospace", textAlign: "center", padding: 24 }}>⟳ Waiting for themes to load...</div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {topThemes.map((t, i) => (
                <button key={t.name} onClick={() => loadSentiment(i)}
                  style={{ background: sentimentIdx === i ? heatColor(t.heat || 0) : "var(--bg3)", color: sentimentIdx === i ? "#000" : "var(--ts)", border: `1px solid ${sentimentIdx === i ? "transparent" : "var(--border)"}`, borderRadius: 5, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontFamily: "monospace", fontWeight: sentimentIdx === i ? 700 : 400 }}>
                  {t.name.split(" ").slice(0, 2).join(" ")}
                </button>
              ))}
            </div>

            {sentLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--purple)", fontFamily: "monospace", fontSize: 12 }}><Spinner /> Fetching live sentiment...</div>
            ) : selectedTheme ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ background: "var(--bg1)", borderRadius: 8, padding: 16 }}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 10, textTransform: "uppercase" }}>Theme Overview</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--tp)", marginBottom: 6 }}>{selectedTheme.name}</div>
                  <div style={{ color: "var(--ts)", fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>{selectedTheme.description || "AI-discovered macro theme"}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(selectedTheme.tags || []).map(tg => <Chip key={tg}>{tg}</Chip>)}
                    {(selectedTheme.countries || []).map(c => <Chip key={c} color="var(--cyan)">{c}</Chip>)}
                  </div>
                </div>
                <div style={{ background: "var(--bg1)", borderRadius: 8, padding: 16 }}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 10, textTransform: "uppercase" }}>Sentiment Score {liveSent ? "(Live)" : "(Heat Proxy)"}</div>
                  {liveSent ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: "var(--green)" }}>Bull {liveSent.bullish}%</span>
                        <span style={{ fontSize: 11, color: "var(--ts)" }}>Neutral {liveSent.neutral}%</span>
                        <span style={{ fontSize: 11, color: "var(--red)" }}>Bear {liveSent.bearish}%</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, overflow: "hidden", display: "flex", marginBottom: 10 }}>
                        <div style={{ width: `${liveSent.bullish}%`, background: "var(--green)" }} />
                        <div style={{ width: `${liveSent.neutral}%`, background: "var(--amber)", opacity: 0.4 }} />
                        <div style={{ width: `${liveSent.bearish}%`, background: "var(--red)" }} />
                      </div>
                      <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 4 }}>TOP HEADLINE</div>
                      <p style={{ fontSize: 11, color: "var(--ts)", lineHeight: 1.5 }}>{liveSent.topHeadline}</p>
                    </>
                  ) : (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div className="mono" style={{ fontSize: 40, fontWeight: 700, color: heatColor(selectedTheme.heat || 0) }}>{selectedTheme.heat}</div>
                        <div style={{ color: "var(--ts)", fontSize: 12 }}>Heat Score<br/>from {selectedTheme.article_count || 0} articles</div>
                      </div>
                      {!avKey && <div style={{ color: "var(--tm)", fontSize: 11, fontFamily: "monospace" }}>Add VITE_AV_KEY for live sentiment breakdown</div>}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
