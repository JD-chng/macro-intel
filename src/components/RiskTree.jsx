import { useState } from "react";
import { RISK_CHANNELS_ALL, CHANNEL_ICONS, CHANNEL_COLORS } from "../data/seed.js";
import { SectionTitle, Spinner, callClaude, heatColor } from "./shared.jsx";

const TreeNode = ({ node, depth = 0 }) => {
  const [open, setOpen] = useState(depth < 2);
  if (!node.children?.length) return (
    <div style={{ paddingLeft: depth * 18, marginTop: 5, display: "flex", gap: 8, alignItems: "flex-start" }}>
      <span style={{ color: "var(--tm)", fontSize: 10, marginTop: 2, fontFamily: "monospace", flexShrink: 0 }}>└─</span>
      <span style={{ fontSize: 12.5, color: "var(--ts)", lineHeight: 1.5 }}>{node.text}</span>
    </div>
  );
  return (
    <div style={{ paddingLeft: depth * 18, marginTop: 5 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
        <span style={{ color: "var(--amber)", fontSize: 10, width: 12, flexShrink: 0 }}>{open ? "▾" : "▸"}</span>
        <span style={{ fontSize: 12.5, color: depth === 0 ? "var(--tp)" : "var(--ts)", lineHeight: 1.5 }}>{node.text}</span>
      </div>
      {open && node.children?.map((c, i) => <TreeNode key={i} node={c} depth={depth + 1} />)}
    </div>
  );
};

function parseAITree(text, channels, triggerName = "") {
  const result = {};
  channels.forEach(ch => {
    // Try to find the channel section — match "CHANNELNAME:" or "Channel Name:" 
    const escaped = ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sectionRegex = new RegExp(`(?:^|\n)${escaped}[:\s]*\n((?:[-•*]\s*.+\n?){1,5})`, 'im');
    const match = text.match(sectionRegex);
    if (match) {
      const bullets = match[1].split('\n')
        .map(l => l.replace(/^[-•*\d.]+\s*/, '').trim())
        .filter(l => l.length > 8);
      if (bullets.length) { result[ch] = bullets.slice(0, 3); return; }
    }
    // Fallback: find channel name and grab next non-empty lines
    const idx = text.toLowerCase().indexOf(ch.toLowerCase());
    if (idx !== -1) {
      const after = text.slice(idx + ch.length).split('\n')
        .slice(0, 6)
        .map(l => l.replace(/^[-•*:\d.]+\s*/, '').trim())
        .filter(l => l.length > 10);
      if (after.length) { result[ch] = after.slice(0, 3); return; }
    }
    result[ch] = [`Analyzing ${ch} implications for ${triggerName || "this scenario"}...`];
  });
  return result;
}

export default function RiskTreePanel({ themes = [] }) {
  const [triggerMode, setTriggerMode] = useState("theme"); // "theme" | "custom"
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [customEvent, setCustomEvent] = useState("");
  const [selectedChannels, setSelectedChannels] = useState(["Rates", "FX", "Equities", "Credit"]);
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bullBear, setBullBear] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const triggerEvent = triggerMode === "theme" ? (selectedTheme?.name || "") : customEvent;

  const toggleChannel = (ch) => {
    setSelectedChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const generateTree = async () => {
    if (!triggerEvent) return;
    setLoading(true); setTreeData(null); setBullBear(null); setElapsed(0);
    const startTime = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 500);
    try {
      const channelList = selectedChannels.join(", ");
      const themeCtx = selectedTheme ? `Heat: ${selectedTheme.heat}/100, Status: ${selectedTheme.status || "Active"}, Tags: ${(selectedTheme.tags||[]).join(", ")}, Description: ${selectedTheme.description || ""}` : "";
      const text = await callClaude(
        "You are a senior macro risk analyst at a $50bn asset manager. You MUST output structured analysis in EXACTLY the format specified. Do not add preamble or explanation.",
        `Trigger event: "${triggerEvent}"${themeCtx ? `\nContext: ${themeCtx}` : ""}\n\nAnalyze risk implications across: ${channelList}\n\nYou MUST use EXACTLY this format for each channel (replace with specific quantitative analysis):\n\n${selectedChannels.map(ch => `${ch.toUpperCase()}:\n- [specific causal chain with numbers e.g. "10Y yields rise 40-60bps → duration assets sell off → TLT -8-12%"]\n- [second implication]\n- [third implication]`).join("\n\n")}\n\nBULL CASE: [one sentence on what limits severity]\nBEAR CASE: [one sentence on worst case amplifiers]`,
        1500
      );

      // Extract bull/bear
      const bullMatch = text.match(/BULL CASE[:\s]+([^\n]+)/i);
      const bearMatch = text.match(/BEAR CASE[:\s]+([^\n]+)/i);
      setBullBear({ bull: bullMatch?.[1]?.trim() || "Trade deal progress halts escalation", bear: bearMatch?.[1]?.trim() || "Full escalation + secondary shocks simultaneously" });

      const parsed = parseAITree(text, selectedChannels, triggerEvent);
      setTreeData(parsed);
    } catch (e) {
      console.error("Risk tree error:", e);
    }
    clearInterval(timer);
    setLoading(false);
  };

  // Show seed data by default for selected theme
  const displayData = treeData || null;
  const displayBullBear = bullBear || (triggerMode === "theme" ? { bull: "Trade deal progress or policy reversal halts escalation", bear: "Full escalation + simultaneous secondary shocks" } : null);

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <SectionTitle color="var(--red)">Risk Implication Tree — Causal Chain Analysis</SectionTitle>

        {/* Trigger selection */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {["theme", "custom"].map(m => (
            <button key={m} onClick={() => setTriggerMode(m)}
              style={{ background: triggerMode === m ? "var(--amber)" : "var(--bg3)", color: triggerMode === m ? "#000" : "var(--ts)", border: `1px solid ${triggerMode === m ? "transparent" : "var(--border)"}`, borderRadius: 5, padding: "6px 14px", cursor: "pointer", fontFamily: "monospace", fontSize: 12, fontWeight: triggerMode === m ? 700 : 400 }}>
              {m === "theme" ? "Select Theme" : "Custom Event"}
            </button>
          ))}
        </div>

        {triggerMode === "theme" ? (
          <select value={selectedTheme?.name || ""} onChange={e => setSelectedTheme(themes.find(t => t.name === e.target.value) || null)}
            style={{ width: "100%", background: "var(--bg1)", border: "1px solid var(--borderlit)", borderRadius: 6, padding: "10px 14px", color: "var(--tp)", fontFamily: "'Space Mono',monospace", fontSize: 13, marginBottom: 14 }}>
            <option value="">— Select a live theme —</option>
            {[...themes].sort((a,b)=>(b.heat||0)-(a.heat||0)).map(t => <option key={t.name} value={t.name}>{t.name} — Heat {t.heat}</option>)}
          </select>
        ) : (
          <input value={customEvent} onChange={e => setCustomEvent(e.target.value)}
            placeholder="e.g. Fed raises rates 100bps in emergency meeting"
            style={{ width: "100%", background: "var(--bg1)", border: "1px solid var(--borderlit)", borderRadius: 6, padding: "10px 14px", color: "var(--tp)", fontFamily: "'Space Mono',monospace", fontSize: 13, marginBottom: 14 }} />
        )}

        {/* Channel selection */}
        <div className="mono" style={{ fontSize: 10, color: "var(--tm)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Select Analysis Channels</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {RISK_CHANNELS_ALL.map(ch => (
            <button key={ch} onClick={() => toggleChannel(ch)}
              style={{ background: selectedChannels.includes(ch) ? CHANNEL_COLORS[ch] + "22" : "var(--bg3)", border: `1px solid ${selectedChannels.includes(ch) ? CHANNEL_COLORS[ch] + "88" : "var(--border)"}`, color: selectedChannels.includes(ch) ? CHANNEL_COLORS[ch] : "var(--ts)", borderRadius: 5, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 5 }}>
              <span>{CHANNEL_ICONS[ch]}</span> {ch}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "var(--ts)", fontSize: 11, fontFamily: "monospace" }}>Generating risk tree via Claude AI...</span>
              <span style={{ color: "var(--amber)", fontSize: 11, fontFamily: "monospace" }}>{elapsed}s</span>
            </div>
            <div style={{ height: 3, background: "var(--bg3)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "var(--red)", borderRadius: 2, width: `${Math.min(elapsed * 5, 92)}%`, transition: "width 0.5s ease" }} />
            </div>
          </div>
        )}
        <button onClick={generateTree} disabled={loading || !triggerEvent || selectedChannels.length === 0}
          style={{ background: loading ? "var(--bg3)" : "var(--red)", color: loading ? "var(--ts)" : "#fff", border: "none", borderRadius: 6, padding: "10px 20px", cursor: loading ? "not-allowed" : "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
          {loading ? <><Spinner /> Generating risk tree...</> : "⚡ Generate Risk Tree"}
        </button>
      </div>

      {/* Trigger event display */}
      {triggerEvent && (
        <div style={{ background: "var(--bg1)", borderRadius: 8, padding: "12px 16px", borderLeft: "3px solid var(--red)", marginBottom: 14 }}>
          <span className="mono" style={{ color: "var(--red)", fontSize: 11 }}>⚡ TRIGGER EVENT: </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--tp)" }}>{triggerEvent}</span>
        </div>
      )}

      {/* Tree */}
      {displayData && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: selectedChannels.length > 4 ? "1fr 1fr 1fr" : "1fr 1fr", gap: 14 }}>
            {selectedChannels.filter(ch => displayData[ch]).map(ch => (
              <div key={ch} className="card fade-up" style={{ border: `1px solid ${CHANNEL_COLORS[ch]}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${CHANNEL_COLORS[ch]}22` }}>
                  <span style={{ fontSize: 16 }}>{CHANNEL_ICONS[ch]}</span>
                  <span className="mono" style={{ color: CHANNEL_COLORS[ch], fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>{ch}</span>
                </div>
                {(Array.isArray(displayData[ch]) ? displayData[ch] : [displayData[ch]]).map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <span style={{ color: CHANNEL_COLORS[ch], fontSize: 10, marginTop: 3, flexShrink: 0 }}>▸</span>
                    <span style={{ fontSize: 12.5, color: "var(--ts)", lineHeight: 1.55 }}>{typeof item === "string" ? item : item.text}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Bull / Bear */}
          {displayBullBear && (
            <div className="card fade-up" style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ borderLeft: "3px solid var(--green)", paddingLeft: 12 }}>
                <div className="mono" style={{ color: "var(--green)", fontSize: 10, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Bull Case — Risk Mitigants</div>
                <p style={{ color: "var(--ts)", fontSize: 13, lineHeight: 1.6 }}>{displayBullBear.bull}</p>
              </div>
              <div style={{ borderLeft: "3px solid var(--red)", paddingLeft: 12 }}>
                <div className="mono" style={{ color: "var(--red)", fontSize: 10, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Bear Case — Downside Scenario</div>
                <p style={{ color: "var(--ts)", fontSize: 13, lineHeight: 1.6 }}>{displayBullBear.bear}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
