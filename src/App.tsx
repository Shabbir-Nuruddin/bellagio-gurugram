import { Fragment, useEffect, useState, type ReactNode } from "react";
import { CalendarCheck, WhatsappLogo } from "@phosphor-icons/react";
import { SITE } from "./content";
import { UI, bi, openState, type Lang, type SectionKey } from "./lib";
import { LangToggle } from "./components/LangToggle";
import { Dishes, Gallery, Reviews, Visit } from "./components/Sections";
import { Feature } from "./components/Feature";
import { BOOK, BookPage, BookCta, Link } from "./components/Book";
import { CallButton, WaButton, waLink } from "./components/ui";
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
  const [path, setPath] = useState(() => location.pathname.replace(/\/+$/, "") || "/");
  const onBook = path === "/book";
  const go = (p: string) => {
    if (p !== location.pathname) history.pushState(null, "", p);
    setPath(p);
    window.scrollTo(0, 0);
  };
  useEffect(() => {
    const onPop = () => setPath(location.pathname.replace(/\/+$/, "") || "/");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
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
    build: () => <BookCta lang={lang} reduced={reduced} index={idx()} go={go} />,
  };
  const wa = bi(SITE.waHello, lang);

  return (
    <div className="relative">
      <header className="fixed inset-x-0 top-0 z-40">
        <p className="bg-accent px-4 py-1.5 text-center text-[13px] font-medium text-on-accent">{bi(SITE.banner, lang)}</p>
        <div className="border-b border-line bg-bg">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
            <Link to="/" go={go} className="min-w-0 leading-none">
              <span className="block truncate font-display text-[24px] leading-none text-ink">{SITE.name}</span>
              <span className="mt-1 block truncate text-[13px] text-ink-2">{bi(SITE.sub, lang)}</span>
            </Link>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                to="/book"
                go={go}
                className={`hidden items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold transition-colors md:inline-flex ${onBook ? "bg-accent text-on-accent" : "border border-line text-ink hover:border-accent"}`}
              >
                <CalendarCheck size={18} weight="bold" />
                {m.cta}
              </Link>
              <LangToggle value={lang} onChange={setLang} label={t.lang} />
              <span className="hidden md:contents">
                <CallButton label={t.call} className="!px-5 !py-2.5 !text-[15px]" />
              </span>
            </div>
          </div>
        </div>
      </header>

      {onBook ? (
        <main className="relative">
          <BookPage lang={lang} reduced={reduced} go={go} />
        </main>
      ) : (
        <>
      <Hero lang={lang} reduced={reduced} open={state} wa={wa} />

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
        </>
      )}

      <footer className="border-t border-line px-4 pb-28 pt-8 text-center text-[13px] leading-relaxed text-ink-3 sm:px-8 md:pb-10">
        {lang === "en"
          ? `Concept website made for ${SITE.name} by LocalLift. Photos and reviews are from the public Google listing.`
          : `${SITE.name} के लिए LocalLift का बनाया हुआ कॉन्सेप्ट वेबसाइट। फ़ोटो और रिव्यू पब्लिक गूगल लिस्टिंग से हैं।`}
      </footer>

      <a
        href={waLink(wa)}
        target="_blank"
        rel="noreferrer"
        aria-label={t.whatsapp}
        className={`fixed bottom-6 right-6 z-40 h-14 w-14 items-center justify-center rounded-full bg-wa text-[#062a14] transition-transform hover:-translate-y-1 ${onBook ? "hidden" : "hidden md:flex"}`}
      >
        <WhatsappLogo size={28} weight="fill" />
      </a>

      {!onBook && (
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[auto_1.3fr_1fr] gap-2 border-t border-line bg-bg p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <CallButton label={t.callShort} className="whitespace-nowrap !px-4 !py-3" />
        <Link to="/book" go={go} className="inline-flex items-center justify-center gap-2 rounded-full bg-accent py-3 text-[16px] font-semibold text-on-accent active:scale-[0.98]">
          <CalendarCheck size={19} weight="bold" />
          {m.short}
        </Link>
        <a href={waLink(wa)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-wa py-3 text-[16px] font-semibold text-[#062a14] active:scale-[0.98]">
          <WhatsappLogo size={20} weight="fill" />
          {t.whatsapp}
        </a>
      </div>
      )}
    </div>
  );
}
