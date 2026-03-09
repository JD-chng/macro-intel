import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { THEMES, ARTICLES, SOCIAL_DATA } from "../data/seed.js";
import { SectionTitle, Chip, Sparkline, Spinner, heatColor, heatEmoji, ThemeDetailPopup, callClaude } from "./shared.jsx";

const SENTIMENT_MOCK = [
  { theme: "US Tariff Escalation", ticker: "SPY", bullish: 22, bearish: 68, neutral: 10, articleCount: 847, weeklyArticles: [120,145,189,231,198,87,143], buzz: 94, buzzTrend: "+340%", topHeadline: "Tariff escalation triggers worst week for EM assets since 2018", sentiment: "Bearish", sentimentColor: "var(--red)", relatedTickers: ["SPY","EEM","DXY","GLD"] },
  { theme: "BOJ Normalization Risk", ticker: "FXY", bullish: 31, bearish: 55, neutral: 14, articleCount: 431, weeklyArticles: [40,55,72,89,102,87,112], buzz: 82, buzzTrend: "+210%", topHeadline: "BOJ yield curve control exit accelerates global rate repricing", sentiment: "Bearish", sentimentColor: "var(--red)", relatedTickers: ["FXY","EWJ","TLT","UUP"] },
  { theme: "Fed Policy Paralysis", ticker: "TLT", bullish: 38, bearish: 42, neutral: 20, articleCount: 612, weeklyArticles: [88,95,102,98,110,89,121], buzz: 71, buzzTrend: "+18%", topHeadline: "Fed caught between tariff inflation and slowing growth", sentiment: "Mixed", sentimentColor: "var(--yellow)", relatedTickers: ["TLT","SHY","UUP","SPY"] },
  { theme: "EM Currency Stress", ticker: "EEM", bullish: 15, bearish: 74, neutral: 11, articleCount: 338, weeklyArticles: [35,48,62,79,88,72,95], buzz: 68, buzzTrend: "+89%", topHeadline: "Peso, Lira, Real hit multi-year lows as dollar wrecking ball intensifies", sentiment: "Bearish", sentimentColor: "var(--red)", relatedTickers: ["EEM","EWZ","TUR","VWO"] },
  { theme: "China Property Stress", ticker: "FXI", bullish: 18, bearish: 48, neutral: 34, articleCount: 89, weeklyArticles: [78,65,55,42,38,22,14], buzz: 23, buzzTrend: "-67%", topHeadline: "Coverage drops sharply despite unresolved developer obligations", sentiment: "Suspicious Silence", sentimentColor: "var(--purple)", relatedTickers: ["FXI","KWEB","EWH","MCHI"] },
];

