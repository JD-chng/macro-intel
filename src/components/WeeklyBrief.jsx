import { useState } from "react";
import { SectionTitle, Chip, Spinner, MarkdownText, callClaude, ThemeDetailPopup, heatColor } from "./shared.jsx";
import { useApp } from "../context/AppContext.jsx";

export default function WeeklyBriefPanel({ themes = [], articles = [] }) {
  const { briefCache, saveBriefCache } = useApp();
  const [loading, setLoading] = useState(false);
  const [themePopup, setThemePopup] = useState(null);

  const weekStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const generate = async () => {
    setLoading(true);
    try {
      const topThemes = [...themes].sort((a, b) => (b.heat || 0) - (a.heat || 0)).slice(0, 8);
      const recentArticles = articles.slice(0, 15).map(a => `- ${a.title} (${a.source})`).join("\n");
      const themeCtx = topThemes.map(t => `- ${t.name}: Heat ${t.heat}/100, Status: ${t.status || "Active"}, Change: ${t.change_pct || "0%"}`).join("\n");

      const text = await callClaude(
        "You are the chief macro strategist at a $50bn asset manager. Write a concise, high-signal weekly macro brief in markdown format. Use ## for section headers, - for bullet points, **bold** for key terms. Be specific, quantitative, and forward-looking.",
        `Generate a weekly macro brief for the week of ${weekStr}.\n\nLIVE THEME DATA (from real-time article analysis):\n${themeCtx || "No themes yet — base brief on general macro conditions."}\n\nRECENT HEADLINES:\n${recentArticles || "No headlines yet."}\n\nInclude: ## Executive Summary, ## Top Theme Developments, ## Key Risks This Week, ## Positioning Implications, ## Watch Next Week`,
        1400
      );
      saveBriefCache(text);
    } catch (e) { saveBriefCache(`**Error generating brief:** ${e.message}`); }
    setLoading(false);
  };

  const briefAge = briefCache ? Math.round((Date.now() - briefCache.timestamp) / 60000) : null;
  const findTheme = (name) => themes.find(t => t.name === name);
  const topThemes = [...themes].sort((a, b) => (b.heat || 0) - (a.heat || 0)).slice(0, 5);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {themePopup && <ThemeDetailPopup theme={themePopup} onClose={() => setThemePopup(null)} articles={articles} />}

      {/* Header */}
      <div className="card" style={{ gridColumn: "1/-1", border: "1px solid var(--amber-dim)", borderRadius: 8, padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="mono" style={{ color: "var(--amber)", fontSize: 11, letterSpacing: "0.2em" }}>MACRO INTELLIGENCE BRIEF</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: "var(--tp)" }}>Week of {weekStr}</div>
            <div style={{ fontSize: 12, color: "var(--ts)", marginTop: 4 }}>Based on {articles.length} live articles · {themes.length} active themes</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {briefAge !== null && (
              <span style={{ color: "var(--ts)", fontSize: 11, fontFamily: "monospace" }}>
                Cached {briefAge < 60 ? `${briefAge}m` : `${Math.round(briefAge/60)}h`} ago
              </span>
            )}
            <button onClick={generate} disabled={loading}
              style={{ background: loading ? "var(--bg3)" : "var(--amber)", color: "#000", border: "none", borderRadius: 6, padding: "10px 18px", cursor: loading ? "not-allowed" : "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
              {loading ? <><Spinner /> Generating...</> : briefCache ? "↻ Regenerate" : "↻ Generate Brief"}
            </button>
          </div>
        </div>
      </div>

      {/* AI Brief */}
      {briefCache && (
        <div className="card fade-up" style={{ gridColumn: "1/-1", border: "1px solid var(--cyan)33", borderRadius: 8, padding: "20px 24px" }}>
          <SectionTitle color="var(--cyan)">AI Macro Intelligence Brief</SectionTitle>
          <MarkdownText text={briefCache.content} />
        </div>
      )}

      {!briefCache && (
        <div className="card" style={{ gridColumn: "1/-1", textAlign: "center", padding: "32px", color: "var(--ts)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◆</div>
          <div style={{ fontFamily: "monospace", fontSize: 13 }}>Click "Generate Brief" to create an AI-powered weekly brief using {articles.length} live articles and {themes.length} active themes as context.</div>
        </div>
      )}

      {/* Top Themes */}
      <div className="card">
        <SectionTitle>Top Themes This Week</SectionTitle>
        {topThemes.length === 0 && <div style={{ color: "var(--ts)", fontSize: 12 }}>Loading live themes...</div>}
        {topThemes.map(t => (
          <div key={t.name} onClick={() => setThemePopup(t)}
            style={{ background: "var(--bg1)", borderRadius: 6, padding: "10px 14px", marginBottom: 8, borderLeft: `3px solid ${heatColor(t.heat || 0)}`, cursor: "pointer", transition: "background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--bg1)"}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: "var(--tp)" }}>{t.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="mono" style={{ color: heatColor(t.heat || 0), fontSize: 12, fontWeight: 700 }}>{t.heat}</span>
                <span style={{ color: "var(--tm)", fontSize: 12 }}>›</span>
              </div>
            </div>
            <p style={{ color: "var(--ts)", fontSize: 12, lineHeight: 1.5 }}>{t.description || t.status || "Active theme"}</p>
          </div>
        ))}
      </div>

      {/* Live article headlines */}
      <div className="card">
        <SectionTitle color="var(--cyan)">Recent Headlines</SectionTitle>
        {articles.length === 0 && <div style={{ color: "var(--ts)", fontSize: 12 }}>Loading live articles...</div>}
        {articles.slice(0, 6).map((a, i) => (
          <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
            <a href={a.url} target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--tp)", fontSize: 12, lineHeight: 1.4, textDecoration: "none", display: "block" }}
              onMouseEnter={e => e.target.style.color = "var(--amber)"}
              onMouseLeave={e => e.target.style.color = "var(--tp)"}>
              {a.title}
            </a>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <span style={{ color: "var(--amber)", fontSize: 10, fontFamily: "monospace" }}>{a.source}</span>
              <span style={{ color: "var(--tm)", fontSize: 10, fontFamily: "monospace" }}>{a.sentiment}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
