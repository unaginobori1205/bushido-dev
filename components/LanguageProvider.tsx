"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { content, type Lang, type SiteContent } from "@/lib/content";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  t: SiteContent;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "bushido-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default English per the brand brief; English also renders during SSR.
  const [lang, setLangState] = useState<Lang>("en");

  // Restore a returning visitor's preference on the client only.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "ja") {
      setLangState(stored);
    }
  }, []);

  // Keep <html lang> accurate for accessibility & SEO.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  const toggle = () => setLang(lang === "en" ? "ja" : "en");

  return (
    <LanguageContext.Provider
      value={{ lang, setLang, toggle, t: content[lang] }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
