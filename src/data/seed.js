export const THEMES = [
  { id: 1, name: "US Tariff Escalation", heat: 94, status: "Heating Fast", change: "+340%", articles: 847, trend: [20,35,42,68,74,89,94], color: "#ff4444", first_detected: "2025-01-15", description: "Broad-based tariff increases targeting China, EU, and EM economies. Second-order inflation pass-through and retaliatory trade actions accelerating.", tags: ["trade","tariffs","protectionism","inflation"], countries: ["USA","China","EU"], assets: ["USD","US Equities","EM FX"] },
  { id: 2, name: "Fed Policy Paralysis", heat: 71, status: "Warm", change: "+18%", articles: 612, trend: [60,65,72,68,75,71,71], color: "#f0a500", first_detected: "2024-09-03", description: "Debate intensifying around timing of first rate cut. Inflation stickiness vs. labor market softening creating policy paralysis signals.", tags: ["fed","monetary policy","rates","inflation"], countries: ["USA"], assets: ["US Rates","USD","US Equities"] },
  { id: 3, name: "China Property Stress", heat: 23, status: "Suspicious Silence ⚠", change: "-67%", articles: 89, trend: [78,65,55,48,38,29,23], color: "#bb86fc", first_detected: "2023-08-21", description: "Coverage has dropped sharply despite unresolved developer defaults. Possible regulatory information suppression or market fatigue.", tags: ["china","property","credit","default"], countries: ["China"], assets: ["EM Equities","EM FX","HY Credit"] },
  { id: 4, name: "BOJ Normalization Risk", heat: 82, status: "Heating Fast", change: "+210%", articles: 431, trend: [15,22,34,50,63,76,82], color: "#ff4444", first_detected: "2024-11-12", description: "Bank of Japan signaling further YCC exit. Global carry trade unwind risk as JPY strengthens. Potential systemic cross-asset dislocation.", tags: ["boj","japan","carry trade","rates","JPY"], countries: ["Japan","USA"], assets: ["JPY","US Rates","EM FX"] },
  { id: 5, name: "EU Energy Transition", heat: 45, status: "Cooling", change: "-22%", articles: 203, trend: [72,68,62,58,52,48,45], color: "#00d4ff", first_detected: "2022-06-08", description: "Green transition costs moderating media attention. Industrial competitiveness concerns vs. decarbonization targets.", tags: ["europe","energy","ESG","climate"], countries: ["Germany","France","EU"], assets: ["EUR","EU Equities","Energy"] },
  { id: 6, name: "EM Currency Stress", heat: 68, status: "Heating Fast", change: "+89%", articles: 338, trend: [30,38,45,52,58,64,68], color: "#ff4444", first_detected: "2025-02-01", description: "Dollar strength and tariff shock creating dual pressure on EM FX reserves. Turkey, Mexico, South Africa most exposed.", tags: ["emerging markets","FX","dollar","reserves"], countries: ["Turkey","Mexico","South Africa","Brazil"], assets: ["EM FX","EM Equities","EM Bonds"] },
  { id: 7, name: "AI Infrastructure Capex", heat: 77, status: "Warm", change: "+34%", articles: 521, trend: [45,52,58,65,70,74,77], color: "#f0a500", first_detected: "2024-03-15", description: "Hyperscaler capex acceleration driving semiconductor demand, power grid stress, and data center REIT valuations.", tags: ["AI","semiconductors","capex","tech"], countries: ["USA","Taiwan"], assets: ["US Equities","Semiconductors","Energy"] },
  { id: 8, name: "Red Sea Disruption", heat: 38, status: "Cooling", change: "-41%", articles: 156, trend: [85,79,72,62,55,45,38], color: "#00d4ff", first_detected: "2023-12-19", description: "Shipping rerouting around Cape of Good Hope persisting but market attention waning. Container rates stabilizing.", tags: ["shipping","geopolitics","supply chain"], countries: ["Yemen","Egypt","Global"], assets: ["Oil","Shipping","Commodities"] },
];

export const CROSS_ASSET = [
  { asset: "US Rates", impact: 92, direction: "negative", detail: "yields rising sharply", magnitude: "CRITICAL" },
  { asset: "USD Index", impact: 78, direction: "positive", detail: "dollar strengthening", magnitude: "HIGH" },
  { asset: "EM Currencies", impact: -85, direction: "negative", detail: "severe depreciation pressure", magnitude: "CRITICAL" },
  { asset: "US Equities", impact: -62, direction: "negative", detail: "earnings risk, P/E compression", magnitude: "HIGH" },
  { asset: "EM Equities", impact: -88, direction: "negative", detail: "twin shock: FX + trade", magnitude: "CRITICAL" },
  { asset: "HY Credit", impact: -71, direction: "negative", detail: "spreads widening 80-120bps", magnitude: "HIGH" },
  { asset: "Gold", impact: 45, direction: "positive", detail: "safe haven bid", magnitude: "MEDIUM" },
  { asset: "Oil/Commodities", impact: -38, direction: "negative", detail: "demand slowdown fears", magnitude: "MEDIUM" },
  { asset: "JPY", impact: 55, direction: "positive", detail: "safe haven + BOJ unwind", magnitude: "HIGH" },
];

