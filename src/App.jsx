import { useState, useEffect, useCallback } from "react";
import { AppProvider, useApp } from "./context/AppContext.jsx";
import { CSS_VARS, Spinner, ArticleHoverPopup, ArticleFeedModal, heatColor } from "./components/shared.jsx";
import {
  fetchThemes, fetchArticles, fetchLatestSocialMetrics,
  fetchMarketPulse, subscribeToArticles, subscribeToThemes,
} from "./lib/supabase.js";

import OverviewPanel from "./components/Overview.jsx";
import ThemesPanel from "./components/ThemeMonitor.jsx";
import RiskTreePanel from "./components/RiskTree.jsx";
import KnowledgeGraph from "./components/KnowledgeGraph.jsx";
import WeeklyBriefPanel from "./components/WeeklyBrief.jsx";
import WatchlistPanel from "./components/EmergingWatchlist.jsx";
import { ArticleFeedPanel, MemoryPanel, AIQueryPanel, SocialPulsePanel } from "./components/Panels.jsx";

const TOUR_STEPS = [
  { title: "Live Article Ingestion", icon: "📡", color: "var(--cyan)", desc: "Every 30 minutes, the backend polls 10+ RSS feeds and NewsAPI. Articles are classified by Claude AI, scored for macro relevance, and stored in Supabase with real-time sync.", action: "See live headlines in the Article Feed →" },
  { title: "AI Theme Discovery", icon: "🧠", color: "var(--amber)", desc: "Claude clusters articles and identifies macro narratives. Heat scores update continuously based on coverage velocity and sentiment.", action: "Click any theme to see 90-day heat history and AI analysis →" },
  { title: "Alpha Vantage + YouTube", icon: "📊", color: "var(--purple)", desc: "Alpha Vantage powers live market sentiment per theme. YouTube surfaces the latest macro analysis videos across all tracked themes.", action: "See live sentiment in Overview and Social Pulse →" },
  { title: "Social Intelligence Edge", icon: "📱", color: "var(--red)", desc: "Reddit and StockTwits sentiment precede mainstream news by 4+ hours on average. The Fear & Greed index surfaces what crowds feel before it hits the wire.", action: "Explore Social Pulse for real-time crowd intelligence →" },
];

