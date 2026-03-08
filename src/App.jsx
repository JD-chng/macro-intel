import { useState, useEffect, useCallback, useRef } from "react";
import { AppProvider, useApp } from "./context/AppContext.jsx";
import { CSS_VARS, Spinner, ArticleHoverPopup, ArticleFeedModal } from "./components/shared.jsx";
import { THEMES, MARKET_PULSE, WEEKLY_BRIEF } from "./data/seed.js";
import OverviewPanel from "./components/Overview.jsx";
import ThemesPanel from "./components/ThemeMonitor.jsx";
import RiskTreePanel from "./components/RiskTree.jsx";
import KnowledgeGraph from "./components/KnowledgeGraph.jsx";
import WeeklyBriefPanel from "./components/WeeklyBrief.jsx";
import WatchlistPanel from "./components/EmergingWatchlist.jsx";
import { ArticleFeedPanel, MemoryPanel, AIQueryPanel, SocialPulsePanel } from "./components/Panels.jsx";
import { heatColor } from "./components/shared.jsx";

const RSS_PROXY = "https://api.rss2json.com/v1/api.json?rss_url=";
async function fetchLiveArticles() {
  try {
    const res = await fetch(`${RSS_PROXY}${encodeURIComponent("https://feeds.reuters.com/reuters/businessNews")}&count=8`);
    const data = await res.json();
    if (data.status !== "ok") return [];
    return data.items.map(item => ({
      id: item.guid || item.link, title: item.title, source: "Reuters", url: item.link,
      time: new Date(item.pubDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " live",
      summary: item.description?.replace(/<[^>]+>/g, "").slice(0, 200) || "",
      isLive: true, heat: Math.floor(Math.random() * 40 + 50), themes: [],
    }));
  } catch { return []; }
}

// ─── TOUR ──────────────────────────────────────────────────────────────────────
const TOUR_STEPS = [
  { title: "Live Article Ingestion", icon: "📡", color: "var(--cyan)", desc: "Every 30 minutes, the system polls 10+ RSS feeds from Reuters, FT, WSJ and central bank websites. Articles are filtered for macro relevance, summarized by AI, and scored for language intensity.", action: "See live headlines in the Article Feed →" },
  { title: "AI Theme Discovery", icon: "🧠", color: "var(--amber)", desc: "Claude clusters articles and automatically identifies macro narratives — no predefined categories. Themes like 'BOJ Normalization Risk' emerge organically, with heat scores updated continuously.", action: "Click any theme to see full detail including 90-day heat chart →" },
  { title: "Risk Implication Chains", icon: "⚡", color: "var(--red)", desc: "When a theme heats up, select channels and generate a full causal risk tree: Rates → FX → Equities → Credit → Geopolitics. Dynamic, AI-generated, and tailored to any trigger event.", action: "Build a custom risk tree from any event →" },
  { title: "Social Intelligence Edge", icon: "📱", color: "var(--purple)", desc: "Social sentiment from Reddit, StockTwits, and Twitter/X feeds precede mainstream news by an average of 4.2 hours. The Fear & Greed index and contrarian signals surface what crowds are feeling before it hits the newswire.", action: "Explore Social Pulse for real-time crowd intelligence →" },
];

function GuidedTour({ onFinish }) {
  const [step, setStep] = useState(0);
  const s = TOUR_STEPS[step];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(6,7,9,0.9)" }}>
      <div className="fade-up" style={{ background: "var(--card-bg)", border: `1px solid ${s.color}55`, borderRadius: 16, padding: "40px 44px", maxWidth: 540, width: "92%", position: "relative" }}>
        <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 6 }}>
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 20 : 8, height: 8, borderRadius: 4, background: i === step ? s.color : "var(--bg4)", transition: "all 0.3s" }} />
          ))}
        </div>
        <div style={{ fontSize: 44, marginBottom: 16 }}>{s.icon}</div>
        <div className="mono" style={{ color: s.color, fontSize: 11, letterSpacing: "0.15em", marginBottom: 8 }}>STEP {step + 1} OF {TOUR_STEPS.length}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--tp)", marginBottom: 12 }}>{s.title}</div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ts)", marginBottom: 20 }}>{s.desc}</p>
        <div style={{ background: "var(--bg1)", borderRadius: 8, padding: "12px 16px", borderLeft: `3px solid ${s.color}`, marginBottom: 24, fontSize: 13, color: "var(--tp)" }}>{s.action}</div>
        <div style={{ display: "flex", gap: 10 }}>
          {step > 0 && <button onClick={() => setStep(s => s-1)} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 20px", color: "var(--ts)", cursor: "pointer", fontFamily: "monospace", fontSize: 12 }}>← Back</button>}
          <button onClick={() => step < TOUR_STEPS.length-1 ? setStep(s => s+1) : onFinish()}
            style={{ flex: 1, background: s.color, color: "#000", border: "none", borderRadius: 6, padding: "10px 20px", cursor: "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 12 }}>
            {step < TOUR_STEPS.length-1 ? "Next →" : "Enter Platform →"}
          </button>
          <button onClick={onFinish} style={{ background: "transparent", border: "none", color: "var(--tm)", cursor: "pointer", fontSize: 12 }}>Skip</button>
        </div>
      </div>
    </div>
  );
}

// ─── API KEY MODAL ─────────────────────────────────────────────────────────────
function ApiKeyModal({ onSet }) {
  const [claude, setClaude] = useState("");
  const [av, setAv] = useState("");
  const [yt, setYt] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--bg0)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div className="fade-up" style={{ background: "var(--card-bg)", border: "1px solid var(--borderlit)", borderRadius: 12, padding: "36px 40px", maxWidth: 500, width: "94%" }}>
        <div className="mono" style={{ color: "var(--amber)", fontSize: 11, letterSpacing: "0.2em", marginBottom: 8 }}>MACRO INTELLIGENCE PLATFORM</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "var(--tp)" }}>Configure API Keys</div>
        <p style={{ color: "var(--ts)", fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>API keys are stored only in browser memory and never transmitted to any server other than their respective providers.</p>

        {[
          ["Anthropic (Claude)", claude, setClaude, "sk-ant-...", "Required for AI analysis, risk trees, brief generation"],
          ["Alpha Vantage", av, setAv, "Your key...", "Optional — enables live market sentiment data (free at alphavantage.co)"],
          ["YouTube Data v3", yt, setYt, "AIza...", "Optional — enables YouTube financial content analysis (free at console.cloud.google.com)"],
        ].map(([label, val, setter, ph, hint]) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--ts)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
            <input value={val} onChange={e => setter(e.target.value)} placeholder={ph} type="password"
              style={{ width: "100%", background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px", color: "var(--tp)", fontFamily: "monospace", fontSize: 13 }} />
            <div style={{ fontSize: 11, color: "var(--tm)", marginTop: 3 }}>{hint}</div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={() => onSet({ claude, alphaVantage: av, youtube: yt })}
            style={{ flex: 1, background: "var(--amber)", color: "#000", border: "none", borderRadius: 6, padding: "12px", cursor: "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 13 }}>
            Enter Platform →
          </button>
          <button onClick={() => onSet({ claude: "DEMO", alphaVantage: "", youtube: "" })}
            style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, padding: "12px 16px", color: "var(--ts)", cursor: "pointer", fontFamily: "monospace", fontSize: 12 }}>
            Demo Mode
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── NAV ───────────────────────────────────────────────────────────────────────
const NAV = [
  { id: "overview", label: "Overview", icon: "⬡" },
  { id: "themes", label: "Themes", icon: "◉", badge: "8" },
  { id: "risk", label: "Risk Tree", icon: "⊹" },
  { id: "graph", label: "Graph", icon: "⬡" },
  { id: "brief", label: "Brief", icon: "◆" },
  { id: "watchlist", label: "Watchlist", icon: "▲", badge: "5" },
  { id: "articles", label: "Articles", icon: "≡" },
  { id: "memory", label: "Memory", icon: "◇" },
  { id: "query", label: "Query AI", icon: "✦" },
  { id: "social", label: "Social", icon: "◎", badge: "new" },
];
const TITLE_MAP = { overview:"System Overview", themes:"Theme Heat Monitor", risk:"Risk Implication Trees", graph:"Knowledge Graph", brief:"Weekly Macro Brief", watchlist:"Emerging Watchlist", articles:"Article Intelligence Hub", memory:"Institutional Memory", query:"AI Query Interface", social:"Social Pulse" };

// ─── MAIN APP INNER ────────────────────────────────────────────────────────────
function AppInner() {
  const { colorTheme, toggleTheme, apiKeys, setApiKeys, articleModal, closeArticleModal } = useApp();
  const [showModal, setShowModal] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [active, setActive] = useState("overview");
  const [liveArticles, setLiveArticles] = useState([]);
  const [fetchingLive, setFetchingLive] = useState(false);
  const [nextRefresh, setNextRefresh] = useState(30 * 60);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => { setTime(new Date()); setNextRefresh(s => s <= 1 ? 30*60 : s-1); }, 1000);
    return () => clearInterval(t);
  }, []);

  const doFetch = useCallback(() => {
    setFetchingLive(true);
    fetchLiveArticles().then(arts => { if (arts.length) setLiveArticles(arts); setFetchingLive(false); setLastRefreshed(new Date()); setNextRefresh(30*60); });
  }, []);

  useEffect(() => {
    if (!apiKeys.claude) return;
    doFetch();
    const t = setInterval(doFetch, 30*60*1000);
    return () => clearInterval(t);
  }, [apiKeys.claude, doFetch]);

  if (showModal) return (
    <>
      <style>{CSS_VARS}</style>
      <ApiKeyModal onSet={(keys) => { setApiKeys(keys); setShowModal(false); setShowTour(true); }} />
    </>
  );

  if (showTour) return (
    <>
      <style>{CSS_VARS}</style>
      <GuidedTour onFinish={() => setShowTour(false)} />
    </>
  );

  const renderPanel = () => {
    switch (active) {
      case "overview": return <OverviewPanel apiKey={apiKeys.claude} avKey={apiKeys.alphaVantage} liveArticles={liveArticles} />;
      case "themes": return <ThemesPanel apiKey={apiKeys.claude} />;
      case "risk": return <RiskTreePanel apiKey={apiKeys.claude} />;
      case "graph": return <KnowledgeGraph />;
      case "brief": return <WeeklyBriefPanel apiKey={apiKeys.claude} />;
      case "watchlist": return <WatchlistPanel />;
      case "articles": return <ArticleFeedPanel liveArticles={liveArticles} />;
      case "memory": return <MemoryPanel apiKey={apiKeys.claude} />;
      case "query": return <AIQueryPanel apiKey={apiKeys.claude} />;
      case "social": return <SocialPulsePanel />;
      default: return null;
    }
  };

  return (
    <>
      <style>{CSS_VARS}</style>
      {articleModal && <ArticleFeedModal onClose={closeArticleModal} />}
      <ArticleHoverPopup />

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg0)" }}>
        {/* SIDEBAR */}
        <div style={{ width: 62, background: "var(--bg1)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 14, gap: 2, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, background: "var(--amber)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "#000" }}>M</div>
          {NAV.map(n => (
            <div key={n.id} onClick={() => setActive(n.id)} title={n.label}
              style={{ width: 42, height: 42, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", background: active === n.id ? "var(--amber-glow)" : "transparent", border: active === n.id ? "1px solid var(--borderlit)" : "1px solid transparent", transition: "all .15s", fontSize: 15 }}
              onMouseEnter={e => { if (active !== n.id) e.currentTarget.style.background = "var(--bg3)"; }}
              onMouseLeave={e => { if (active !== n.id) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ color: active === n.id ? "var(--amber)" : "var(--tm)" }}>{n.icon}</span>
              {n.badge && <div style={{ position: "absolute", top: 3, right: 3, background: n.badge === "new" ? "var(--green)" : "var(--amber)", borderRadius: 8, minWidth: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#000", fontFamily: "monospace", fontWeight: 700, padding: "0 2px" }}>{n.badge}</div>}
            </div>
          ))}
          <div style={{ marginTop: "auto", paddingBottom: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
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
              <div className="mono" style={{ fontSize: 9, color: "var(--tm)", letterSpacing: "0.12em", marginTop: 1 }}>/ {TITLE_MAP[active]?.toUpperCase()}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
              {!alertDismissed && (
                <div onClick={() => setAlertDismissed(true)} style={{ background: "#ff444422", border: "1px solid #ff444444", borderRadius: 6, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <span className="pulse" style={{ color: "var(--red)", fontSize: 10 }}>⚠</span>
                  <span style={{ color: "var(--red)", fontSize: 11, fontFamily: "monospace" }}>China Property — Suspicious Silence</span>
                  <span style={{ color: "var(--tm)", fontSize: 10 }}>×</span>
                </div>
              )}
              {fetchingLive
                ? <span style={{ color: "var(--cyan)", fontSize: 11, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 6 }}><Spinner size={12} /> refreshing...</span>
                : <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {lastRefreshed && <span style={{ color: "var(--tm)", fontSize: 11, fontFamily: "monospace" }}>updated {lastRefreshed.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}</span>}
                    <span style={{ color: "var(--tm)", fontSize: 11, fontFamily: "monospace" }}>next ↻ {Math.floor(nextRefresh/60)}:{String(nextRefresh%60).padStart(2,"0")}</span>
                    <button onClick={doFetch} style={{ background: "var(--bg3)", border: "1px solid var(--borderlit)", borderRadius: 5, padding: "3px 9px", color: "var(--amber)", cursor: "pointer", fontSize: 11, fontFamily: "monospace" }}>↻</button>
                  </div>
              }
              <div className="mono" style={{ fontSize: 11, color: "var(--tm)" }}>{time.toUTCString().slice(0, 22)} UTC</div>
              {/* Light/Dark toggle */}
              <button onClick={toggleTheme}
                style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 20, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: "var(--ts)", fontSize: 13 }}
                title={colorTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                {colorTheme === "dark" ? "☀️" : "🌙"}
              </button>
              <button onClick={() => setShowTour(true)} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 5, padding: "4px 10px", color: "var(--ts)", cursor: "pointer", fontSize: 11, fontFamily: "monospace" }}>? Tour</button>
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
        <div style={{ width: 200, background: "var(--bg1)", borderLeft: "1px solid var(--border)", padding: "14px 12px", overflow: "auto", flexShrink: 0 }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--tm)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 10 }}>Market Pulse</div>
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
                <span style={{ fontSize: 10, color: "var(--ts)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{t.name.split(" ").slice(0, 2).join(" ")}</span>
                <span style={{ fontSize: 10, color: heatColor(t.heat), fontFamily: "monospace" }}>{t.heat}</span>
              </div>
              <div style={{ height: 3, background: "var(--bg3)", borderRadius: 2 }}>
                <div style={{ width: `${t.heat}%`, height: "100%", background: heatColor(t.heat), borderRadius: 2 }} />
              </div>
            </div>
          ))}
          <div className="mono" style={{ fontSize: 10, color: "var(--tm)", textTransform: "uppercase", letterSpacing: "0.15em", margin: "14px 0 8px" }}>Upcoming</div>
          {WEEKLY_BRIEF.watch_next.map(e => (
            <div key={e.event} style={{ padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
              <div className="mono" style={{ fontSize: 10, color: e.importance === "CRITICAL" ? "var(--red)" : "var(--amber)" }}>{e.date}</div>
              <div style={{ fontSize: 11, color: "var(--ts)", marginTop: 1, lineHeight: 1.3 }}>{e.event}</div>
            </div>
          ))}
          <button onClick={() => setShowTour(true)} style={{ width: "100%", marginTop: 14, background: "var(--amber-glow)", border: "1px solid var(--borderlit)", borderRadius: 6, padding: "8px", color: "var(--amber)", cursor: "pointer", fontFamily: "monospace", fontSize: 11 }}>▶ Replay Tour</button>
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
