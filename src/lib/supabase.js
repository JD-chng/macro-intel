import { createClient } from "@supabase/supabase-js";

// These come from your Supabase project → Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── THEMES ────────────────────────────────────────────────────
export async function fetchThemes() {
  const { data, error } = await supabase
    .from("themes")
    .select("*")
    .order("heat", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchThemeWithHistory(themeId) {
  const [themeRes, historyRes] = await Promise.all([
    supabase.from("themes").select("*").eq("id", themeId).single(),
    supabase.from("heat_history")
      .select("score, recorded_at")
      .eq("theme_id", themeId)
      .order("recorded_at", { ascending: true })
      .limit(90),
  ]);
  return {
    theme: themeRes.data,
    history: historyRes.data || [],
  };
}

// ── ARTICLES ──────────────────────────────────────────────────
export async function fetchArticles({ limit = 50, theme = null } = {}) {
  let query = supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (theme) query = query.contains("themes", [theme]);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ── SOCIAL ────────────────────────────────────────────────────
export async function fetchLatestSocialMetrics() {
  const { data } = await supabase
    .from("social_metrics")
    .select("*")
    .order("recorded_at", { ascending: false })
    .limit(1)
    .single();
  return data;
}

export async function fetchSocialPosts({ source = null, limit = 30, theme = null } = {}) {
  let query = supabase
    .from("social_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (source) query = query.eq("source", source);
  if (theme) query = query.contains("theme_names", [theme]);
  const { data } = await query;
  return data || [];
}

// ── YOUTUBE ───────────────────────────────────────────────────
export async function fetchYouTubeVideos({ theme = null, limit = 20 } = {}) {
  let query = supabase
    .from("youtube_videos")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (theme) query = query.contains("theme_names", [theme]);
  const { data } = await query;
  return data || [];
}

// ── ALPHA VANTAGE SENTIMENT ───────────────────────────────────
export async function fetchMarketSentiment(themeName = null) {
  // Get latest record per theme
  let query = supabase
    .from("market_sentiment")
    .select("*")
    .order("recorded_at", { ascending: false });
  if (themeName) {
    query = query.eq("theme_name", themeName).limit(1).single();
    const { data } = await query;
    return data;
  }
  // Get latest for all themes (distinct)
  const { data } = await query.limit(50);
  if (!data) return [];
  // Deduplicate — keep latest per theme
  const seen = new Set();
  return data.filter(r => { if (seen.has(r.theme_name)) return false; seen.add(r.theme_name); return true; });
}

// ── MARKET PULSE ──────────────────────────────────────────────
export async function fetchMarketPulse() {
  const { data } = await supabase
    .from("market_pulse")
    .select("*")
    .order("name");
  return data || [];
}

// ── MEMORY ────────────────────────────────────────────────────
export async function fetchMemory() {
  const { data } = await supabase
    .from("memory")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  return data || [];
}

export async function saveMemory(entry) {
  const { error } = await supabase.from("memory").insert(entry);
  if (error) console.error("saveMemory error:", error.message);
}

export async function fetchArticleCount() {
  const { count, error } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true });
  if (error) console.error("fetchArticleCount error:", error.message);
  console.log("fetchArticleCount result:", count);
  return typeof count === "number" ? count : 0;
}

export async function fetchArticleVelocity() {
  // Get articles from the last 7 days for accurate velocity chart
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("articles")
    .select("published_at")
    .gte("published_at", since);
  return data || [];
}

// ── EMERGING THEMES ───────────────────────────────────────────
export async function fetchEmergingThemes() {
  const { data } = await supabase
    .from("emerging_themes")
    .select("*")
    .order("generated_at", { ascending: false })
    .limit(20);
  if (!data) return [];
  // Return only the most recent batch (generated within same minute)
  if (data.length === 0) return [];
  const latest = data[0].generated_at;
  const cutoff = new Date(new Date(latest).getTime() + 2 * 60 * 1000).toISOString();
  return data.filter(r => r.generated_at <= cutoff);
}

export async function saveEmergingThemes(themes = [], articleCount = 0) {
  if (!themes.length) return;
  const now = new Date().toISOString();
  const rows = themes.map(t => ({
    theme: t.theme,
    prob: t.prob,
    conf: t.conf,
    signal: t.signal,
    why_breakout: t.whyBreakout,
    drivers: t.drivers || [],
    conf_breakdown: t.confBreakdown || {},
    sources: t.sources || [],
    generated_at: now,
    article_count: articleCount,
  }));
  const { error } = await supabase.from("emerging_themes").insert(rows);
  if (error) console.error("saveEmergingThemes error:", error.message);
}

// ── REAL-TIME SUBSCRIPTION (disabled - use polling instead) ───
export function subscribeToArticles(callback) {
  return { unsubscribe: () => {} };
}

export function subscribeToThemes(callback) {
  return { unsubscribe: () => {} };
}
