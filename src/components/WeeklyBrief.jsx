import { useState } from "react";
import { THEMES, WEEKLY_BRIEF } from "../data/seed.js";
import { SectionTitle, Chip, Spinner, MarkdownText, callClaude, ThemeDetailPopup, heatColor, heatEmoji } from "./shared.jsx";
import { useApp } from "../context/AppContext.jsx";

export default function WeeklyBriefPanel({ apiKey }) {
  const { briefCache, saveBriefCache } = useApp();
  const [loading, setLoading] = useState(false);
  const [themePopup, setThemePopup] = useState(null);

  const generate = async () => {
    setLoading(true);
    try {
      const text = await callClaude(apiKey,
        "You are the chief macro strategist at a $50bn asset manager. Write a concise, high-signal weekly macro brief in markdown format. Use ## for section headers, - for bullet points, **bold** for key terms. Be specific, quantitative, and forward-looking. Include: Executive Summary, Top 3 Theme Developments, Key Risks This Week, Positioning Implications.",
        `Generate a weekly macro brief for ${WEEKLY_BRIEF.week}.\n\nActive themes:\n${THEMES.map(t => `- ${t.name}: Heat ${t.heat}/100, Status: ${t.status}, Coverage: ${t.change}`).join('\n')}\n\nKey data releases this week: US CPI, Fed Powell Speech, BOJ Minutes, China Trade Balance.\n\nWrite in markdown format with clear sections.`,
        1200
      );
      saveBriefCache(text);
    } catch (e) { saveBriefCache(`**Error generating brief:** ${e.message}`); }
    setLoading(false);
  };

  const briefAge = briefCache ? Math.round((Date.now() - briefCache.timestamp) / 60000) : null;

  const findTheme = (name) => THEMES.find(t => t.name === name);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {themePopup && <ThemeDetailPopup theme={themePopup} onClose={() => setThemePopup(null)} apiKey={apiKey} />}

      {/* Header */}
      <div className="card" style={{ gridColumn: "1/-1", border: "1px solid var(--amber-dim)", background: "var(--card-bg)", borderRadius: 8, padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="mono" style={{ color: "var(--amber)", fontSize: 11, letterSpacing: "0.2em" }}>MACRO INTELLIGENCE BRIEF</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: "var(--tp)" }}>{WEEKLY_BRIEF.week}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {briefAge !== null && (
              <span style={{ color: "var(--ts)", fontSize: 11, fontFamily: "monospace" }}>
                Cached {briefAge < 60 ? `${briefAge}m` : `${Math.round(briefAge/60)}h`} ago · refreshes in {Math.max(0, Math.round((24*60 - briefAge)))}m
              </span>
            )}
            <button onClick={generate} disabled={loading}
              style={{ background: loading ? "var(--bg3)" : "var(--amber)", color: "#000", border: "none", borderRadius: 6, padding: "10px 18px", cursor: loading ? "not-allowed" : "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
              {loading ? <><Spinner /> Generating...</> : briefCache ? "↻ Regenerate" : "↻ Generate Brief"}
            </button>
          </div>
        </div>
      </div>

      {/* AI Generated Brief */}
      {briefCache && (
        <div className="card fade-up" style={{ gridColumn: "1/-1", border: "1px solid var(--cyan)33", background: "var(--card-bg)", borderRadius: 8, padding: "20px 24px" }}>
          <SectionTitle color="var(--cyan)">AI Macro Intelligence Brief</SectionTitle>
          <MarkdownText text={briefCache.content} />
        </div>
      )}

      {/* Top Themes */}
      <div className="card">
        <SectionTitle>Top Themes This Week</SectionTitle>
        {WEEKLY_BRIEF.top_themes.map(t => {
          const theme = findTheme(t.name);
          return (
            <div key={t.name} onClick={() => theme && setThemePopup(theme)}
              style={{ background: "var(--bg1)", borderRadius: 6, padding: "10px 14px", marginBottom: 8, borderLeft: "3px solid var(--amber)", cursor: theme ? "pointer" : "default", transition: "background .15s" }}
              onMouseEnter={e => { if (theme) e.currentTarget.style.background = "var(--bg3)"; }}
              onMouseLeave={e => e.currentTarget.style.background = "var(--bg1)"}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: "var(--tp)" }}>{t.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12 }}>{t.status}</span>
                  {theme && <span style={{ color: "var(--tm)", fontSize: 12 }}>›</span>}
                </div>
              </div>
              <p style={{ color: "var(--ts)", fontSize: 12, lineHeight: 1.5 }}>{t.note}</p>
            </div>
          );
        })}
      </div>

      {/* Key Risks */}
      <div className="card">
        <SectionTitle color="var(--red)">Key Risks — Cross-Theme Synthesis</SectionTitle>
        {WEEKLY_BRIEF.key_risks.map((r, i) => (
          <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <span style={{ color: r.severity === "CRITICAL" ? "var(--red)" : r.severity === "HIGH" ? "var(--amber)" : "var(--cyan)", fontSize: 11, fontFamily: "monospace", minWidth: 55, flexShrink: 0 }}>{r.severity}</span>
              <span style={{ color: "var(--ts)", fontSize: 13, lineHeight: 1.5 }}>{r.risk}</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingLeft: 63 }}>
              {r.themes.map(th => {
                const theme = findTheme(th);
                return (
                  <span key={th} onClick={() => theme && setThemePopup(theme)}
                    style={{ background: "var(--bg3)", border: "1px solid var(--amber)44", color: "var(--amber)", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontFamily: "monospace", cursor: theme ? "pointer" : "default" }}>
                    {th}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Watch Next Week */}
      <div style={{ gridColumn: "1/-1" }} className="card">
        <SectionTitle color="var(--cyan)">Watch Next Week — Event Calendar</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
          {WEEKLY_BRIEF.watch_next.map(e => (
            <div key={e.event} style={{ background: "var(--bg1)", borderRadius: 8, padding: "12px 14px", border: `1px solid ${e.importance === "CRITICAL" ? "var(--red)44" : e.importance === "HIGH" ? "var(--amber)44" : "var(--border)"}` }}>
              <div style={{ display: "flex", justify: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--tp)", marginBottom: 3 }}>{e.event}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span className="mono" style={{ color: "var(--ts)", fontSize: 11 }}>{e.date}</span>
                    <span style={{ fontSize: 11, color: e.importance === "CRITICAL" ? "var(--red)" : e.importance === "HIGH" ? "var(--amber)" : "var(--cyan)", fontFamily: "monospace", fontWeight: 700 }}>{e.importance}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {e.themes.map(th => {
                  const theme = findTheme(th);
                  return (
                    <span key={th} onClick={() => theme && setThemePopup(theme)}
                      style={{ background: "var(--amber-glow)", border: "1px solid var(--borderlit)", color: "var(--amber)", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontFamily: "monospace", cursor: theme ? "pointer" : "default" }}>
                      {th}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
