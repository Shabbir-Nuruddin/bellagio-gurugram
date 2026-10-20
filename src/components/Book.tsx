import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, CalendarCheck, MapPin, Minus, Plus, WhatsappLogo } from "@phosphor-icons/react";
import { useMemo, useState, type MouseEvent } from "react";
import { SITE } from "../content";
import { UI, bi, fmtHour, type Lang } from "../lib";
import { EASE, Heading, waLink } from "./ui";

/*
 * Table booking page. Guests pick party size, day and a time inside opening hours,
 * and the request goes to the restaurant on WhatsApp. Food is ordered at the table.
 */

export const BOOK = {
  en: {
    cta: "Book a table",
    short: "Book",
    kicker: "Reserve on WhatsApp",
    title: "Book a table",
    body: "Pick the day, time and how many of you. The restaurant replies on WhatsApp to confirm your table.",
    homeBody: "Choose a day, time and party size, and send the booking on WhatsApp in one tap. Order when you're at the table.",
    people: "Guests",
    day: "Day",
    today: "Today",
    tomorrow: "Tomorrow",
    closed: "Closed",
    time: "Time",
    pickTime: "Choose a time",
    occasion: "Occasion",
    occasions: ["Just a meal", "Birthday", "Anniversary", "Family get-together", "Work meal"],
    name: "Your name",
    note: "Anything we should know? High chair, window seat…",
    send: "Send booking on WhatsApp",
    need: "Choose a day and time to send",
    fine: "The restaurant confirms your table on WhatsApp. No payment needed.",
    popular: "Guests usually order",
    home: "Home",
    hello: `Hi ${SITE.name}, I'd like to book a table:`,
  },
  hi: {
    cta: "टेबल बुक करें",
    short: "बुक",
    kicker: "व्हाट्सऐप पर बुकिंग",
    title: "टेबल बुक करें",
    body: "दिन, समय और कितने लोग, चुनिए। रेस्टोरेंट व्हाट्सऐप पर आपकी टेबल कन्फ़र्म करेगा।",
    homeBody: "दिन, समय और लोगों की गिनती चुनिए, और एक टैप में बुकिंग व्हाट्सऐप पर भेजिए। खाना टेबल पर ऑर्डर कीजिए।",
    people: "लोग",
    day: "दिन",
    today: "आज",
    tomorrow: "कल",
    closed: "बंद",
    time: "समय",
    pickTime: "समय चुनिए",
    occasion: "मौका",
    occasions: ["बस खाना", "जन्मदिन", "सालगिरह", "परिवार के साथ", "ऑफ़िस वाले"],
    name: "आपका नाम",
    note: "कुछ बताना है? बच्चों की कुर्सी, खिड़की वाली सीट…",
    send: "बुकिंग व्हाट्सऐप पर भेजें",
    need: "भेजने के लिए दिन और समय चुनिए",
    fine: "रेस्टोरेंट व्हाट्सऐप पर टेबल कन्फ़र्म करेगा। कोई पेमेंट नहीं।",
    popular: "मेहमान अक्सर मंगाते हैं",
    home: "होम",
    hello: `नमस्ते ${SITE.name}, मुझे टेबल बुक करनी है:`,
  },
};

/** A site's own seating or occasion choices, when it has them (not order types like takeaway). */
const NOT_SEATING = /delivery|takeaway|pickup|catering|party order|visit|dine-in|fat loss|muscle gain/i;
const OWN = (() => {
  const p = SITE.build?.pick;
  if (!p || SITE.build?.items) return null;
  const options = p.options.filter((o) => !NOT_SEATING.test(o.name.en));
  return options.length >= 2 ? { label: p.label, options } : null;
})();

/** Half-hour slots the restaurant is open on a given date, as decimal hours. */
function slots(date: Date, isToday: boolean) {
  const [o, c] = SITE.hours[date.getDay()];
  if (o >= c) return [];
  const now = new Date();
  const from = isToday ? Math.max(o, Math.ceil((now.getHours() + now.getMinutes() / 60 + 0.5) * 2) / 2) : o;
  const out: number[] = [];
  for (let h = Math.ceil(from * 2) / 2; h <= c - 0.5; h += 0.5) out.push(h);
  return out;
}