export const RISK_TREE = {
  event: "US Tariff Escalation — 145% China Tariffs",
  channels: [
    { name: "Rates", icon: "📈", color: "#f0a500", implications: [
      { text: "Inflationary pressure from import price pass-through", children: [
        { text: "Fed forced to maintain higher-for-longer stance", children: [
          { text: "2yr Treasury yield rises 40-60bps" },
          { text: "Duration assets (TLT) face continued selling" }
        ]}
      ]},
      { text: "Supply chain inflation embedded in CPI ex-energy", children: [
        { text: "Rate cut expectations pushed to H2 2026" }
      ]}
    ]},
    { name: "FX", icon: "💱", color: "#00d4ff", implications: [
      { text: "USD initial strength on hawkish Fed repricing", children: [
        { text: "CNY managed devaluation accelerates", children: [
          { text: "Asian EM currencies follow CNY lower" },
          { text: "MXN, BRL face dual tariff + dollar pressure" }
        ]}
      ]},
      { text: "EUR weakness on EU-US trade friction", children: [
        { text: "ECB-Fed divergence widens" }
      ]}
    ]},
    { name: "Equities", icon: "📉", color: "#ff4444", implications: [
      { text: "S&P 500 earnings risk from margin compression", children: [
        { text: "Consumer discretionary most exposed (AMZN, WMT)", children: [
          { text: "Q2 earnings guide-downs accelerating" }
        ]},
        { text: "Tech hardware — AAPL iPhone cost +$200-350 estimate" }
      ]},
      { text: "EM equities — China H-shares, MSCI EM underperform", children: [
        { text: "China stimulus offset insufficient at current tariff levels" }
      ]}
    ]},
    { name: "Credit", icon: "🔗", color: "#bb86fc", implications: [
      { text: "HY spreads widen 80-120bps in tariff shock scenario", children: [
        { text: "Leveraged retail / consumer sector most at risk", children: [
          { text: "Default cycle could front-run recession" }
        ]}
      ]},
      { text: "IG spreads widen modestly — flight to quality within credit" }
    ]}
  ]
};

export const GRAPH_NODES = [
  { id: "US Tariffs", group: "theme", size: 22, color: "#ff4444" },
  { id: "Fed Policy", group: "theme", size: 20, color: "#f0a500" },
  { id: "BOJ Unwind", group: "theme", size: 18, color: "#ff4444" },
  { id: "China Stress", group: "theme", size: 16, color: "#bb86fc" },
  { id: "EM FX Stress", group: "theme", size: 17, color: "#ff4444" },
  { id: "USD", group: "asset", size: 15, color: "#00d4ff" },
  { id: "US Rates", group: "asset", size: 15, color: "#00d4ff" },
  { id: "S&P 500", group: "asset", size: 14, color: "#00d4ff" },
  { id: "Gold", group: "asset", size: 13, color: "#00d4ff" },
  { id: "Federal Reserve", group: "institution", size: 17, color: "#00e676" },
  { id: "Bank of Japan", group: "institution", size: 15, color: "#00e676" },
  { id: "PBOC", group: "institution", size: 14, color: "#00e676" },
  { id: "US CPI", group: "indicator", size: 12, color: "#ffeb3b" },
  { id: "JPY Carry", group: "indicator", size: 12, color: "#ffeb3b" },
];

export const GRAPH_LINKS = [
  { source: "US Tariffs", target: "Fed Policy", weight: 0.8, label: "inflationary pressure" },
  { source: "US Tariffs", target: "EM FX Stress", weight: 0.9, label: "dollar shock" },
  { source: "US Tariffs", target: "China Stress", weight: 0.85, label: "trade shock" },
  { source: "US Tariffs", target: "USD", weight: 0.75, label: "safe haven flow" },
  { source: "Fed Policy", target: "US Rates", weight: 0.95, label: "policy transmission" },
  { source: "Fed Policy", target: "USD", weight: 0.7, label: "rate differential" },
  { source: "Fed Policy", target: "S&P 500", weight: 0.65, label: "discount rate" },
  { source: "Federal Reserve", target: "Fed Policy", weight: 1.0, label: "sets policy" },
  { source: "BOJ Unwind", target: "JPY Carry", weight: 0.9, label: "unwind trigger" },
  { source: "BOJ Unwind", target: "US Rates", weight: 0.6, label: "JGB selling" },
  { source: "Bank of Japan", target: "BOJ Unwind", weight: 1.0, label: "drives" },
  { source: "China Stress", target: "EM FX Stress", weight: 0.7, label: "contagion" },
  { source: "PBOC", target: "China Stress", weight: 0.85, label: "stimulus response" },
  { source: "US CPI", target: "Fed Policy", weight: 0.9, label: "drives hawkishness" },
  { source: "EM FX Stress", target: "Gold", weight: 0.6, label: "safe haven" },
  { source: "US Rates", target: "S&P 500", weight: 0.75, label: "discount rate" },
  { source: "JPY Carry", target: "EM FX Stress", weight: 0.65, label: "global risk-off" },
];

