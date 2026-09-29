/**
 * Progressive-enhancement effects driven by data attributes. No dependencies.
 * - [data-reveal]            fade/slide in when scrolled into view (delay via style="--d:120ms")
 * - [data-count="500"]       count up when visible (data-decimals, data-prefix, data-suffix)
 * - [data-rotate='["a","b"]'] cycle words in place
 * - [data-cycle]             show one child at a time (live notification stack)
 * - [data-tilt]              3D tilt that flattens as the element scrolls up
 * - [data-story]             scroll story: activates [data-step] nearest the centre and
 *                            mirrors its data-time / data-label into [data-story-clock] / [data-story-label]
 * Returns a cleanup function. Safe to call repeatedly (e.g. after client-side navigation).
 */
export function initEffects(root: ParentNode = document): () => void {
  const html = document.documentElement;
  html.classList.add("fx");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cleanups: Array<() => void> = [];
  const bound = (el: Element, key: string) => {
    const k = "fx" + key;
    if ((el as HTMLElement).dataset[k]) return true;
    (el as HTMLElement).dataset[k] = "1";
    return false;
  };

  // Reveal
  const revealIO = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          revealIO.unobserve(e.target);
        }
      }),
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
  );
  let pending = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
  pending.forEach((el) => {
    if (reduce) el.classList.add("is-in");
    else revealIO.observe(el);
  });
  // Backstop for cases the observer misses (elements shown after being hidden, fast jumps):
  // reveal anything that is on screen whenever the page scrolls, resizes, or changes route.
  let revealRaf = 0;
  const checkReveal = () => {
    revealRaf = 0;
    const vh = window.innerHeight;
    pending = pending.filter((el) => {
      if (el.classList.contains("is-in")) return false;
      const r = el.getBoundingClientRect();
      if (r.height && r.top < vh * 0.92 && r.bottom > 0) {
        el.classList.add("is-in");
        return false;
      }
      return true;
    });
  };
  const queueReveal = () => {
    if (!revealRaf && pending.length) revealRaf = requestAnimationFrame(checkReveal);
  };
  if (!reduce) {
    queueReveal();
    window.addEventListener("scroll", queueReveal, { passive: true });
    window.addEventListener("resize", queueReveal);
    window.addEventListener("hashchange", queueReveal);
  }
  cleanups.push(() => {
    revealIO.disconnect();
    window.removeEventListener("scroll", queueReveal);
    window.removeEventListener("resize", queueReveal);
    window.removeEventListener("hashchange", queueReveal);
  });

  // Counters
  const countIO = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        countIO.unobserve(e.target);
        const el = e.target as HTMLElement;
        const end = parseFloat(el.dataset.count || "0");
        const dec = parseInt(el.dataset.decimals || "0", 10);
        const pre = el.dataset.prefix || "";
        const suf = el.dataset.suffix || "";
        const fmt = (v: number) => pre + v.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
        if (reduce) return void (el.textContent = fmt(end));
        const t0 = performance.now();
        const dur = 1600;
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          el.textContent = fmt(end * (1 - Math.pow(1 - p, 4)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    { threshold: 0.4 }
  );
  root.querySelectorAll("[data-count]").forEach((el) => {
    if (!bound(el, "Count")) countIO.observe(el);
  });
  cleanups.push(() => countIO.disconnect());

  // Rotating words
  root.querySelectorAll<HTMLElement>("[data-rotate]").forEach((el) => {
    if (reduce || bound(el, "Rotate")) return;
    let words: string[] = [];
    try {
      words = JSON.parse(el.dataset.rotate || "[]");
    } catch {
      return;
    }
    if (words.length < 2) return;
    let i = 0;
    const id = window.setInterval(() => {
      el.classList.add("is-out");
      window.setTimeout(() => {
        i = (i + 1) % words.length;
        el.textContent = words[i];
        el.classList.remove("is-out");
      }, 350);
    }, 2600);
    cleanups.push(() => {
      window.clearInterval(id);
      delete el.dataset.fxRotate;
    });
  });

  // Cycling stack
  root.querySelectorAll<HTMLElement>("[data-cycle]").forEach((el) => {
    if (bound(el, "Cycle")) return;
    const kids = Array.from(el.children);
    if (!kids.length) return;
    let i = 0;
    kids.forEach((k, j) => k.classList.toggle("is-on", j === 0));
    if (reduce) return;
    const id = window.setInterval(() => {
      i = (i + 1) % kids.length;
      kids.forEach((k, j) => k.classList.toggle("is-on", j === i));
    }, parseInt(el.dataset.cycle || "2800", 10) || 2800);
    cleanups.push(() => {
      window.clearInterval(id);
      delete el.dataset.fxCycle;
    });
  });

  // Tilt on scroll
  const tilts = Array.from(root.querySelectorAll<HTMLElement>("[data-tilt]"));
  if (tilts.length && !reduce) {
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      tilts.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.height) return;
        const p = Math.min(1, Math.max(0, (vh * 0.95 - r.top) / (vh * 0.6)));
        const deg = parseFloat(el.dataset.tilt || "18") * (1 - p);
        el.style.transform = `perspective(1800px) rotateX(${deg.toFixed(2)}deg) scale(${(0.94 + 0.06 * p).toFixed(3)})`;
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // re-run when a hidden page becomes visible (preview router)
    window.addEventListener("hashchange", onScroll);
    cleanups.push(() => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("hashchange", onScroll);
    });
  }

  // Day story
  root.querySelectorAll<HTMLElement>("[data-story]").forEach((story) => {
    const steps = Array.from(story.querySelectorAll<HTMLElement>("[data-step]"));
    const clock = story.querySelector<HTMLElement>("[data-story-clock]");
    const label = story.querySelector<HTMLElement>("[data-story-label]");
    const bar = story.querySelector<HTMLElement>("[data-story-bar]");
    const activate = (el: HTMLElement) => {
      steps.forEach((s) => s.classList.toggle("is-active", s === el));
      if (clock && el.dataset.time) clock.textContent = el.dataset.time;
      if (label && el.dataset.label) label.textContent = el.dataset.label;
      if (bar) bar.style.height = `${((steps.indexOf(el) + 1) / steps.length) * 100}%`;
    };
    if (steps[0]) activate(steps[0]);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && activate(e.target as HTMLElement)),
      { rootMargin: "-45% 0px -45% 0px" }
    );
    steps.forEach((s) => io.observe(s));
    cleanups.push(() => io.disconnect());
  });

  return () => cleanups.forEach((c) => c());
}