function GuidedTour({ onFinish }) {
  const [step, setStep] = useState(0);
  const s = TOUR_STEPS[step];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(6,7,9,0.9)" }}>
      <div className="fade-up" style={{ background: "var(--card-bg)", border: `1px solid ${s.color}55`, borderRadius: 16, padding: "40px 44px", maxWidth: 540, width: "92%", position: "relative" }}>
        <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 6 }}>
          {TOUR_STEPS.map((_, i) => <div key={i} style={{ width: i === step ? 20 : 8, height: 8, borderRadius: 4, background: i === step ? s.color : "var(--bg4)", transition: "all 0.3s" }} />)}
        </div>
        <div style={{ fontSize: 44, marginBottom: 16 }}>{s.icon}</div>
        <div className="mono" style={{ color: s.color, fontSize: 11, letterSpacing: "0.15em", marginBottom: 8 }}>STEP {step + 1} OF {TOUR_STEPS.length}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--tp)", marginBottom: 12 }}>{s.title}</div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ts)", marginBottom: 20 }}>{s.desc}</p>
        <div style={{ background: "var(--bg1)", borderRadius: 8, padding: "12px 16px", borderLeft: `3px solid ${s.color}`, marginBottom: 24, fontSize: 13, color: "var(--tp)" }}>{s.action}</div>
        <div style={{ display: "flex", gap: 10 }}>
          {step > 0 && <button onClick={() => setStep(s => s-1)} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 20px", color: "var(--ts)", cursor: "pointer", fontFamily: "monospace", fontSize: 12 }}>← Back</button>}
          <button onClick={() => step < TOUR_STEPS.length-1 ? setStep(s => s+1) : onFinish()} style={{ flex: 1, background: s.color, color: "#000", border: "none", borderRadius: 6, padding: "10px 20px", cursor: "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 12 }}>
            {step < TOUR_STEPS.length-1 ? "Next →" : "Enter Platform →"}
          </button>
          <button onClick={onFinish} style={{ background: "transparent", border: "none", color: "var(--tm)", cursor: "pointer", fontSize: 12 }}>Skip</button>
        </div>
      </div>
    </div>
  );
}

const NAV = [
  { id: "overview", label: "Overview", icon: "⬡" },
  { id: "themes", label: "Themes", icon: "◉" },
  { id: "risk", label: "Risk Tree", icon: "⊹" },
  { id: "graph", label: "Graph", icon: "⬡" },
  { id: "brief", label: "Brief", icon: "◆" },
  { id: "watchlist", label: "Watchlist", icon: "▲" },
  { id: "articles", label: "Articles", icon: "≡" },
  { id: "memory", label: "Memory", icon: "◇" },
  { id: "query", label: "Query AI", icon: "✦" },
  { id: "social", label: "Social", icon: "◎", badge: "new" },
];
const TITLE_MAP = { overview:"System Overview", themes:"Theme Heat Monitor", risk:"Risk Implication Trees", graph:"Knowledge Graph", brief:"Weekly Macro Brief", watchlist:"Emerging Watchlist", articles:"Article Intelligence Hub", memory:"Institutional Memory", query:"AI Query Interface", social:"Social Pulse" };

function AppInner() {
  const { colorTheme, toggleTheme, apiKeys, setApiKeys, articleModal, closeArticleModal } = useApp();
  const [showTour, setShowTour] = useState(false);
  const [active, setActive] = useState("overview");
  const [time, setTime] = useState(new Date());
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [themes, setThemes] = useState([]);
  const [articles, setArticles] = useState([]);
  const [marketPulse, setMarketPulse] = useState([]);
  const [socialMetrics, setSocialMetrics] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [nextRefresh, setNextRefresh] = useState(30 * 60);

  // Auto-load API keys from environment variables — no modal needed
  useEffect(() => {
    setApiKeys({
      claude: import.meta.env.VITE_ANTHROPIC_KEY || "",
      alphaVantage: import.meta.env.VITE_AV_KEY || "",
      youtube: import.meta.env.VITE_YT_KEY || "",
    });
  }, []);

  useEffect(() => { const t = setInterval(() => { setTime(new Date()); setNextRefresh(s => s <= 1 ? 30*60 : s-1); }, 1000); return () => clearInterval(t); }, []);

  const loadData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [t, a, mp, sm] = await Promise.all([fetchThemes(), fetchArticles({ limit: 50 }), fetchMarketPulse(), fetchLatestSocialMetrics()]);
      if (t.length) setThemes(t);
      if (a.length) setArticles(a);
      if (mp.length) setMarketPulse(mp);
      if (sm) setSocialMetrics(sm);
      setLastRefreshed(new Date());
      setNextRefresh(30 * 60);
    } catch (e) { console.error("Data load error:", e.message); }
    setDataLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const articleSub = subscribeToArticles(a => setArticles(prev => [a, ...prev].slice(0, 100)));
    const themeSub = subscribeToThemes(() => fetchThemes().then(t => { if (t.length) setThemes(t); }));
    const interval = setInterval(loadData, 30 * 60 * 1000);
    return () => { articleSub.unsubscribe(); themeSub.unsubscribe(); clearInterval(interval); };
  }, [loadData]);

  if (showTour) return (<><style>{CSS_VARS}</style><GuidedTour onFinish={() => setShowTour(false)} /></>);

  const suspiciousSilence = themes.find(t => t.status?.includes("Suspicious Silence"));
  const props = { apiKey: apiKeys.claude, avKey: apiKeys.alphaVantage, ytKey: apiKeys.youtube, themes, articles, marketPulse, socialMetrics, onRefresh: loadData };

  const renderPanel = () => {
    switch (active) {
      case "overview":  return <OverviewPanel {...props} />;
      case "themes":    return <ThemesPanel {...props} />;
      case "risk":      return <RiskTreePanel {...props} />;
      case "graph":     return <KnowledgeGraph {...props} />;
      case "brief":     return <WeeklyBriefPanel {...props} />;
      case "watchlist": return <WatchlistPanel {...props} />;
      case "articles":  return <ArticleFeedPanel {...props} liveArticles={articles.filter(a => a.is_live)} />;
      case "memory":    return <MemoryPanel {...props} />;
      case "query":     return <AIQueryPanel {...props} />;
      case "social":    return <SocialPulsePanel {...props} />;
      default: return null;
    }
  };

  return (
    <>
      <style>{CSS_VARS}</style>
      {articleModal && <ArticleFeedModal onClose={closeArticleModal} />}
      <ArticleHoverPopup />
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg0)" }}>
        <div style={{ width: 62, background: "var(--bg1)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 14, gap: 2, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, background: "var(--amber)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "#000" }}>M</div>
          {NAV.map(n => (
            <div key={n.id} onClick={() => setActive(n.id)} title={n.label}
              style={{ width: 42, height: 42, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", background: active === n.id ? "var(--amber-glow)" : "transparent", border: active === n.id ? "1px solid var(--borderlit)" : "1px solid transparent", transition: "all .15s", fontSize: 15 }}
              onMouseEnter={e => { if (active !== n.id) e.currentTarget.style.background = "var(--bg3)"; }}
              onMouseLeave={e => { if (active !== n.id) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ color: active === n.id ? "var(--amber)" : "var(--tm)" }}>{n.icon}</span>
              {n.badge && <div style={{ position: "absolute", top: 3, right: 3, background: "var(--green)", borderRadius: 8, minWidth: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#000", fontFamily: "monospace", fontWeight: 700, padding: "0 2px" }}>{n.badge}</div>}
            </div>
          ))}
          <div style={{ marginTop: "auto", paddingBottom: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div className={dataLoading ? "pulse" : ""} style={{ width: 7, height: 7, borderRadius: "50%", background: dataLoading ? "var(--amber)" : "var(--green)" }} />
            <span className="mono" style={{ fontSize: 8, color: "var(--tm)", writingMode: "vertical-rl", textTransform: "uppercase", letterSpacing: "0.1em" }}>{dataLoading ? "SYNC" : "LIVE"}</span>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <div style={{ height: 50, background: "var(--bg1)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 18px", gap: 14, flexShrink: 0 }}>
            <div>
              <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--tp)", letterSpacing: "0.05em" }}>MACRO INTELLIGENCE</div>
              <div className="mono" style={{ fontSize: 9, color: "var(--tm)", letterSpacing: "0.12em", marginTop: 1 }}>/ {TITLE_MAP[active]?.toUpperCase()}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
              {!alertDismissed && suspiciousSilence && (
                <div onClick={() => setAlertDismissed(true)} style={{ background: "#ff444422", border: "1px solid #ff444444", borderRadius: 6, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <span className="pulse" style={{ color: "var(--red)", fontSize: 10 }}>⚠</span>
                  <span style={{ color: "var(--red)", fontSize: 11, fontFamily: "monospace" }}>{suspiciousSilence.name} — Suspicious Silence</span>
                  <span style={{ color: "var(--tm)", fontSize: 10 }}>×</span>
                </div>
              )}
              {dataLoading
                ? <span style={{ color: "var(--amber)", fontSize: 11, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 6 }}><Spinner size={12} /> syncing...</span>
                : <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {lastRefreshed && <span style={{ color: "var(--tm)", fontSize: 11, fontFamily: "monospace" }}>updated {lastRefreshed.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}</span>}
                    <span style={{ color: "var(--tm)", fontSize: 11, fontFamily: "monospace" }}>↻ {Math.floor(nextRefresh/60)}:{String(nextRefresh%60).padStart(2,"0")}</span>
                    <button onClick={loadData} style={{ background: "var(--bg3)", border: "1px solid var(--borderlit)", borderRadius: 5, padding: "3px 9px", color: "var(--amber)", cursor: "pointer", fontSize: 11, fontFamily: "monospace" }}>↻</button>
                  </div>
              }
              <div className="mono" style={{ fontSize: 11, color: "var(--tm)" }}>{time.toUTCString().slice(0, 22)} UTC</div>
              <button onClick={toggleTheme} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 20, padding: "4px 8px", cursor: "pointer", fontSize: 13 }} title="Toggle theme">
                {colorTheme === "dark" ? "☀️" : "🌙"}
              </button>
              <button onClick={() => setShowTour(true)} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 5, padding: "4px 10px", color: "var(--ts)", cursor: "pointer", fontSize: 11, fontFamily: "monospace" }}>? Tour</button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "18px 22px" }} key={active}>
            <div className="fade-up" style={{ maxWidth: 1200, margin: "0 auto" }}>
              {dataLoading && !themes.length
                ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, gap: 16 }}>
                    <Spinner size={32} />
                    <div className="mono" style={{ color: "var(--ts)", fontSize: 13 }}>Loading live data from Supabase...</div>
                  </div>
                : renderPanel()
              }
            </div>
          </div>
        </div>

        <div style={{ width: 200, background: "var(--bg1)", borderLeft: "1px solid var(--border)", padding: "14px 12px", overflow: "auto", flexShrink: 0 }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--tm)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 10 }}>Market Pulse</div>
          {marketPulse.length
            ? marketPulse.map(m => (
                <div key={m.name} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--ts)" }}>{m.name}</span>
                  <span className="mono" style={{ fontSize: 11, color: m.direction === "up" ? "var(--green)" : "var(--red)", fontWeight: 700 }}>{m.value}</span>
                </div>
              ))
            : <div style={{ color: "var(--tm)", fontSize: 11, fontFamily: "monospace" }}>Loading...</div>
          }
          <div className="mono" style={{ fontSize: 10, color: "var(--tm)", textTransform: "uppercase", letterSpacing: "0.15em", margin: "14px 0 8px" }}>Theme Heat</div>
          {themes.slice(0, 6).map(t => (
            <div key={t.id} style={{ marginBottom: 7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 10, color: "var(--ts)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{t.name?.split(" ").slice(0, 2).join(" ")}</span>
                <span style={{ fontSize: 10, color: heatColor(t.heat || 0), fontFamily: "monospace" }}>{t.heat}</span>
              </div>
              <div style={{ height: 3, background: "var(--bg3)", borderRadius: 2 }}>
                <div style={{ width: `${t.heat || 0}%`, height: "100%", background: heatColor(t.heat || 0), borderRadius: 2 }} />
              </div>
            </div>
          ))}
          <div className="mono" style={{ fontSize: 10, color: "var(--tm)", textTransform: "uppercase", letterSpacing: "0.15em", margin: "14px 0 4px" }}>Articles in DB</div>
          <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--cyan)" }}>{articles.length}</div>
          <button onClick={() => setShowTour(true)} style={{ width: "100%", marginTop: 14, background: "var(--amber-glow)", border: "1px solid var(--borderlit)", borderRadius: 6, padding: "8px", color: "var(--amber)", cursor: "pointer", fontFamily: "monospace", fontSize: 11 }}>▶ Replay Tour</button>
        </div>
      </div>
    </>
  );
}

export default function App() {
  return <AppProvider><AppInner /></AppProvider>;
}