export const EMERGING = [
  { theme: "BOJ Normalization Risk", prob: 84, conf: 78, signal: "Source migration: niche → FT/WSJ front page. Graph centrality +340% in 14 days.", drivers: ["JPY at 30yr lows", "BOJ meetings escalating", "JGB yield pressure"] },
  { theme: "EU Auto Tariff Retaliation", prob: 72, conf: 65, signal: "Mention growth +180% from low base. EU trade commissioner statements escalating.", drivers: ["US tariff spillover", "EU election pressure", "German auto lobby"] },
  { theme: "US Commercial Real Estate Wave 2", prob: 61, conf: 58, signal: "Office maturity wall approaching. Regional bank exposure resurging in analyst notes.", drivers: ["Rate-locked refinancing", "WFH structural shift", "Bank earnings risk"] },
  { theme: "India Macro Ascendance", prob: 55, conf: 62, signal: "Positive divergence from EM peers. FII inflow acceleration.", drivers: ["China+1 supply chain", "Modi 3.0 reforms", "Demographics"] },
  { theme: "Semiconductor Supply Cycle", prob: 48, conf: 52, signal: "AI capex cycle creating inventory overhang in legacy nodes.", drivers: ["TSMC capex guidance", "ASML bookings", "China export controls"] },
];

export const MEMORY = [
  { date: "2025-10-14", query: "Fed policy", summary: "Consensus leaned dovish pivot. Labor market data showed NFP +89k (below 150k threshold). Analysis predicted first cut Dec 2025.", themes: ["Fed Policy"], heat: 65 },
  { date: "2025-09-03", query: "China property", summary: "Evergrande liquidation triggered fresh contagion fears. Heatmap showed CRITICAL negative on EM Equities. 3 new developers missed coupon payments.", themes: ["China Property Stress"], heat: 78 },
  { date: "2025-08-05", query: "BOJ carry unwind", summary: "JPY short squeeze caused S&P flash crash -3.2% in single session. Systemic carry unwind risk from ¥155 threshold breach flagged.", themes: ["BOJ Normalization Risk"], heat: 92 },
  { date: "2025-07-21", query: "US tariffs", summary: "Initial 10% baseline tariff announced. Analysis underestimated escalation risk — revised upward to 145% China scenario within 6 weeks.", themes: ["US Tariff Escalation"], heat: 45 },
];

export const MARKET_PULSE = [
  { name: "USD Index", value: "+0.84%", dir: "up" },
  { name: "10Y UST", value: "4.82%", dir: "up" },
  { name: "S&P 500", value: "-1.24%", dir: "down" },
  { name: "Gold", value: "+1.62%", dir: "up" },
  { name: "JPY/USD", value: "141.3", dir: "up" },
  { name: "WTI Oil", value: "-0.38%", dir: "down" },
  { name: "VIX", value: "28.4 ↑", dir: "down" },
  { name: "HY Sprd", value: "487bps ↑", dir: "down" },
];

export const WEEKLY_BRIEF = {
  week: "Week of March 3, 2026",
  top_themes: [
    { name: "US Tariff Escalation", status: "🔥 Heating Fast", note: "145% China tariffs now in effect. Second-order inflation pass-through accelerating." },
    { name: "BOJ Normalization Risk", status: "🔥 Heating Fast", note: "Ueda signals H2 2026 normalization. Carry trade unwind risk at critical juncture." },
    { name: "Fed Policy Paralysis", status: "📊 Warm", note: "Tariff inflation vs. growth slowdown creating policy paralysis. Cut timeline pushed to late 2026." },
    { name: "China Property Crisis", status: "⚠ Suspicious Silence", note: "Coverage dropped 67% despite unresolved developer obligations." },
  ],
  key_risks: [
    "USD/JPY break of ¥140 could trigger systemic carry unwind",
    "Q2 earnings season: margin compression wave incoming",
    "EM external debt refinancing stress intensifying",
    "US-EU trade escalation adds second front to tariff shock",
  ],
  watch_next: [
    { event: "US CPI Release", date: "Tue Mar 10", importance: "CRITICAL" },
    { event: "Fed Chair Powell Speech", date: "Wed Mar 11", importance: "HIGH" },
    { event: "BOJ Meeting Minutes", date: "Thu Mar 12", importance: "HIGH" },
    { event: "China Trade Balance", date: "Fri Mar 13", importance: "MEDIUM" },
  ],
};