export function Link({ to, go, className, children }: { to: string; go: (p: string) => void; className?: string; children: React.ReactNode }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e: MouseEvent) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        go(to);
      }}
    >
      {children}
    </a>
  );
}

const CHIP = "rounded-full border px-4 py-2.5 text-[15px] font-medium transition-colors active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";
const ON = "border-accent bg-accent text-on-accent";
const OFF = "border-line text-ink-2 hover:border-ink-3";
const FIELD = "w-full rounded-xl border border-line bg-bg px-4 py-3 text-[16px] text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none";
const LABEL = "mb-3 text-[12px] font-semibold tracking-[0.16em] text-ink-3";

export function BookPage({ lang, reduced, go }: { lang: Lang; reduced: boolean; go: (p: string) => void }) {
  const m = BOOK[lang];
  const t = UI[lang];
  const locale = lang === "hi" ? "hi-IN" : "en-IN";
  const days = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return { d, slots: slots(d, i === 0) };
    });
  }, []);

  const [people, setPeople] = useState(2);
  const [day, setDay] = useState<number | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [occ, setOcc] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  const dayLabel = (i: number) => (i === 0 ? m.today : i === 1 ? m.tomorrow : days[i].d.toLocaleDateString(locale, { weekday: "short", day: "numeric" }));
  const occLabel = OWN ? bi(OWN.label, lang) : m.occasion;
  const occOpts = OWN ? OWN.options.map((o) => bi(o.name, lang)) : m.occasions;
  const ready = day !== null && time !== null;

  const msg = [
    m.hello,
    `• ${m.people}: ${people}`,
    day !== null ? `• ${m.day}: ${days[day].d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "short" })}` : "",
    time !== null ? `• ${m.time}: ${fmtHour(time)}` : "",
    occ !== null ? `• ${occLabel}: ${occOpts[occ]}` : "",
    name.trim() ? `• ${m.name}: ${name.trim()}` : "",
    note.trim(),
  ]
    .filter(Boolean)
    .join("\n");

  const dishes = SITE.dishes.items.slice(0, 6);

  return (
    <div className="relative mx-auto max-w-[1280px] px-4 pb-16 pt-32 sm:px-8 lg:pt-36">
      <Link to="/" go={go} className="mb-8 inline-flex items-center gap-2 text-[15px] font-medium text-ink-2 hover:text-ink">
        <ArrowLeft size={16} weight="bold" />
        {m.home}
      </Link>
      <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <motion.div initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
          <p className="mb-3 text-[13px] font-semibold tracking-[0.2em] text-accent">{m.kicker.toUpperCase()}</p>
          <h1 className="font-display text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.95] tracking-[-0.02em] text-ink">{m.title}</h1>
          <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed text-ink-2">{m.body}</p>

          <div className="mt-10 space-y-8 rounded-3xl border border-line bg-panel p-5 sm:p-7">
            <div>
              <p className={LABEL}>{m.people.toUpperCase()}</p>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-bg p-1.5">
                <button type="button" aria-label={`− ${m.people}`} onClick={() => setPeople((p) => Math.max(1, p - 1))} className="grid h-11 w-11 place-items-center rounded-full text-ink-2 hover:bg-line">
                  <Minus size={18} weight="bold" />
                </button>
                <span className="w-12 text-center font-display text-[30px] leading-none tabular-nums text-ink" aria-live="polite">
                  {people}
                </span>
                <button type="button" aria-label={`+ ${m.people}`} onClick={() => setPeople((p) => Math.min(60, p + 1))} className="grid h-11 w-11 place-items-center rounded-full bg-accent text-on-accent active:scale-90">
                  <Plus size={18} weight="bold" />
                </button>
              </span>
            </div>

            <div>
              <p className={LABEL}>{m.day.toUpperCase()}</p>
              <div className="flex flex-wrap gap-2">
                {days.map((x, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={x.slots.length === 0}
                    aria-pressed={day === i}
                    onClick={() => {
                      setDay(i);
                      if (time !== null && !x.slots.includes(time)) setTime(null);
                    }}
                    className={`${CHIP} ${day === i ? ON : OFF}`}
                  >
                    {dayLabel(i)}
                    {x.slots.length === 0 && <span className="ml-1.5 text-[12px]">· {m.closed}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className={LABEL}>{m.time.toUpperCase()}</p>
              <select
                className={`${FIELD} appearance-none disabled:opacity-50`}
                disabled={day === null}
                value={time ?? ""}
                onChange={(e) => setTime(e.target.value === "" ? null : Number(e.target.value))}
              >
                <option value="">{m.pickTime}</option>
                {day !== null && days[day].slots.map((h) => <option key={h} value={h}>{fmtHour(h)}</option>)}
              </select>
            </div>

            <div>
              <p className={LABEL}>{occLabel.toUpperCase()}</p>
              <div className="flex flex-wrap gap-2">
                {occOpts.map((o, i) => (
                  <button key={o} type="button" aria-pressed={occ === i} onClick={() => setOcc(occ === i ? null : i)} className={`${CHIP} ${occ === i ? ON : OFF}`}>
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <input className={FIELD} value={name} onChange={(e) => setName(e.target.value)} placeholder={m.name} autoComplete="name" maxLength={60} />
              <textarea className={`${FIELD} min-h-[84px] resize-none`} value={note} onChange={(e) => setNote(e.target.value)} placeholder={m.note} maxLength={300} />
            </div>

            <div>
              <a
                href={ready ? waLink(msg) : undefined}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!ready}
                className={`flex w-full items-center justify-center gap-2.5 rounded-full py-4 text-[17px] font-semibold transition-transform active:scale-[0.98] ${ready ? "bg-wa text-[#062a14]" : "pointer-events-none bg-line text-ink-3"}`}
              >
                <WhatsappLogo size={22} weight="fill" />
                {ready ? m.send : m.need}
              </a>
              <p className="mt-2.5 text-center text-[13px] leading-snug text-ink-3">{m.fine}</p>
            </div>
          </div>
        </motion.div>

        <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-line bg-panel">
            <div className="aspect-[4/3] bg-bg-2">
              <img src={SITE.visit.img} alt={SITE.visit.alt} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <p className="flex gap-2.5 p-5 text-[15px] leading-snug text-ink-2">
              <MapPin size={18} weight="fill" className="mt-0.5 shrink-0 text-accent" />
              {bi(SITE.visit.address, lang)}
            </p>
          </div>
          {dishes.length > 0 && (
            <div>
              <p className={LABEL}>{m.popular.toUpperCase()}</p>
              <div className="flex flex-wrap gap-2">
                {dishes.map((d) => (
                  <span key={d.name.en} className="rounded-full border border-line px-3.5 py-2 text-[14px] text-ink-2">
                    {bi(d.name, lang)}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[13px] text-ink-3">{t.reviews}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/** Replaces the old order box on the home page: a short pitch that opens the booking page. */
export function BookCta({ lang, reduced, index, go }: { lang: Lang; reduced: boolean; index: string; go: (p: string) => void }) {
  const m = BOOK[lang];
  return (
    <section className="py-20 lg:py-28">
      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-8">
        <Heading index={index} title={m.cta} body={m.homeBody} reduced={reduced} />
        <Link to="/book" go={go} className="mt-10 inline-flex items-center gap-2.5 rounded-full bg-accent px-7 py-4 text-[17px] font-semibold text-on-accent transition-transform active:scale-[0.98]">
          <CalendarCheck size={20} weight="bold" />
          {m.cta}
          <ArrowRight size={18} weight="bold" />
        </Link>
      </div>
    </section>
  );
}
