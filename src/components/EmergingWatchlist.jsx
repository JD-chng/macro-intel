import { useState, useEffect } from "react";
import { SectionTitle, Chip, Spinner, callClaude } from "./shared.jsx";
import { fetchEmergingThemes, saveEmergingThemes } from "../lib/supabase.js";

const CONF_COLORS = { "Mention Velocity": "var(--red)", "Source Migration": "var(--amber)", "Graph Centrality": "var(--cyan)", "Policy Proximity": "var(--purple)" };

export default function WatchlistPanel({ themes = [], articles = [] }) {
  const [sidePanelTheme, setSidePanelTheme] = useState(null);
  const [emerging, setEmerging] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [cachedAt, setCachedAt] = useState(null);
  const [loadingCache, setLoadingCache] = useState(true);

  // Load cached results from Supabase on mount
  useEffect(() => {
    fetchEmergingThemes().then(cached => {
      if (cached.length > 0) {
        const mapped = cached.map(r => ({
          theme: r.theme, prob: r.prob, conf: r.conf,
          signal: r.signal, whyBreakout: r.why_breakout,
          drivers: r.drivers || [], confBreakdown: r.conf_breakdown || {},
          sources: r.sources || [],
        }));
        setEmerging(mapped);
        setGenerated(true);
        setCachedAt(new Date(cached[0].generated_at));
      }
      setLoadingCache(false);
    }).catch(() => setLoadingCache(false));
  }, []);

  const generateEmerging = async () => {
    setLoading(true);
    try {
      const recentTitles = articles.slice(0, 30).map(a => `- ${a.title} (${a.source}, sentiment: ${a.sentiment || "neutral"})`).join("\n");
      const existingThemes = themes.map(t => t.name).join(", ");
      const result = await callClaude(
        "You are a macro intelligence analyst specializing in identifying emerging themes before they go mainstream. Respond ONLY with valid JSON array.",
        `Based on these recent macro headlines, identify 5 EMERGING themes that are NOT yet mainstream but show breakout signals.

Existing tracked themes: ${existingThemes}

Recent headlines:
${recentTitles}

Respond with ONLY a JSON array (no markdown, no explanation):
[{
  "theme": "Theme Name",
  "prob": 75,
  "conf": 68,
  "signal": "One sentence describing the early signal detected",
  "whyBreakout": "2-3 sentences explaining why this is about to break out",
  "drivers": ["driver1", "driver2", "driver3"],
  "confBreakdown": {"Mention Velocity": 80, "Source Migration": 60, "Graph Centrality": 55, "Policy Proximity": 70},
  "sources": [{"title": "headline", "source": "publication", "url": "#"}]
}]`,
        1200
      );
      const cleaned = result.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setEmerging(parsed);
      setGenerated(true);
      setCachedAt(new Date());
      await saveEmergingThemes(parsed, articles.length);
    } catch (e) {
      console.error("Emerging generation error:", e.message);
      setGenerated(true);
    }
    setLoading(false);
  };

  // Auto-generate only if no cache loaded and we have articles
  useEffect(() => {
    if (!loadingCache && !generated && !loading && articles.length > 5) {
      generateEmerging();
    }
  }, [loadingCache, articles.length]);

  return (
    <div style={{ position: "relative" }}>
      {sidePanelTheme && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(6,7,9,0.5)" }} onClick={() => setSidePanelTheme(null)} />
          <div className="slide-in" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 420, background: "var(--card-bg)", borderLeft: "1px solid var(--borderlit)", zIndex: 450, overflow: "auto", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div className="mono" style={{ color: "var(--amber)", fontSize: 11, letterSpacing: "0.15em" }}>BREAKOUT ANALYSIS</div>
              <button onClick={() => setSidePanelTheme(null)} style={{ background: "none", border: "none", color: "var(--tm)", cursor: "pointer", fontSize: 22 }}>×</button>
            </div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "var(--tp)", marginBottom: 6, lineHeight: 1.3 }}>{sidePanelTheme.theme}</div>
            <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
              <div style={{ textAlign: "center", background: "var(--bg1)", borderRadius: 8, padding: "12px 16px", flex: 1 }}>
                <div className="mono" style={{ fontSize: 24, fontWeight: 700, color: sidePanelTheme.prob > 70 ? "var(--red)" : "var(--amber)" }}>{sidePanelTheme.prob}%</div>
                <div style={{ color: "var(--ts)", fontSize: 11, marginTop: 2 }}>Breakout Prob.</div>
              </div>
              <div style={{ textAlign: "center", background: "var(--bg1)", borderRadius: 8, padding: "12px 16px", flex: 1 }}>
                <div className="mono" style={{ fontSize: 24, fontWeight: 700, color: "var(--cyan)" }}>{sidePanelTheme.conf}%</div>
                <div style={{ color: "var(--ts)", fontSize: 11, marginTop: 2 }}>Confidence</div>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--amber)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Why It's Breaking Out</div>
              <div style={{ background: "var(--bg1)", borderRadius: 8, padding: "14px 16px", borderLeft: "3px solid var(--amber)" }}>
                <p style={{ color: "var(--ts)", fontSize: 13, lineHeight: 1.7 }}>{sidePanelTheme.whyBreakout}</p>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Confidence Score Breakdown</div>
              {Object.entries(sidePanelTheme.confBreakdown || {}).map(([factor, score]) => (
                <div key={factor} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: CONF_COLORS[factor] || "var(--ts)" }} />
                      <span style={{ color: "var(--ts)", fontSize: 12 }}>{factor}</span>
                    </div>
                    <span className="mono" style={{ color: CONF_COLORS[factor] || "var(--ts)", fontSize: 12, fontWeight: 700 }}>{score}%</span>
                  </div>
                  <div style={{ height: 5, background: "var(--bg3)", borderRadius: 3 }}>
                    <div style={{ width: `${score}%`, height: "100%", background: CONF_COLORS[factor] || "var(--ts)", borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 20 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Detection Signal</div>
              <div style={{ background: "var(--bg1)", borderRadius: 8, padding: "12px 14px" }}>
                <p style={{ color: "var(--ts)", fontSize: 12, lineHeight: 1.6 }}><span className="mono" style={{ color: "var(--cyan)" }}>SIGNAL: </span>{sidePanelTheme.signal}</p>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Key Drivers</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(sidePanelTheme.drivers || []).map(d => <Chip key={d} color="var(--amber)">{d}</Chip>)}
              </div>
            </div>
            {(sidePanelTheme.sources || []).length > 0 && (
              <div>
                <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Supporting Sources</div>
                {sidePanelTheme.sources.map((s, i) => (
                  <div key={i} style={{ background: "var(--bg1)", borderRadius: 6, padding: "10px 12px", marginBottom: 6, border: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: "var(--tp)", marginBottom: 4 }}>{s.title}</div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--amber)", fontSize: 11, fontFamily: "monospace" }}>{s.source}</span>
                      {s.url && s.url !== "#" && <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--cyan)", fontSize: 11, fontFamily: "monospace", textDecoration: "none" }}>Open ↗</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="card fade-up">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <SectionTitle color="var(--purple)">Emerging Themes — AI Breakout Watchlist</SectionTitle>
            <p style={{ color: "var(--ts)", fontSize: 13, lineHeight: 1.5 }}>AI-predicted themes with high breakout probability. Discovered from {articles.length} live articles.</p>
          </div>
          <button onClick={generateEmerging} disabled={loading}
            style={{ background: "var(--purple)22", border: "1px solid var(--purple)55", color: "var(--purple)", borderRadius: 6, padding: "6px 14px", cursor: loading ? "not-allowed" : "pointer", fontFamily: "monospace", fontSize: 11, flexShrink: 0, marginLeft: 12 }}>
            {loading ? "Analyzing..." : "↻ Refresh"}
          </button>
        </div>
        {cachedAt && !loading && (
          <div style={{ marginBottom: 12, fontSize: 11, color: "var(--tm)", fontFamily: "monospace" }}>
            ✓ Cached · last generated {cachedAt.toLocaleString()}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--ts)" }}>
            <Spinner size={24} />
            <div style={{ marginTop: 12, fontFamily: "monospace", fontSize: 13 }}>AI analyzing {articles.length} articles for emerging signals...</div>
          </div>
        )}

        {!loading && emerging.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px", color: "var(--ts)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>▲</div>
            <div style={{ fontFamily: "monospace", fontSize: 13 }}>{articles.length < 5 ? "Waiting for articles to load..." : "Click Refresh to discover emerging themes"}</div>
          </div>
        )}

        {!loading && emerging.map((e, i) => (
          <div key={e.theme} onClick={() => setSidePanelTheme(e)}
            style={{ background: "var(--bg1)", borderRadius: 8, padding: "16px 18px", marginBottom: 12, border: "1px solid var(--border)", cursor: "pointer", position: "relative", overflow: "hidden", transition: "all .2s" }}
            onMouseEnter={el => { el.currentTarget.style.borderColor = "var(--purple)66"; el.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={el => { el.currentTarget.style.borderColor = "var(--border)"; el.currentTarget.style.transform = "translateY(0)"; }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "linear-gradient(180deg,var(--purple),var(--amber))" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10, flexWrap: "wrap" }}>
              <span className="mono" style={{ color: "var(--tm)", fontSize: 12 }}>#{i + 1}</span>
              <span style={{ fontWeight: 700, fontSize: 15, flex: 1, color: "var(--tp)" }}>{e.theme}</span>
              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ textAlign: "center" }}>
                  <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: e.prob > 70 ? "var(--red)" : "var(--amber)" }}>{e.prob}%</div>
                  <div className="mono" style={{ fontSize: 9, color: "var(--tm)" }}>BREAKOUT</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: "var(--cyan)" }}>{e.conf}%</div>
                  <div className="mono" style={{ fontSize: 9, color: "var(--tm)" }}>CONFIDENCE</div>
                </div>
              </div>
              <span style={{ color: "var(--tm)", fontSize: 18 }}>›</span>
            </div>
            <div style={{ height: 4, background: "var(--bg3)", borderRadius: 2, marginBottom: 10 }}>
              <div style={{ width: `${e.prob}%`, height: "100%", background: `linear-gradient(90deg,var(--purple),${e.prob > 70 ? "var(--red)" : "var(--amber)"})`, borderRadius: 2 }} />
            </div>
            <p style={{ color: "var(--ts)", fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>
              <span className="mono" style={{ color: "var(--amber)" }}>SIGNAL: </span>{e.signal}
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(e.drivers || []).map(d => <Chip key={d}>{d}</Chip>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
