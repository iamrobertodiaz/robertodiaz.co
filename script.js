/* ============ ROBERTODIAZ Portfolio interactions ============ */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- preloader ---------- */
  const preloader = document.getElementById("preloader");
  if (preloader) {
    if (reduceMotion) preloader.classList.add("gone");
    else setTimeout(() => preloader.classList.add("gone"), 2400);
  }

  /* ---------- roll-hover labels ---------- */
  document.querySelectorAll(".roll-btn").forEach((btn) => {
    const label = btn.textContent.trim();
    btn.innerHTML = `<span class="roll"><span>${label}</span><span>${label}</span></span>`;
  });

  /* ---------- reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add("in"); revealObserver.unobserve(e.target); }
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  /* ---------- counters ---------- */
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / 1500, 1);
      el.textContent = Math.round(target * easeOut(p)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counterObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { runCounter(e.target); counterObserver.unobserve(e.target); }
    }
  }, { threshold: 0.4 });
  document.querySelectorAll("[data-count]").forEach((el) => counterObserver.observe(el));

  /* ---------- hero parallax (starts after intro finishes) ---------- */
  const hero = document.querySelector(".hero");
  const depthEls = [...document.querySelectorAll("[data-depth]")];
  let mx = 0, my = 0, tx = 0, ty = 0;
  if (!reduceMotion && hero) {
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left - r.width / 2) / r.width;
      ty = (e.clientY - r.top - r.height / 2) / r.height;
    });
    hero.addEventListener("mouseleave", () => { tx = 0; ty = 0; });
    const loop = () => {
      mx += (tx - mx) * 0.06;
      my += (ty - my) * 0.06;
      const sy = window.scrollY;
      for (const el of depthEls) {
        const d = parseFloat(el.dataset.depth);
        const baseX = el.classList.contains("hero-giant") ? "-50%" : "0px";
        el.style.transform = `translate(calc(${baseX} + ${mx * d * 200}px), ${sy * d + my * d * 120}px)`;
      }
      requestAnimationFrame(loop);
    };
    setTimeout(() => requestAnimationFrame(loop), 3000);
  }

  /* ---------- tilt ---------- */
  if (!reduceMotion && matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".tilt").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${py * -5}deg) rotateY(${px * 7}deg) translateY(-3px)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------- about flip cards (tap support for touch) ---------- */
  document.querySelectorAll(".flip").forEach((card) => {
    card.addEventListener("click", () => card.classList.toggle("flipped"));
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
    item.querySelector(".faq-q").addEventListener("click", () => {
      const wasOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach((o) => o.classList.remove("open"));
      if (!wasOpen) item.classList.add("open");
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
