import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem("mip-theme") || "dark");
  const [apiKeys, setApiKeys] = useState({ claude: null, alphaVantage: "", youtube: "" });
  const [hoveredArticle, setHoveredArticle] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [articleModal, setArticleModal] = useState(null); // article id to highlight
  const [briefCache, setBriefCache] = useState(() => {
    try {
      const c = localStorage.getItem("mip-brief-cache");
      if (!c) return null;
      const parsed = JSON.parse(c);
      const age = Date.now() - parsed.timestamp;
      if (age > 24 * 60 * 60 * 1000) { localStorage.removeItem("mip-brief-cache"); return null; }
      return parsed;
    } catch { return null; }
  });

  useEffect(() => {
    localStorage.setItem("mip-theme", colorTheme);
    document.documentElement.setAttribute("data-theme", colorTheme);
  }, [colorTheme]);

  const toggleTheme = useCallback(() => setColorTheme(t => t === "dark" ? "light" : "dark"), []);

  const saveBriefCache = useCallback((content) => {
    const entry = { content, timestamp: Date.now() };
    localStorage.setItem("mip-brief-cache", JSON.stringify(entry));
    setBriefCache(entry);
  }, []);

  const showArticleHover = useCallback((article, x, y) => {
    setHoveredArticle(article);
    setHoverPos({ x, y });
  }, []);

  const hideArticleHover = useCallback(() => setHoveredArticle(null), []);

  const openArticleModal = useCallback((articleId) => setArticleModal(articleId), []);
  const closeArticleModal = useCallback(() => setArticleModal(null), []);

  return (
    <AppContext.Provider value={{
      colorTheme, toggleTheme,
      apiKeys, setApiKeys,
      hoveredArticle, hoverPos, showArticleHover, hideArticleHover,
      articleModal, openArticleModal, closeArticleModal,
      briefCache, saveBriefCache,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
