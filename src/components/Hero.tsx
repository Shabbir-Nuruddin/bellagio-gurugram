import { Fragment, useEffect, useRef, useState, type PointerEvent } from "react";
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { SITE } from "../content";
import { UI, bi, fmtHour, type Lang } from "../lib";
import { CallButton, DirectionsButton, EASE, Stars, WaButton } from "./ui";

const HOLD = 5200;
const CREAM = "#fbf7f1";

/** Cinematic hero: the restaurant's real photos fill the whole screen and tilt in 3D with the
 *  pointer; the headline flips up word by word straight on the photo, then sinks back into
 *  the screen as you scroll. */
export function Hero({ lang, reduced, open, wa }: { lang: Lang; reduced: boolean; open: { open: boolean; at: number }; wa: string }) {
  const t = UI[lang];
  const slides = SITE.hero.slides?.length ? SITE.hero.slides : [SITE.hero.backdrop ?? SITE.hero.fallback];
  const [i, setI] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const rv = SITE.reviews;
  const total = rv.dist.reduce((x, y) => x + y, 0);
  const allday = SITE.hours.every((h) => h[0] === 0 && h[1] === 24);
  const pad = (n: number) => String(n).padStart(2, "0");

  // pointer depth: photo and type move against each other
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const photoRY = useTransform(sx, [-0.5, 0.5], [3.5, -3.5]);
  const photoRX = useTransform(sy, [-0.5, 0.5], [-2.5, 2.5]);
  const photoX = useTransform(sx, [-0.5, 0.5], ["-1.5%", "1.5%"]);
  const typeX = useTransform(sx, [-0.5, 0.5], [22, -22]);
  const typeY = useTransform(sy, [-0.5, 0.5], [14, -14]);

  // scroll: photo pushes in, headline tips back into the screen
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const photoS = useTransform(scrollYProgress, [0, 1], [1.12, 1.32]);
  const tipX = useTransform(scrollYProgress, [0, 0.7], [0, 28]);
  const tipZ = useTransform(scrollYProgress, [0, 0.7], [0, -220]);
  const fade = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  useEffect(() => {
    if (reduced || slides.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % slides.length), HOLD);
    return () => clearInterval(id);
  }, [reduced, slides.length]);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (reduced || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const rise = (d: number) => ({
    initial: reduced ? false : ({ opacity: 0, y: 20 } as const),
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, ease: EASE, delay: 0.5 + d },
  });

  // each word flips up off its baseline like a card turning over
  const words = (s: string, base: number, outline = false) =>
    s.split(" ").map((w, n) => (
      <Fragment key={n}>
      {n > 0 && " "}
      <span className="inline-block [perspective:900px]">
        <motion.span
          className={`inline-block origin-bottom [backface-visibility:hidden] ${outline ? "[-webkit-text-stroke:1.5px_#fbf7f1]" : ""}`}
          initial={reduced ? false : { rotateX: -95, y: "35%", opacity: 0, ...(outline ? { color: "rgba(251,247,241,0)" } : {}) }}
          animate={{ rotateX: 0, y: "0%", opacity: 1, ...(outline ? { color: ["rgba(251,247,241,0)", "rgba(251,247,241,0)", CREAM] } : {}) }}
          transition={{
            duration: 1.15,
            ease: EASE,
            delay: base + n * 0.08,
            ...(outline ? { color: { duration: 2.4, times: [0, 0.55, 1], delay: base + n * 0.08 } } : {}),
          }}
        >
          {w}
        </motion.span>
      </span>
      </Fragment>
    ));

  return (
    <section
      id="top"
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative h-[100svh] min-h-[620px] overflow-hidden bg-[#0e0c0a] text-[#fbf7f1] [perspective:1400px]"
    >
      {/* photo stage */}
      <motion.div
        aria-hidden
        className="absolute inset-0 top-[var(--hdr,100px)] [transform-style:preserve-3d]"
        style={reduced ? undefined : { rotateX: photoRX, rotateY: photoRY, x: photoX, scale: photoS }}
      >
        <AnimatePresence initial={false}>
          <motion.img
            key={slides[i]}
            src={slides[i]}
            alt=""
            initial={reduced ? false : { opacity: 0, scale: 1.14 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.6, ease: "easeInOut" }, scale: { duration: (HOLD + 1800) / 1000, ease: "linear" } }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
      </motion.div>
      {/* flat tint for legibility */}
      <div aria-hidden className="absolute inset-0 top-[var(--hdr,100px)] bg-[#0e0c0a]/50" />
      {/* opening curtain */}
      {!reduced && (
        <motion.div
          aria-hidden
          className="absolute inset-0 top-[var(--hdr,100px)] origin-top bg-[#0e0c0a]"
          initial={{ scaleY: 1 }}
          animate={{ scaleY: 0 }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.05 }}
        />
      )}

      {/* type layer */}
      <motion.div
        className="relative mx-auto flex h-full max-w-[1400px] flex-col px-4 pb-28 pt-[calc(var(--hdr,100px)+1.5rem)] sm:px-8 md:pb-10"
        style={reduced ? undefined : { x: typeX, y: typeY, rotateX: tipX, z: tipZ, opacity: fade }}
      >
        <motion.p {...rise(0)} className="flex items-center gap-2.5 text-[15px] font-medium text-[#fbf7f1]/85">
          <span className={`live-dot relative inline-block h-2 w-2 rounded-full ${open.open ? "bg-[#3ddc84] text-[#3ddc84]" : "bg-[#fbf7f1]/50 text-[#fbf7f1]/50"}`} />
          {allday ? t.allday : open.open ? t.open(fmtHour(open.at)) : t.closed(fmtHour(open.at))}
        </motion.p>

        <div className="mt-auto">
          <h1 className="max-w-[16ch] font-display text-[clamp(2.9rem,8.2vw,8rem)] leading-[0.92] tracking-[-0.025em] [text-shadow:0_2px_30px_rgba(14,12,10,0.35)]">
            <span className="block [text-wrap:balance]">{words(bi(SITE.hero.title[0], lang), 0.45)}</span>
            <span className="block [text-wrap:balance]">{words(bi(SITE.hero.title[1], lang), 0.7, true)}</span>
          </h1>
          <motion.p {...rise(0.55)} className="mt-6 max-w-[48ch] text-[17px] leading-relaxed text-[#fbf7f1]/85 [text-wrap:pretty] md:text-[19px]">
            {bi(SITE.hero.proof, lang)}
          </motion.p>
          <motion.div {...rise(0.65)} className="mt-8 hidden flex-wrap gap-3 md:flex">
            <CallButton label={t.call} />
            <WaButton label={t.whatsapp} text={wa} className="!border-[#fbf7f1]/40 !text-[#fbf7f1] hover:!border-wa hover:!text-[#062a14]" />
            <DirectionsButton label={t.directions} className="!border-[#fbf7f1]/40 !text-[#fbf7f1]/85 hover:!border-[#fbf7f1] hover:!text-[#fbf7f1]" />
          </motion.div>

          <motion.div {...rise(0.8)} className="mt-10 flex items-end justify-between gap-6 border-t border-[#fbf7f1]/25 pt-5">
            <div className="flex items-center gap-3">
              <span className="font-display text-[30px] leading-none tabular-nums">{rv.rating}</span>
              <span>
                <Stars n={5} size={14} />
                <span className="mt-1 block text-[13px] text-[#fbf7f1]/75">{total} Google reviews</span>
              </span>
            </div>
            {slides.length > 1 && (
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium tabular-nums text-[#fbf7f1]/75">
                  {pad(i + 1)} / {pad(slides.length)}
                </span>
                <div className="flex gap-1">
                  {slides.map((s, n) => (
                    <button key={s} onClick={() => setI(n)} aria-label={`Photo ${n + 1}`} className="py-2">
                      <span className="relative block h-[2px] w-7 overflow-hidden bg-[#fbf7f1]/25">
                        {n === i && (
                          <motion.span
                            key={i}
                            className="absolute inset-y-0 left-0 bg-[#fbf7f1]"
                            initial={{ width: reduced ? "100%" : "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: reduced ? 0 : HOLD / 1000, ease: "linear" }}
                          />
                        )}
                        {n < i && <span className="absolute inset-0 bg-[#fbf7f1]/70" />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
