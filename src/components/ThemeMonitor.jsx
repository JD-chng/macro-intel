import { useState } from "react";
import { THEMES } from "../data/seed.js";
import { SectionTitle, Chip, Sparkline, Spinner, heatColor, heatEmoji, ThemeDetailPopup } from "./shared.jsx";

export default function ThemesPanel({ apiKey }) {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      {selected && <ThemeDetailPopup theme={selected} onClose={() => setSelected(null)} apiKey={apiKey} />}
      <div className="card">
        <SectionTitle>All Themes — Heat Monitor</SectionTitle>
        <p style={{ color: "var(--ts)", fontSize: 12, marginBottom: 16 }}>Click any theme for full detail view — heat history, risk tree, related articles, and AI analysis.</p>
        {THEMES.map(t => (
          <div key={t.id} onClick={() => setSelected(t)}
            style={{ background: "var(--bg1)", borderRadius: 8, padding: "14px 16px", marginBottom: 10, border: "1px solid var(--border)", cursor: "pointer", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = heatColor(t.heat).replace("var(","").replace(")","") === "--red" ? "#ff444466" : "#f0a50066"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ fontSize: 24, paddingTop: 2, flexShrink: 0 }}>{heatEmoji(t.heat)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "var(--tp)" }}>{t.name}</span>
                  <span style={{ background: t.color + "22", border: `1px solid ${t.color}55`, color: t.color, padding: "2px 8px", borderRadius: 3, fontSize: 11, fontFamily: "monospace" }}>{t.status}</span>
                  <span className="mono" style={{ color: t.heat > 50 ? "var(--red)" : "var(--cyan)", fontSize: 11, marginLeft: "auto" }}>{t.change}</span>
                </div>
                <p style={{ color: "var(--ts)", fontSize: 12, lineHeight: 1.55, marginBottom: 10 }}>{t.description}</p>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ flex: 1, height: 4, background: "var(--bg3)", borderRadius: 2 }}>
                    <div style={{ width: `${t.heat}%`, height: "100%", background: `linear-gradient(90deg,${t.color}88,${t.color})`, borderRadius: 2 }} />
                  </div>
                  <span className="mono" style={{ color: t.color, fontWeight: 700, fontSize: 16 }}>{t.heat}</span>
                  <span style={{ color: "var(--tm)", fontSize: 11 }}>{t.articles} articles</span>
                  <Sparkline data={t.trend} color={t.color} />
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
