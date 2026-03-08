import { useState } from "react";
import { EMERGING } from "../data/seed.js";
import { SectionTitle, Chip, ArticleSourceLink } from "./shared.jsx";
import { ARTICLES } from "../data/seed.js";

const CONF_COLORS = { "Mention Velocity": "var(--red)", "Source Migration": "var(--amber)", "Graph Centrality": "var(--cyan)", "Policy Proximity": "var(--purple)" };

export default function WatchlistPanel() {
  const [sidePanelTheme, setSidePanelTheme] = useState(null);

  return (
    <div style={{ position: "relative" }}>
      {/* Side panel */}
      {sidePanelTheme && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(6,7,9,0.5)" }} onClick={() => setSidePanelTheme(null)} />
          <div className="slide-in" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 420, background: "var(--card-bg)", borderLeft: "1px solid var(--borderlit)", zIndex: 450, overflow: "auto", padding: "24px 24px" }}>
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

            {/* Why breaking out */}
            <div style={{ marginBottom: 20 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--amber)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Why It's Breaking Out</div>
              <div style={{ background: "var(--bg1)", borderRadius: 8, padding: "14px 16px", borderLeft: "3px solid var(--amber)" }}>
                <p style={{ color: "var(--ts)", fontSize: 13, lineHeight: 1.7 }}>{sidePanelTheme.whyBreakout}</p>
              </div>
            </div>

            {/* Confidence breakdown */}
            <div style={{ marginBottom: 20 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Confidence Score Breakdown</div>
              {Object.entries(sidePanelTheme.confBreakdown).map(([factor, score]) => (
                <div key={factor} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: CONF_COLORS[factor] || "var(--ts)" }} />
                      <span style={{ color: "var(--ts)", fontSize: 12 }}>{factor}</span>
                    </div>
                    <span className="mono" style={{ color: CONF_COLORS[factor] || "var(--ts)", fontSize: 12, fontWeight: 700 }}>{score}%</span>
                  </div>
                  <div style={{ height: 5, background: "var(--bg3)", borderRadius: 3 }}>
                    <div style={{ width: `${score}%`, height: "100%", background: CONF_COLORS[factor] || "var(--ts)", borderRadius: 3, transition: "width .5s" }} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--tm)", marginTop: 2 }}>
                    {factor === "Mention Velocity" && "Rate of acceleration in article/post count over 14 days"}
                    {factor === "Source Migration" && "Movement from niche blogs/Reddit to FT/WSJ/Bloomberg front pages"}
                    {factor === "Graph Centrality" && "Increase in connections to other active themes in knowledge graph"}
                    {factor === "Policy Proximity" && "Proximity to scheduled central bank meetings, data releases, or policy deadlines"}
                  </div>
                </div>
              ))}
            </div>

            {/* Signal */}
            <div style={{ marginBottom: 20 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Detection Signal</div>
              <div style={{ background: "var(--bg1)", borderRadius: 8, padding: "12px 14px" }}>
                <p style={{ color: "var(--ts)", fontSize: 12, lineHeight: 1.6 }}>
                  <span className="mono" style={{ color: "var(--cyan)" }}>SIGNAL: </span>{sidePanelTheme.signal}
                </p>
              </div>
            </div>

            {/* Drivers */}
            <div style={{ marginBottom: 20 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Key Drivers</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {sidePanelTheme.drivers.map(d => <Chip key={d} color="var(--amber)">{d}</Chip>)}
              </div>
            </div>

            {/* Supporting sources */}
            <div>
              <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Supporting Sources</div>
              {sidePanelTheme.sources.map((s, i) => (
                <div key={i} style={{ background: "var(--bg1)", borderRadius: 6, padding: "10px 12px", marginBottom: 6, border: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: "var(--tp)", marginBottom: 4, lineHeight: 1.4 }}>{s.title}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--amber)", fontSize: 11, fontFamily: "monospace" }}>{s.source}</span>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--cyan)", fontSize: 11, fontFamily: "monospace", textDecoration: "none" }}>Open ↗</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="card fade-up">
        <SectionTitle color="var(--purple)">Emerging Themes — AI Breakout Watchlist</SectionTitle>
        <p style={{ color: "var(--ts)", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>AI-predicted themes with high breakout probability in the next 30 days. Click any theme for full breakdown including why it's breaking out, supporting sources, and confidence score methodology.</p>
        {EMERGING.map((e, i) => (
          <div key={e.theme} onClick={() => setSidePanelTheme(e)}
            style={{ background: "var(--bg1)", borderRadius: 8, padding: "16px 18px", marginBottom: 12, border: "1px solid var(--border)", cursor: "pointer", position: "relative", overflow: "hidden", transition: "all .2s" }}
            onMouseEnter={el => { el.currentTarget.style.borderColor = "var(--purple)66"; el.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={el => { el.currentTarget.style.borderColor = "var(--border)"; el.currentTarget.style.transform = "translateY(0)"; }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg,var(--purple),var(--amber))` }} />
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
              {e.drivers.map(d => <Chip key={d}>{d}</Chip>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
