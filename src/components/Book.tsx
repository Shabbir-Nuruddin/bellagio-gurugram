import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CheckCircle, Crown, DownloadSimple, FilePdf, Minus, Plus, SpinnerGap } from "@phosphor-icons/react";
import { useMemo, useState, type FormEvent, type MouseEvent } from "react";
import { SITE } from "../content";
import { bi, fmtHour, type Lang } from "../lib";
import { EASE, Heading } from "./ui";

/*
 * VIP Reservation: a request form that goes straight to the restaurant's inbox, plus the
 * downloadable menu. Requests are sent through FormSubmit; set RESERVE_TO to the inbox that
 * should receive them (FormSubmit emails that inbox once to activate). Left empty, the form
 * runs in preview mode and only shows the confirmation.
 */
export const RESERVE_TO = "";
export const MENU_PDF = "/bellagio-menu.pdf";

export const BOOK = {
  en: {
    cta: "VIP Reservation",
    short: "Reserve",
    kicker: "Reserve your table",
    title: "VIP Reservation",
    body: "Tell us when you're coming and how many of you. Our team calls you back to confirm your table, usually within the hour.",
    people: "Guests",
    day: "Date",
    today: "Today",
    tomorrow: "Tomorrow",
    time: "Time",
    pickTime: "Choose a time",
    seating: "Seating",
    seatings: ["Rooftop", "Indoor", "No preference"],
    occasion: "Occasion",
    occasions: ["Dinner", "Birthday", "Anniversary", "Date night", "Corporate", "Party"],
    name: "Name for the reservation",
    phone: "Mobile number",
    email: "Email (optional)",
    note: "Special requests: cake, decor, a table by the view…",
    send: "Request VIP reservation",
    sending: "Sending…",
    need: "Pick a date and time, then add your name and number",
    fine: "No payment needed. Your table is held once we confirm on call.",
    error: "Couldn't send right now. Please try again in a moment.",
    doneTitle: "Request received",
    doneBody: (n: string) => `Thank you, ${n}. Bellagio will call you shortly to confirm your table.`,
    another: "Make another reservation",
    menuTitle: "The menu",
    menuShort: "Menu",
    menuBody: "Mezze and kebabs, wood-fired pizza, bao, small plates and a full bar. Download the full food and bar menu to browse before you arrive.",
    download: "Download menu (PDF)",
    view: "View menu",
    pages: "8 pages · food & bar",
    taxes: "Prices exclude taxes. 10% service charge.",
    picks: "From the menu",
  },
  hi: {
    cta: "VIP रिज़र्वेशन",
    short: "रिज़र्व",
    kicker: "अपनी टेबल रिज़र्व करें",
    title: "VIP रिज़र्वेशन",
    body: "बताइए कब आ रहे हैं और कितने लोग हैं। हमारी टीम कॉल करके आपकी टेबल कन्फ़र्म करेगी, आमतौर पर एक घंटे में।",
    people: "मेहमान",
    day: "तारीख",
    today: "आज",
    tomorrow: "कल",
    time: "समय",
    pickTime: "समय चुनिए",
    seating: "बैठने की जगह",
    seatings: ["रूफ़टॉप", "अंदर", "कोई भी"],
    occasion: "मौका",
    occasions: ["डिनर", "जन्मदिन", "सालगिरह", "डेट नाइट", "ऑफ़िस", "पार्टी"],
    name: "रिज़र्वेशन किसके नाम पर",
    phone: "मोबाइल नंबर",
    email: "ईमेल (ज़रूरी नहीं)",
    note: "खास इंतज़ाम: केक, सजावट, व्यू वाली टेबल…",
    send: "VIP रिज़र्वेशन भेजें",
    sending: "भेज रहे हैं…",
    need: "तारीख और समय चुनिए, फिर नाम और नंबर लिखिए",
    fine: "कोई पेमेंट नहीं। कॉल पर कन्फ़र्म होते ही टेबल आपकी।",
    error: "अभी भेज नहीं पाए। थोड़ी देर में फिर कोशिश करें।",
    doneTitle: "रिक्वेस्ट मिल गई",
    doneBody: (n: string) => `धन्यवाद, ${n}। Bellagio जल्द ही कॉल करके आपकी टेबल कन्फ़र्म करेगा।`,
    another: "एक और रिज़र्वेशन",
    menuTitle: "मेन्यू",
    menuShort: "मेन्यू",
    menuBody: "मेज़े और कबाब, वुड-फ़ायर्ड पिज़्ज़ा, बाओ, स्मॉल प्लेट्स और पूरा बार। आने से पहले पूरा फ़ूड और बार मेन्यू डाउनलोड करके देखिए।",
    download: "मेन्यू डाउनलोड करें (PDF)",
    view: "मेन्यू देखें",
    pages: "8 पेज · फ़ूड और बार",
    taxes: "दाम में टैक्स शामिल नहीं। 10% सर्विस चार्ज।",
    picks: "मेन्यू से",
  },
};

