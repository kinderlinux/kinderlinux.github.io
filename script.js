(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // clock + year
  const clock = $("#localClock");
  const tick = () => {
    if (clock) clock.textContent = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  };
  tick();
  setInterval(tick, 30000);
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  // scroll progress
  const progress = $("#progressBar");
  const onScroll = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // reveal on scroll
  const revealables = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });
    revealables.forEach((el) => revealObserver.observe(el));
  }

  // hero word cycle
  const wordEl = $(".hero__accent");
  if (wordEl && !reduceMotion) {
    const words = (wordEl.dataset.words || wordEl.textContent).split(",");
    let index = 0;
    setInterval(() => {
      wordEl.style.opacity = "0";
      setTimeout(() => {
        index = (index + 1) % words.length;
        wordEl.textContent = words[index].trim();
        wordEl.style.opacity = "1";
      }, 320);
    }, 3200);
    wordEl.style.transition = "opacity .3s";
  }

  // project filters
  const filters = $$(".filter");
  const cards = $$(".card[data-cat]");
  const empty = $("#filterEmpty");
  filters.forEach((btn) => btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;
    filters.forEach((b) => {
      const active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    let shown = 0;
    cards.forEach((card) => {
      const visible = filter === "all" || card.dataset.cat === filter;
      card.classList.toggle("is-hidden", !visible);
      if (visible) shown++;
    });
    if (empty) empty.hidden = shown > 0;
  }));

  // mobile nav
  const menuBtn = $("#menuBtn");
  const nav = $("#siteNav");
  menuBtn?.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");
  });
  nav?.addEventListener("click", (e) => {
    if (!e.target.closest("a")) return;
    nav.classList.remove("is-open");
    menuBtn?.setAttribute("aria-expanded", "false");
  });

  // active nav link
  const navLinks = $$(".nav a");
  if (navLinks.length && "IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.toggle("is-current", link.getAttribute("href") === `#${entry.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50%" });
    ["projeler", "yigin", "iletisim"].forEach((id) => {
      const section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
  }

  // one clock drives every orbit so a label stays upright at any tilt/speed, even after a hop
  const orbitEls = $$(".orbit3d");
  if (!reduceMotion && orbitEls.length) {
    const rings = orbitEls.map((el) => {
      const cs = getComputedStyle(el);
      const dur = parseFloat(cs.getPropertyValue("--dur")) * 1000;
      return {
        el, dur,
        dir: cs.getPropertyValue("--dir").trim() === "reverse" ? -1 : 1,
        angle: parseFloat(cs.getPropertyValue("--delay")) * -360 / (dur / 1000),
      };
    });
    let last = performance.now();
    const frame = (now) => {
      const dt = now - last; last = now;
      rings.forEach((r) => {
        r.angle = (r.angle + r.dir * 360 * dt / r.dur) % 360;
        r.el.style.setProperty("--spin", `${r.angle}deg`);
      });
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  // labels hop between orbits
  const orbits = $$(".orbit3d__spin");
  if (orbits.length > 1 && !reduceMotion) {
    const spread = () => orbits.forEach((ring, ri) => {
      ring.querySelectorAll(".orbit3d__slot").forEach((slot, i, all) => {
        slot.style.setProperty("--angle", `${(i * 360 / all.length + (ri + 1) * 31) % 360}deg`);
      });
    });
    setInterval(() => {
      const from = orbits[Math.floor(Math.random() * orbits.length)];
      const to = orbits[Math.floor(Math.random() * orbits.length)];
      const slots = from.querySelectorAll(".orbit3d__slot");
      if (from === to || !slots.length) return;
      to.appendChild(slots[Math.floor(Math.random() * slots.length)]);
      spread();
    }, 5000);
  }

  // cursor glow + card tilt (pointer devices only)
  if (matchMedia("(pointer: fine)").matches && !reduceMotion) {
    const glow = $(".cursor-glow");
    const rootZoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    addEventListener("pointermove", (e) => {
      if (glow) {
        glow.style.left = `${e.clientX / rootZoom}px`;
        glow.style.top = `${e.clientY / rootZoom}px`;
      }
    }, { passive: true });

    cards.forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-8px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }
})();