async function fetchAlphaVantage(ticker, avKey) {
  if (!avKey || avKey === "") return null;
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

export default function OverviewPanel({ apiKey, avKey, liveArticles = [], articles = [] }) {
  const allArticles = liveArticles || articles.filter(a => a.is_live) || [];
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [popupTheme, setPopupTheme] = useState(null);
  const [sentimentIdx, setSentimentIdx] = useState(0);
  const [sentimentLive, setSentimentLive] = useState(null);
  const [sentLoading, setSentLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const searchRef = useRef(null);

  const weekly = [
    { d: "Mon", v: 124 }, { d: "Tue", v: 189 }, { d: "Wed", v: 156 },
    { d: "Thu", v: 231 }, { d: "Fri", v: 198 }, { d: "Sat", v: 87 }, { d: "Sun", v: 143 },
  ];

  const handleSearch = (q) => {
    setSearchQ(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchResults(THEMES.filter(t =>
      t.name.toLowerCase().includes(q.toLowerCase()) ||
      t.tags?.some(tag => tag.toLowerCase().includes(q.toLowerCase())) ||
      t.description?.toLowerCase().includes(q.toLowerCase())
    ));
  };

  const loadSentiment = async (idx) => {
    setSentimentIdx(idx);
    setSentimentLive(null);
    if (avKey) {
      setSentLoading(true);
      const result = await fetchAlphaVantage(SENTIMENT_MOCK[idx].ticker, avKey);
      if (result) setSentimentLive({ ...SENTIMENT_MOCK[idx], ...result });
      setSentLoading(false);
    }
  };

  const askAI = async (q) => {
    const finalQ = q || query;
    if (!finalQ.trim()) return;
    setAiLoading(true); setAiResult("");
    try {
      const ctx = `You are a senior macro intelligence analyst. Active themes: ${THEMES.map(t => `${t.name} (heat ${t.heat}, ${t.status})`).join("; ")}. Answer concisely in 4-5 sentences. Be specific and actionable.`;
      const text = await callClaude(apiKey, ctx, finalQ);
      setAiResult(text);
    } catch (e) { setAiResult("Error: " + e.message); }
    setAiLoading(false);
  };

  const d = sentimentLive || SENTIMENT_MOCK[sentimentIdx];

  const EXAMPLE_QUERIES = [
    "What themes are heating up this week?",
    "Biggest tail risks right now?",
    "How does BOJ affect EM?",
    "Fed vs ECB divergence impact?",
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {popupTheme && <ThemeDetailPopup theme={popupTheme} onClose={() => setPopupTheme(null)} apiKey={apiKey} />}

      {/* Status Bar */}
      <div style={{ gridColumn: "1/-1" }} className="card">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {[["Active Themes", "8", "var(--amber)"], ["Live Articles", allArticles.length > 0 ? allArticles.length + " live" : "Loading...", "var(--cyan)"], ["🔴 Alerts", "3 active", "var(--red)"], ["Engine Status", "Operational ●", "var(--green)"]].map(([l, v, c]) => (
            <div key={l} style={{ background: "var(--bg1)", borderRadius: 6, padding: "14px 16px", borderLeft: `3px solid ${c}` }}>
              <div className="mono" style={{ color: "var(--tm)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{l}</div>
              <div className="mono" style={{ color: c, fontSize: 20, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Query — prominent */}
      <div className="card" style={{ gridColumn: "1/-1", border: "1px solid var(--borderlit)", background: "var(--card-bg)", borderRadius: 8, padding: "18px 20px" }}>
        <SectionTitle color="var(--amber)">Ask the Macro Intelligence Engine</SectionTitle>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && askAI()}
            placeholder="e.g. What are the biggest macro risks this week?"
            style={{ flex: 1, background: "var(--bg1)", border: "1px solid var(--borderlit)", borderRadius: 6, padding: "10px 14px", color: "var(--tp)", fontFamily: "'Space Mono',monospace", fontSize: 13 }} />
          <button onClick={() => askAI()} disabled={aiLoading}
            style={{ background: aiLoading ? "var(--bg3)" : "var(--amber)", color: "#000", border: "none", borderRadius: 6, padding: "10px 20px", cursor: aiLoading ? "not-allowed" : "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
            {aiLoading ? <><Spinner /> Analyzing...</> : "Ask →"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {EXAMPLE_QUERIES.map(ex => (
            <button key={ex} onClick={() => { setQuery(ex); askAI(ex); }}
              style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 10px", color: "var(--ts)", fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>{ex}</button>
          ))}
        </div>
        {aiResult && (
          <div className="fade-up" style={{ background: "var(--bg1)", borderRadius: 8, padding: "14px 16px", border: "1px solid var(--borderlit)" }}>
            <div className="mono" style={{ color: "var(--green)", fontSize: 10, marginBottom: 6 }}>AI RESPONSE</div>
            <p style={{ fontSize: 13, lineHeight: 1.8, color: "var(--tp)" }}>{aiResult}</p>
          </div>
        )}
      </div>

      {/* Hot Themes with Search */}
      <div className="card">
        <SectionTitle color="var(--red)">🔴 Hot Themes</SectionTitle>
        <div style={{ position: "relative", marginBottom: 12 }} ref={searchRef}>
          <input value={searchQ} onChange={e => handleSearch(e.target.value)}
            onFocus={() => setShowSearch(true)} onBlur={() => setTimeout(() => setShowSearch(false), 150)}
            placeholder="Search any theme..."
            style={{ width: "100%", background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px", color: "var(--tp)", fontFamily: "'Space Mono',monospace", fontSize: 12 }} />
          {showSearch && searchResults.length > 0 && (
            <div className="fade-up" style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--card-bg)", border: "1px solid var(--borderlit)", borderRadius: 8, zIndex: 100, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
              {searchResults.map(t => (
                <div key={t.id} onMouseDown={() => setPopupTheme(t)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span>{heatEmoji(t.heat)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tp)" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ts)" }}>Heat {t.heat} · {t.status}</div>
                  </div>
                  <Sparkline data={t.trend} color={heatColor(t.heat)} />
                </div>
              ))}
            </div>
          )}
          {showSearch && searchQ && searchResults.length === 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", color: "var(--ts)", fontSize: 12 }}>No themes found for "{searchQ}"</div>
          )}
        </div>
        {THEMES.filter(t => t.heat > 65).map(t => (
          <div key={t.id} onClick={() => setPopupTheme(t)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span style={{ fontSize: 16 }}>{heatEmoji(t.heat)}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: "var(--tp)" }}>{t.name}</div>
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

      {/* Article Velocity */}
      <div className="card">
        <SectionTitle color="var(--cyan)">Article Velocity — 7 Day</SectionTitle>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weekly} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="d" tick={{ fill: "var(--tm)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--tm)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--tp)", fontSize: 12 }} />
            <Bar dataKey="v" name="Articles" fill="var(--amber)" radius={[3, 3, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
        {/* Social Fear/Greed preview */}
        <div style={{ marginTop: 14, background: "var(--bg1)", borderRadius: 8, padding: "12px 14px", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="mono" style={{ fontSize: 10, color: "var(--tm)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Social Fear & Greed</span>
            <span style={{ fontSize: 10, color: "var(--ts)", fontFamily: "monospace" }}>Full detail in Social Pulse →</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
            <div style={{ flex: 1, height: 8, background: "var(--bg3)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${SOCIAL_DATA.fearGreed}%`, height: "100%", background: `linear-gradient(90deg, var(--red), var(--amber) 50%, var(--green))`, borderRadius: 4 }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="mono" style={{ color: "var(--red)", fontSize: 20, fontWeight: 700 }}>{SOCIAL_DATA.fearGreed}</div>
              <div style={{ color: "var(--ts)", fontSize: 10 }}>{SOCIAL_DATA.fearGreedLabel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alpha Vantage Sentiment */}
      <div style={{ gridColumn: "1/-1" }} className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <SectionTitle color="var(--purple)">Market News Sentiment & Buzz — Hot Topics</SectionTitle>
          {!avKey ? (
            <span style={{ fontSize: 11, color: "var(--tm)", fontFamily: "monospace", background: "var(--bg3)", padding: "3px 10px", borderRadius: 4, border: "1px solid var(--border)" }}>Add Alpha Vantage key for live data</span>
          ) : (
            <span style={{ fontSize: 11, color: "var(--green)", fontFamily: "monospace" }}>● Live via Alpha Vantage</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {SENTIMENT_MOCK.map((s, i) => {
            const theme = THEMES.find(t => t.name === s.theme);
            return (
              <button key={s.theme} onClick={() => loadSentiment(i)}
                style={{ background: sentimentIdx === i ? (theme?.color || "var(--amber)") : "var(--bg3)", color: sentimentIdx === i ? "#000" : "var(--ts)", border: `1px solid ${sentimentIdx === i ? "transparent" : "var(--border)"}`, borderRadius: 5, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontFamily: "monospace", fontWeight: sentimentIdx === i ? 700 : 400, transition: "all .15s" }}>
                {s.theme.split(" ").slice(0, 2).join(" ")}
              </button>
            );
          })}
        </div>
        {sentLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--purple)", fontFamily: "monospace", fontSize: 12 }}><Spinner /> Fetching live sentiment...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {/* Sentiment gauge */}
            <div style={{ background: "var(--bg1)", borderRadius: 8, padding: "16px" }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 10, textTransform: "uppercase" }}>Sentiment Score</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bg3)", border: `2px solid ${d.sentimentColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  {d.sentiment === "Bearish" ? "📉" : d.sentiment === "Bullish" ? "📈" : d.sentiment === "Suspicious Silence" ? "⚠️" : "〰️"}
                </div>
                <div>
                  <div style={{ color: d.sentimentColor, fontWeight: 700, fontSize: 16 }}>{d.sentiment}</div>
                  <div style={{ color: "var(--ts)", fontSize: 11 }}>{d.relatedTickers.join(" · ")}</div>
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--green)" }}>Bull {d.bullish}%</span>
                  <span style={{ fontSize: 11, color: "var(--ts)" }}>Neutral {d.neutral}%</span>
                  <span style={{ fontSize: 11, color: "var(--red)" }}>Bear {d.bearish}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, overflow: "hidden", display: "flex" }}>
                  <div style={{ width: `${d.bullish}%`, background: "var(--green)", transition: "width .5s" }} />
                  <div style={{ width: `${d.neutral}%`, background: "var(--amber)", opacity: 0.4 }} />
                  <div style={{ width: `${d.bearish}%`, background: "var(--red)", transition: "width .5s" }} />
                </div>
              </div>
              <div style={{ background: "var(--bg3)", borderRadius: 6, padding: "8px 10px", marginTop: 10 }}>
                <div className="mono" style={{ fontSize: 9, color: "var(--tm)", marginBottom: 4 }}>TOP HEADLINE</div>
                <p style={{ fontSize: 11, color: "var(--ts)", lineHeight: 1.5 }}>{d.topHeadline}</p>
              </div>
            </div>
            {/* Volume trend */}
            <div style={{ background: "var(--bg1)", borderRadius: 8, padding: "16px" }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 10, textTransform: "uppercase" }}>News Volume — 7 Day</div>
              <ResponsiveContainer width="100%" height={110}>
                <AreaChart data={d.weeklyArticles.map((v, i) => ({ d: ["M","T","W","T","F","S","S"][i], v }))} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                  <XAxis dataKey="d" tick={{ fill: "var(--tm)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--tm)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 }} />
                  <Area type="monotone" dataKey="v" stroke={d.sentimentColor} fill={d.sentimentColor} fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                {[["Total", d.articleCount, "var(--amber)"], ["vs Week", d.buzzTrend, d.buzzTrend.startsWith("+") ? "var(--red)" : "var(--cyan)"], ["Buzz", d.buzz, heatColor(d.buzz)]].map(([l, v, c]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div className="mono" style={{ color: c, fontSize: 16, fontWeight: 700 }}>{v}</div>
                    <div style={{ color: "var(--tm)", fontSize: 10 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Tickers */}
            <div style={{ background: "var(--bg1)", borderRadius: 8, padding: "16px" }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 10, textTransform: "uppercase" }}>Related Tickers</div>
              {d.relatedTickers.map((ticker, i) => {
                const scores = [92, 78, 65, 54];
                const cols = ["var(--red)", "var(--amber)", "var(--amber)", "var(--cyan)"];
                return (
                  <div key={ticker} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                    <span className="mono" style={{ color: cols[i], fontWeight: 700, fontSize: 13, minWidth: 42 }}>{ticker}</span>
                    <div style={{ flex: 1, height: 4, background: "var(--bg3)", borderRadius: 2 }}>
                      <div style={{ width: `${scores[i]}%`, height: "100%", background: cols[i], borderRadius: 2 }} />
                    </div>
                    <span className="mono" style={{ color: "var(--ts)", fontSize: 11 }}>{scores[i]}</span>
                  </div>
                );
              })}
              <div style={{ marginTop: 12 }}>
                <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 6 }}>SOCIAL BUZZ VELOCITY</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 36 }}>
                  {[12,18,24,31,38,42,d.buzz].map((v, i) => (
                    <div key={i} style={{ flex: 1, background: i === 6 ? d.sentimentColor : d.sentimentColor + "55", borderRadius: "2px 2px 0 0", height: `${(v/d.buzz)*100}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
