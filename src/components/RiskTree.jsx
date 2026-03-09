import { useState } from "react";
import { THEMES, RISK_CHANNELS_ALL, CHANNEL_ICONS, CHANNEL_COLORS } from "../data/seed.js";
import { SectionTitle, Spinner, callClaude } from "./shared.jsx";

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

function parseAITree(text, channels) {
  // Parse AI output into structured channel nodes
  const result = {};
  channels.forEach(ch => {
    const lines = [];
    const regex = new RegExp(`${ch}[:\\s]+([^\\n]+(?:\\n(?!\\w)[^\\n]+)*)`, 'i');
    const match = text.match(regex);
    if (match) {
      const raw = match[1].trim().split(/\n[-•]\s*|\n\d+\.\s*/).filter(Boolean);
      if (raw.length) { result[ch] = raw.slice(0, 3); return; }
    }
    // fallback: grab lines after channel name
    const idx = text.toLowerCase().indexOf(ch.toLowerCase());
    if (idx !== -1) {
      const after = text.slice(idx).split('\n').slice(1, 4).map(l => l.replace(/^[-•\d.]\s*/, '').trim()).filter(l => l.length > 10);
      result[ch] = after.length ? after : [`${ch} exposure elevated under this scenario`];
    } else {
      result[ch] = [`${ch} exposure elevated under this scenario`];
    }
  });
  return result;
}

export default function RiskTreePanel(props) {
  const [triggerMode, setTriggerMode] = useState("theme"); // "theme" | "custom"
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [customEvent, setCustomEvent] = useState("");
  const [selectedChannels, setSelectedChannels] = useState(["Rates", "FX", "Equities", "Credit"]);
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bullBear, setBullBear] = useState(null);

  const triggerEvent = triggerMode === "theme" ? selectedTheme?.name : customEvent;

  const toggleChannel = (ch) => {
    setSelectedChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const generateTree = async () => {
    if (!triggerEvent) return;
    setLoading(true); setTreeData(null); setBullBear(null);
    try {
      const channelList = selectedChannels.join(", ");
      const text = await callClaude(
        "You are a macro risk analyst. Generate a structured causal risk tree with specific, quantitative implications. Format each channel clearly labeled.",
        `Trigger event: "${triggerEvent}"\n\nAnalyze impact across these channels: ${channelList}\n\nFor each channel provide 2-3 specific causal implications (e.g. "Higher-for-longer rates → duration assets (TLT) sell off → 10Y yield +40-60bps"). Be specific and quantitative.\n\nAlso provide:\nBULL CASE: (one sentence — what makes this scenario less severe)\nBEAR CASE: (one sentence — what makes this scenario worse)\n\nFormat:\n[CHANNEL NAME]\n- implication 1\n- implication 2\n\nBULL CASE: ...\nBEAR CASE: ...`,
        1200
      );

      // Extract bull/bear
      const bullMatch = text.match(/BULL CASE[:\s]+([^\n]+)/i);
      const bearMatch = text.match(/BEAR CASE[:\s]+([^\n]+)/i);
      setBullBear({ bull: bullMatch?.[1]?.trim() || "Trade deal progress halts escalation", bear: bearMatch?.[1]?.trim() || "Full escalation + secondary shocks simultaneously" });

      const parsed = parseAITree(text, selectedChannels);
      setTreeData(parsed);
    } catch (e) {
      // fallback to seed data if available
      if (triggerMode === "theme" && selectedTheme?.riskTree) {
        setTreeData(selectedTheme.riskTree.implications);
        setBullBear({ bull: "Scenario resolves faster than expected", bear: "Full escalation with global contagion" });
      }
    }
    setLoading(false);
  };

  // Show seed data by default for selected theme
  const displayData = treeData || (triggerMode === "theme" && selectedTheme?.riskTree?.implications) || null;
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
          <select value={selectedTheme?.id} onChange={e => setSelectedTheme(THEMES.find(t => t.id === parseInt(e.target.value)))}
            style={{ width: "100%", background: "var(--bg1)", border: "1px solid var(--borderlit)", borderRadius: 6, padding: "10px 14px", color: "var(--tp)", fontFamily: "'Space Mono',monospace", fontSize: 13, marginBottom: 14 }}>
            {THEMES.map(t => <option key={t.id} value={t.id}>{t.name} — Heat {t.heat}</option>)}
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
