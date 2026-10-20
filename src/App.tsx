import { Fragment, useEffect, useState, type ReactNode } from "react";
import { Crown, DownloadSimple } from "@phosphor-icons/react";
import { SITE } from "./content";
import { UI, bi, openState, type Lang, type SectionKey } from "./lib";
import { LangToggle } from "./components/LangToggle";
import { Dishes, Gallery, Reviews, Visit } from "./components/Sections";
import { Feature } from "./components/Feature";
import { BOOK, MENU_PDF, Menu, Vip } from "./components/Book";
import { Hero } from "./components/Hero";

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function App() {
  const [lang, setLang] = useState<Lang>("en");
  const t = UI[lang];
  const reduced = new URLSearchParams(location.search).has("still");
  const now = useNow();
  const state = openState(SITE.hours, now);
  const m = BOOK[lang];

  // old /book links and /vip land on the reservation form
  useEffect(() => {
    if (!/^\/(book|vip)\/?$/.test(location.pathname) && location.hash !== "#vip") return;
    history.replaceState(null, "", "/#vip");
    const id = setTimeout(() => document.getElementById("vip")?.scrollIntoView(), 300);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  let n = 0;
  const idx = () => String(++n).padStart(2, "0");
  const sections: Record<SectionKey, () => ReactNode> = {
    dishes: () => <Dishes lang={lang} reduced={reduced} index={idx()} />,
    gallery: () => <Gallery lang={lang} reduced={reduced} index={idx()} />,
    feature: () => <Feature lang={lang} reduced={reduced} index={idx()} />,
    reviews: () => <Reviews lang={lang} reduced={reduced} index={idx()} />,
    visit: () => <Visit lang={lang} reduced={reduced} index={idx()} now={now} />,
    menu: () => <Menu lang={lang} reduced={reduced} index={idx()} />,
    vip: () => <Vip lang={lang} reduced={reduced} index={idx()} />,
    build: () => null,
  };

  return (
    <div className="relative">
      <header className="fixed inset-x-0 top-0 z-40">
        <p className="bg-accent px-4 py-1.5 text-center text-[13px] font-medium text-on-accent">{bi(SITE.banner, lang)}</p>
        <div className="border-b border-line bg-bg">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
            <a href="#top" className="min-w-0 leading-none">
              <span className="block truncate font-display text-[24px] leading-none text-ink">{SITE.name}</span>
              <span className="mt-1 block truncate text-[13px] text-ink-2">{bi(SITE.sub, lang)}</span>
            </a>
            <div className="flex shrink-0 items-center gap-3">
              <a href="#menu" className="hidden rounded-full px-4 py-2.5 text-[15px] font-semibold text-ink-2 transition-colors hover:text-ink md:inline-flex">
                {m.menuShort}
              </a>
              <LangToggle value={lang} onChange={setLang} label={t.lang} />
              <a href="#vip" className="hidden items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[15px] font-semibold text-on-accent transition-transform hover:-translate-y-0.5 md:inline-flex">
                <Crown size={18} weight="fill" />
                {m.cta}
              </a>
            </div>
          </div>
        </div>
      </header>

      <Hero lang={lang} reduced={reduced} open={state} />

      {/* dish names run past like a menu board */}
      <div className="marquee relative -mt-[1px] overflow-hidden border-y border-line bg-bg-2 py-4" aria-hidden>
        <div className="marquee-track flex w-max items-center gap-8 pr-8">
          {[...SITE.marquee, ...SITE.marquee, ...SITE.marquee, ...SITE.marquee].map((d, i) => (
            <span key={i} className="flex items-center gap-8 font-display text-[clamp(1.4rem,2.6vw,2rem)] leading-none text-ink-2">
              {d}
              <span className="h-2 w-2 rotate-45 bg-accent" />
            </span>
          ))}
        </div>
      </div>

      <main className="relative">
        {SITE.order.map((k) => (
          <Fragment key={k}>{sections[k]()}</Fragment>
        ))}
      </main>

      <footer className="border-t border-line px-4 pb-28 pt-8 text-center text-[13px] leading-relaxed text-ink-3 sm:px-8 md:pb-10">
        {lang === "en"
          ? `Concept website made for ${SITE.name} by LocalLift. Photos and reviews are from the public Google listing.`
          : `${SITE.name} के लिए LocalLift का बनाया हुआ कॉन्सेप्ट वेबसाइट। फ़ोटो और रिव्यू पब्लिक गूगल लिस्टिंग से हैं।`}
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1fr_1.4fr] gap-2 border-t border-line bg-bg p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <a href={MENU_PDF} download="Bellagio-Gurugram-Menu.pdf" className="inline-flex items-center justify-center gap-2 rounded-full border border-line py-3 text-[16px] font-semibold text-ink active:scale-[0.98]">
          <DownloadSimple size={19} weight="bold" />
          {m.menuShort}
        </a>
        <a href="#vip" className="inline-flex items-center justify-center gap-2 rounded-full bg-accent py-3 text-[16px] font-semibold text-on-accent active:scale-[0.98]">
          <Crown size={19} weight="fill" />
          {m.cta}
        </a>
      </div>
    </div>
  );
}
