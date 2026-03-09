import { useState } from "react";
import { SectionTitle, Chip, Sparkline, Spinner, heatColor, heatEmoji, ThemeDetailPopup } from "./shared.jsx";

export default function ThemesPanel({ themes = [], articles = [] }) {
  const [selected, setSelected] = useState(null);

  const enrichedThemes = themes.map(t => ({
    ...t,
    trend: t.heat_history?.map(h => h.score) || [t.heat],
    articles: t.article_count || articles.filter(a => a.themes?.includes(t.name)).length || 0,
    tags: t.tags || [],
    countries: t.countries || [],
    color: t.color || heatColor(t.heat || 50),
    change: t.change_pct || "0%",
  }));

  return (
    <div>
      {selected && <ThemeDetailPopup theme={selected} onClose={() => setSelected(null)} articles={articles} />}
      <div className="card">
        <SectionTitle>All Themes — Heat Monitor</SectionTitle>
        <p style={{ color: "var(--ts)", fontSize: 12, marginBottom: 16 }}>
          Click any theme for full detail view — heat history, risk tree, related articles, and AI analysis.
          {themes.length === 0 && <span style={{ color: "var(--amber)", marginLeft: 8 }}>⟳ Waiting for ingestion cycle...</span>}
        </p>
        {enrichedThemes.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--ts)" }}>
            <Spinner size={24} />
            <div style={{ marginTop: 12, fontSize: 13, fontFamily: "monospace" }}>No themes yet — backend ingestion will populate this shortly</div>
          </div>
        )}
        {enrichedThemes.map(t => (
          <div key={t.id || t.name} onClick={() => setSelected(t)}
            style={{ background: "var(--bg1)", borderRadius: 8, padding: "14px 16px", marginBottom: 10, border: "1px solid var(--border)", cursor: "pointer", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = (t.color || "#f0a500") + "66"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ fontSize: 24, paddingTop: 2, flexShrink: 0 }}>{heatEmoji(t.heat || 0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "var(--tp)" }}>{t.name}</span>
                  <span style={{ background: (t.color || "#f0a500") + "22", border: `1px solid ${t.color || "#f0a500"}55`, color: t.color || "#f0a500", padding: "2px 8px", borderRadius: 3, fontSize: 11, fontFamily: "monospace" }}>{t.status || "Active"}</span>
                  <span className="mono" style={{ color: (t.heat || 0) > 50 ? "var(--red)" : "var(--cyan)", fontSize: 11, marginLeft: "auto" }}>{t.change}</span>
                </div>
                <p style={{ color: "var(--ts)", fontSize: 12, lineHeight: 1.55, marginBottom: 10 }}>{t.description || "AI-discovered theme from live article analysis."}</p>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ flex: 1, height: 4, background: "var(--bg3)", borderRadius: 2 }}>
                    <div style={{ width: `${t.heat || 0}%`, height: "100%", background: `linear-gradient(90deg,${t.color || "#f0a500"}88,${t.color || "#f0a500"})`, borderRadius: 2 }} />
                  </div>
                  <span className="mono" style={{ color: t.color || "#f0a500", fontWeight: 700, fontSize: 16 }}>{t.heat || 0}</span>
                  <span style={{ color: "var(--tm)", fontSize: 11 }}>{t.articles} articles</span>
                  {t.trend?.length > 1 && <Sparkline data={t.trend} color={t.color || "#f0a500"} />}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  {t.tags?.slice(0, 4).map(tg => <Chip key={tg}>{tg}</Chip>)}
                  {t.countries?.slice(0, 3).map(c => <Chip key={c} color="var(--cyan)">{c}</Chip>)}
                </div>
              </div>
              <div style={{ color: "var(--tm)", fontSize: 18, paddingTop: 2, flexShrink: 0 }}>›</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