/** Signature items and prices read off the current printed menu. */
const PICKS: { name: string; tag: Record<Lang, string>; price: number }[] = [
  { name: "Mega Non Veg Mezze Platter", tag: { en: "To share", hi: "शेयर करने के लिए" }, price: 3295 },
  { name: "Adana Kebab", tag: { en: "Mediterranean", hi: "मेडिटेरेनियन" }, price: 875 },
  { name: "Yuzu Rock Shrimp Bao", tag: { en: "Bao", hi: "बाओ" }, price: 625 },
  { name: "Katsu Chicken Bao", tag: { en: "Bao", hi: "बाओ" }, price: 595 },
  { name: "Margherita Pizza", tag: { en: "Wood-fired", hi: "वुड-फ़ायर्ड" }, price: 525 },
  { name: "The Bellagio Spritzer", tag: { en: "House cocktail", hi: "हाउस कॉकटेल" }, price: 795 },
];
const THUMBS = ["/menu/food5.webp", "/menu/food4.webp", "/menu/bar5.webp"];

/** Half-hour slots the restaurant is open on a given date, as decimal hours. */
function slots(date: Date, isToday: boolean) {
  const [o, c] = SITE.hours[date.getDay()];
  if (o >= c) return [];
  const now = new Date();
  const from = isToday ? Math.max(o, Math.ceil((now.getHours() + now.getMinutes() / 60 + 0.5) * 2) / 2) : o;
  const out: number[] = [];
  for (let h = Math.ceil(from * 2) / 2; h <= c - 1; h += 0.5) out.push(h);
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

type Status = "idle" | "sending" | "done" | "error";

export function Vip({ lang, reduced, index }: { lang: Lang; reduced: boolean; index: string }) {
  const m = BOOK[lang];
  const locale = lang === "hi" ? "hi-IN" : "en-IN";
  const days = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return { d, slots: slots(d, i === 0) };
    }).filter((x) => x.slots.length > 0);
  }, []);

  const [people, setPeople] = useState(2);
  const [day, setDay] = useState<number | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [seat, setSeat] = useState(0);
  const [occ, setOcc] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const digits = phone.replace(/\D/g, "");
  const ready = day !== null && time !== null && name.trim().length > 1 && digits.length >= 10;
  const dayLabel = (d: Date) => {
    const diff = Math.round((d.getTime() - new Date(new Date().setHours(0, 0, 0, 0)).getTime()) / 864e5);
    return diff === 0 ? m.today : diff === 1 ? m.tomorrow : d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ready || status === "sending") return;
    const en = BOOK.en;
    const fields = {
      Name: name.trim(),
      Phone: phone.trim(),
      Email: email.trim() || "-",
      Guests: String(people),
      Date: days[day!].d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      Time: fmtHour(time!) + (time! >= 24 ? " (after midnight)" : ""),
      Seating: en.seatings[seat],
      Occasion: occ !== null ? en.occasions[occ] : "-",
      "Special requests": note.trim() || "-",
    };
    setStatus("sending");
    try {
      if (RESERVE_TO) {
        const res = await fetch(`https://formsubmit.co/ajax/${RESERVE_TO}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            ...fields,
            _subject: `VIP Reservation: ${fields.Name}, ${people} guests, ${fields.Date} ${fields.Time}`,
            _template: "table",
            _captcha: "false",
            ...(email.trim() ? { _replyto: email.trim() } : {}),
          }),
        });
        if (!res.ok) throw new Error(String(res.status));
      } else {
        await new Promise((r) => setTimeout(r, 700));
      }
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const reset = () => {
    setDay(null);
    setTime(null);
    setOcc(null);
    setNote("");
    setStatus("idle");
  };

  return (
    <section id="vip" className="scroll-mt-28 bg-bg-2 py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
          <div className="min-w-0 lg:sticky lg:top-32 lg:self-start">
            <Heading index={index} title={m.title} body={m.body} reduced={reduced} />
            <div className="mt-8 hidden overflow-hidden rounded-3xl lg:block">
              <img src={SITE.visit.img} alt={SITE.visit.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
            </div>
          </div>

          <div className="relative min-w-0 rounded-3xl border border-line bg-panel p-5 shadow-[0_30px_80px_-40px_rgba(31,58,104,0.35)] sm:p-8">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-[12px] font-semibold tracking-[0.16em] text-on-accent">
              <Crown size={15} weight="fill" />
              {m.kicker.toUpperCase()}
            </p>
            <AnimatePresence mode="wait" initial={false}>
              {status === "done" ? (
                <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: EASE }} className="py-6" aria-live="polite">
                  <CheckCircle size={52} weight="fill" className="text-accent" />
                  <h3 className="mt-5 font-display text-[clamp(2rem,4vw,2.8rem)] leading-none text-ink">{m.doneTitle}</h3>
                  <p className="mt-4 max-w-[44ch] text-[17px] leading-relaxed text-ink-2">{m.doneBody(name.trim())}</p>
                  <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-6 text-[15px] sm:grid-cols-4">
                    {[
                      [m.day, dayLabel(days[day!].d)],
                      [m.time, fmtHour(time!)],
                      [m.people, String(people)],
                      [m.seating, m.seatings[seat]],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-[12px] font-semibold tracking-[0.14em] text-ink-3">{k.toUpperCase()}</dt>
                        <dd className="mt-1 font-semibold text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <button type="button" onClick={reset} className="mt-8 text-[15px] font-semibold text-accent underline-offset-4 hover:underline">
                    {m.another}
                  </button>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                  <div className="grid gap-8 sm:grid-cols-[auto_1fr]">
                    <div>
                      <p className={LABEL}>{m.people.toUpperCase()}</p>
                      <span className="inline-flex items-center gap-2 rounded-full border border-line bg-bg p-1.5">
                        <button type="button" aria-label={`− ${m.people}`} onClick={() => setPeople((p) => Math.max(1, p - 1))} className="grid h-11 w-11 place-items-center rounded-full text-ink-2 hover:bg-line">
                          <Minus size={18} weight="bold" />
                        </button>
                        <span className="w-12 text-center font-display text-[30px] leading-none tabular-nums text-ink" aria-live="polite">
                          {people}
                        </span>
                        <button type="button" aria-label={`+ ${m.people}`} onClick={() => setPeople((p) => Math.min(80, p + 1))} className="grid h-11 w-11 place-items-center rounded-full bg-accent text-on-accent active:scale-90">
                          <Plus size={18} weight="bold" />
                        </button>
                      </span>
                    </div>
                    <div>
                      <p className={LABEL}>{m.seating.toUpperCase()}</p>
                      <div className="flex flex-wrap gap-2">
                        {m.seatings.map((s, i) => (
                          <button key={s} type="button" aria-pressed={seat === i} onClick={() => setSeat(i)} className={`${CHIP} ${seat === i ? ON : OFF}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className={LABEL}>{m.day.toUpperCase()}</p>
                    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-8 sm:px-8">
                      {days.map((x, i) => (
                        <button
                          key={i}
                          type="button"
                          aria-pressed={day === i}
                          onClick={() => {
                            setDay(i);
                            if (time !== null && !x.slots.includes(time)) setTime(null);
                          }}
                          className={`${CHIP} shrink-0 whitespace-nowrap ${day === i ? ON : OFF}`}
                        >
                          {dayLabel(x.d)}
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
                    <p className={LABEL}>{m.occasion.toUpperCase()}</p>
                    <div className="flex flex-wrap gap-2">
                      {m.occasions.map((o, i) => (
                        <button key={o} type="button" aria-pressed={occ === i} onClick={() => setOcc(occ === i ? null : i)} className={`${CHIP} ${occ === i ? ON : OFF}`}>
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <input className={`${FIELD} sm:col-span-2`} value={name} onChange={(e) => setName(e.target.value)} placeholder={m.name} aria-label={m.name} autoComplete="name" maxLength={60} required />
                    <input className={FIELD} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={m.phone} aria-label={m.phone} type="tel" inputMode="tel" autoComplete="tel" maxLength={16} required />
                    <input className={FIELD} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={m.email} aria-label={m.email} type="email" autoComplete="email" maxLength={80} />
                    <textarea className={`${FIELD} min-h-[96px] resize-none sm:col-span-2`} value={note} onChange={(e) => setNote(e.target.value)} placeholder={m.note} aria-label={m.note} maxLength={400} />
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={!ready || status === "sending"}
                      className={`flex w-full items-center justify-center gap-2.5 rounded-full py-4 text-[17px] font-semibold transition-transform active:scale-[0.98] ${ready ? "bg-accent text-on-accent" : "cursor-not-allowed bg-line text-ink-3"}`}
                    >
                      {status === "sending" ? <SpinnerGap size={20} weight="bold" className="animate-spin" /> : <Crown size={20} weight="fill" />}
                      {status === "sending" ? m.sending : ready ? m.send : m.need}
                    </button>
                    <p className={`mt-2.5 text-center text-[13px] leading-snug ${status === "error" ? "text-[#b42318]" : "text-ink-3"}`} role={status === "error" ? "alert" : undefined}>
                      {status === "error" ? m.error : m.fine}
                    </p>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Menu section: real signature items and prices, with the full menu as a downloadable PDF. */
export function Menu({ lang, reduced, index }: { lang: Lang; reduced: boolean; index: string }) {
  const m = BOOK[lang];
  return (
    <section id="menu" className="scroll-mt-28 py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-4 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
        <div>
          <Heading index={index} title={m.menuTitle} body={m.menuBody} reduced={reduced} />
          <div className="mt-8">
            <p className={LABEL}>{m.picks.toUpperCase()}</p>
            <ul className="divide-y divide-line border-y border-line">
              {PICKS.map((p) => (
                <li key={p.name} className="flex items-baseline justify-between gap-4 py-3.5">
                  <span>
                    <span className="block text-[17px] font-semibold text-ink">{p.name}</span>
                    <span className="text-[13px] text-ink-3">{p.tag[lang]}</span>
                  </span>
                  <span className="shrink-0 font-display text-[20px] tabular-nums text-ink">₹{p.price.toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] text-ink-3">{m.taxes}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={MENU_PDF} download="Bellagio-Gurugram-Menu.pdf" className="inline-flex items-center gap-2.5 rounded-full bg-accent px-7 py-4 text-[17px] font-semibold text-on-accent transition-transform hover:-translate-y-0.5 active:scale-[0.98]">
              <DownloadSimple size={20} weight="bold" />
              {m.download}
            </a>
            <a href={MENU_PDF} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 rounded-full border border-line px-6 py-4 text-[16px] font-semibold text-ink transition-colors hover:border-accent">
              {m.view}
              <ArrowRight size={18} weight="bold" />
            </a>
          </div>
        </div>

        <a href={MENU_PDF} target="_blank" rel="noreferrer" aria-label={m.view} className="group relative mx-auto block h-[440px] w-full max-w-[460px] sm:h-[520px]">
          {THUMBS.map((src, i) => (
            <motion.img
              key={src}
              src={src}
              alt=""
              loading="lazy"
              initial={reduced ? false : { opacity: 0, y: 40, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: [-7, 4, -1][i] }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.9, ease: EASE, delay: i * 0.12 }}
              className="absolute top-0 w-[62%] rounded-xl border border-line bg-white shadow-[0_24px_60px_-24px_rgba(14,12,10,0.45)] transition-transform duration-500 group-hover:-translate-y-2"
              style={{ left: `${[0, 19, 38][i]}%`, top: `${[6, 0, 10][i]}%`, zIndex: i }}
            />
          ))}
          <span className="absolute bottom-0 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-bg">
            <FilePdf size={16} weight="fill" />
            {m.pages}
          </span>
        </a>
      </div>
    </section>
  );
}
