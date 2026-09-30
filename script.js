/* ============ ROBERTODIAZ Portfolio interactions ============ */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const seen = document.documentElement.classList.contains("seen");
  const introMs = seen ? 100 : 950; // keep in sync with --intro in styles.css

  /* ---------- preloader ---------- */
  const preloader = document.getElementById("preloader");
  if (preloader) {
    if (reduceMotion || seen) preloader.classList.add("gone");
    else setTimeout(() => preloader.classList.add("gone"), 1500);
  }

  /* lets :active styles fire on iOS taps */
  document.addEventListener("touchstart", () => {}, { passive: true });

  /* ---------- roll-hover labels ---------- */
  document.querySelectorAll(".roll-btn").forEach((btn) => {
    const label = btn.textContent.trim();
    btn.innerHTML = `<span class="roll"><span>${label}</span><span aria-hidden="true">${label}</span></span>`;
  });

  /* ---------- split-word headline reveal (wraps each word for a per-word rise) ---------- */
  const splitWords = (el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let n;
    while ((n = walker.nextNode())) textNodes.push(n);
    let wordIndex = 0;
    textNodes.forEach((node) => {
      const parts = node.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      parts.forEach((part) => {
        if (part.trim() === "") { frag.appendChild(document.createTextNode(part)); return; }
        const outer = document.createElement("span");
        outer.className = "word";
        const inner = document.createElement("span");
        inner.className = "word-inner";
        inner.textContent = part;
        inner.style.transitionDelay = wordIndex * 0.045 + "s";
        wordIndex++;
        outer.appendChild(inner);
        frag.appendChild(outer);
      });
      node.parentNode.replaceChild(frag, node);
    });
  };
  document.querySelectorAll(".split-reveal").forEach(splitWords);

  /* ---------- reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add("in"); revealObserver.unobserve(e.target); }
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
  document.querySelectorAll(".reveal, .split-reveal").forEach((el) => revealObserver.observe(el));

  /* ---------- counters ---------- */
  // The final value is already in the HTML; this only animates up to it and
  // always lands on it, even if rAF gets throttled (background tab, low power).
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const runCounter = (el, delay) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const finalText = target + suffix;
    if (reduceMotion) { el.textContent = finalText; return; }
    setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / 1400, 1);
        el.textContent = Math.round(target * easeOut(p)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      el.textContent = "0" + suffix;
      requestAnimationFrame(tick);
      setTimeout(() => { el.textContent = finalText; }, 1600);
    }, delay);
  };
  const counterObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      // hero stat waits for its pop-in so the count is actually seen
      runCounter(e.target, e.target.closest(".hero") ? introMs + 700 : 0);
      counterObserver.unobserve(e.target);
    }
  }, { threshold: 0.4 });
  document.querySelectorAll("[data-count]").forEach((el) => counterObserver.observe(el));

  /* ---------- hero parallax (desktop mouse only; starts after the intro) ---------- */
  const hero = document.querySelector(".hero");
  if (!reduceMotion && finePointer && hero) {
    const depthEls = [...document.querySelectorAll("[data-depth]")];
    let mx = 0, my = 0, tx = 0, ty = 0, raf = 0, started = false, heroVisible = true;
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left - r.width / 2) / r.width;
      ty = (e.clientY - r.top - r.height / 2) / r.height;
    });
    hero.addEventListener("mouseleave", () => { tx = 0; ty = 0; });
    const loop = () => {
      raf = 0;
      if (window.innerWidth <= 1024) { depthEls.forEach((el) => { el.style.transform = ""; }); return; }
      if (!heroVisible) return;
      mx += (tx - mx) * 0.06;
      my += (ty - my) * 0.06;
      const sy = window.scrollY;
      for (const el of depthEls) {
        const d = parseFloat(el.dataset.depth);
        const baseX = el.classList.contains("hero-giant") ? "-50%" : "0px";
        el.style.transform = `translate(calc(${baseX} + ${mx * d * 200}px), ${sy * d + my * d * 120}px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (started && !raf) raf = requestAnimationFrame(loop); };
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; kick(); }).observe(hero);
    window.addEventListener("resize", kick);
    setTimeout(() => { started = true; kick(); }, introMs + 1500);
  }

  /* ---------- premium glow: spotlight + light ring that follows mouse or finger ---------- */
  document.querySelectorAll("[data-glow]").forEach((el) => {
    let offTimer;
    const setPos = (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", e.clientX - r.left + "px");
      el.style.setProperty("--my", e.clientY - r.top + "px");
    };
    const light = (e) => { setPos(e); clearTimeout(offTimer); el.classList.add("is-lit"); };
    el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") light(e); });
    el.addEventListener("pointermove", setPos);
    el.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") el.classList.remove("is-lit"); });
    // touch: bloom where the finger lands, then fade out after release (or when a scroll takes over)
    el.addEventListener("pointerdown", light);
    const release = (e) => {
      if (e.pointerType === "mouse") return;
      clearTimeout(offTimer);
      offTimer = setTimeout(() => el.classList.remove("is-lit"), 700);
    };
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
  });

  /* ---------- tilt (desktop) ---------- */
  if (!reduceMotion && finePointer) {
    document.querySelectorAll(".tilt").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${py * -4}deg) rotateY(${px * 5}deg) translateY(-3px)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------- about flip cards: hover flips on desktop, tap flips on touch, Enter/Space for keyboard ---------- */
  document.querySelectorAll(".flip").forEach((card) => {
    const toggle = () => {
      const on = card.classList.toggle("flipped");
      card.setAttribute("aria-pressed", on ? "true" : "false");
    };
    card.addEventListener("click", () => { if (!finePointer) toggle(); });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });

  /* ---------- sidebar slides in after the hero ---------- */
  const sidebar = document.getElementById("sidebar");
  if (sidebar && hero) {
    const onSideScroll = () => {
      sidebar.classList.toggle("show", window.scrollY > hero.offsetHeight * 0.55);
    };
    onSideScroll();
    window.addEventListener("scroll", onSideScroll, { passive: true });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-q");
    q.addEventListener("click", () => {
      const wasOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach((o) => {
        o.classList.remove("open");
        o.querySelector(".faq-q").setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) { item.classList.add("open"); q.setAttribute("aria-expanded", "true"); }
    });
  });

  /* ---------- copy email ---------- */
  const toast = document.getElementById("toast");
  let toastTimer;
  const copyEmail = () => {
    navigator.clipboard?.writeText("hi@robertodiaz.co").then(() => {
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
    });
  };
  document.getElementById("copyEmail")?.addEventListener("click", copyEmail);
  document.getElementById("copyEmail2")?.addEventListener("click", copyEmail);

  /* ---------- scroll progress bar ---------- */
  const progressBar = document.querySelector("#scrollProgress i");
  if (progressBar) {
    const onProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      progressBar.style.width = pct + "%";
    };
    onProgress();
    window.addEventListener("scroll", onProgress, { passive: true });
    window.addEventListener("resize", onProgress);
  }

  /* ---------- hero cursor glow ---------- */
  if (!reduceMotion && hero && finePointer) {
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--gx", ((e.clientX - r.left) / r.width) * 100 + "%");
      hero.style.setProperty("--gy", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  }

  /* ---------- magnetic buttons (desktop) ---------- */
  if (!reduceMotion && finePointer) {
    document.querySelectorAll(".btn-yellow").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) * 0.25;
        const dy = (e.clientY - r.top - r.height / 2) * 0.25;
        btn.style.transform = `translate(${dx}px, ${dy - 2}px)`;
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---------- back to top ---------- */
  const toTop = document.getElementById("toTop");
  if (toTop) {
    const onTopScroll = () => toTop.classList.toggle("show", window.scrollY > 900);
    onTopScroll();
    window.addEventListener("scroll", onTopScroll, { passive: true });
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "instant" : "smooth" }));
  }

  /* ---------- active nav on scroll ---------- */
  const links = [...document.querySelectorAll(".side-link")];
  const sections = links
    .map((l) => document.querySelector(l.getAttribute("href")))
    .filter(Boolean);
  const navObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id));
      }
    }
  }, { rootMargin: "-40% 0px -55% 0px" });
  sections.forEach((s) => navObserver.observe(s));
})();
