/* Домашние финансы — landing behaviour.
   Everything degrades gracefully: without JS the chart, counters and
   budget bars stay readable, and the page works as plain HTML. */

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- money counter ---------------------------------- */

  const counter = document.querySelector("[data-count]");
  if (counter) {
    const target = parseFloat(counter.dataset.count || "0");
    const format = new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    if (reduceMotion || !target) {
      counter.textContent = format.format(target) + " ₽";
    } else {
      const duration = 1200;
      const delay = 420;
      const start = performance.now() + delay;

      const tick = (now) => {
        const t = Math.min(Math.max((now - start) / duration, 0), 1);
        const eased = 1 - Math.pow(1 - t, 3);
        counter.textContent = format.format(target * eased) + " ₽";
        if (t < 1) requestAnimationFrame(tick);
        else counter.textContent = format.format(target) + " ₽";
      };
      requestAnimationFrame(tick);
    }
  }

  /* ---------- donut draw-in ----------------------------------- */

  const segments = Array.from(document.querySelectorAll(".seg"));

  segments.forEach((seg, index) => {
    const share = parseFloat(seg.dataset.share || "0");
    const offset = parseFloat(seg.dataset.offset || "0");
    const length = Math.max(share - 1.2, 0.8);

    const setLength = (value) => {
      seg.style.strokeDasharray = `${value.toFixed(3)} 100`;
      seg.style.strokeDashoffset = String(offset);
    };

    if (reduceMotion) {
      setLength(length);
      return;
    }

    setLength(0);
    window.setTimeout(() => {
      const startedAt = performance.now();
      const duration = 880;
      const frame = (now) => {
        const t = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setLength(length * eased);
        if (t < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }, 220 + index * 95);
  });

  /* ---------- hover a legend row, highlight its segment -------- */

  const donut = document.querySelector(".donut");
  const legendItems = Array.from(document.querySelectorAll(".legend li"));

  legendItems.forEach((item) => {
    const index = Number(item.dataset.key);
    const highlight = () => {
      if (!donut) return;
      donut.classList.add("is-focused");
      segments.forEach((seg, i) => seg.classList.toggle("is-active", i === index));
    };
    const clear = () => {
      if (!donut) return;
      donut.classList.remove("is-focused");
      segments.forEach((seg) => seg.classList.remove("is-active"));
    };
    item.addEventListener("pointerenter", highlight);
    item.addEventListener("pointerleave", clear);
  });

  /* ---------- budget bars ------------------------------------- */

  const bars = Array.from(document.querySelectorAll(".bar-fill"));
  if (bars.length) {
    bars.forEach((bar) => bar.style.setProperty("--fill", "0%"));

    if (reduceMotion || !("IntersectionObserver" in window)) {
      bars.forEach((bar) => bar.style.setProperty("--fill", `${bar.dataset.fill}%`));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const bar = entry.target;
            observer.unobserve(bar);
            bar.classList.add("is-animated");
            requestAnimationFrame(() => {
              bar.style.setProperty("--fill", `${bar.dataset.fill}%`);
            });
          });
        },
        { threshold: 0.4 }
      );
      bars.forEach((bar) => observer.observe(bar));
    }
  }

  /* ---------- screenshot gallery ------------------------------ */

  const gallery = document.querySelector(".gallery");
  const navButtons = Array.from(document.querySelectorAll(".gallery-nav [data-dir]"));

  if (gallery && navButtons.length) {
    const step = () => Math.max(gallery.clientWidth * 0.8, 240);

    navButtons.forEach((button) => {
      button.addEventListener("click", () => {
        gallery.scrollBy({
          left: Number(button.dataset.dir) * step(),
          behavior: reduceMotion ? "auto" : "smooth",
        });
      });
    });

    const syncButtons = () => {
      const max = gallery.scrollWidth - gallery.clientWidth - 2;
      navButtons.forEach((button) => {
        const dir = Number(button.dataset.dir);
        button.disabled = dir < 0 ? gallery.scrollLeft <= 2 : gallery.scrollLeft >= max;
        button.style.opacity = button.disabled ? "0.4" : "";
        button.style.cursor = button.disabled ? "default" : "";
      });
    };

    gallery.addEventListener("scroll", syncButtons, { passive: true });
    window.addEventListener("resize", syncButtons);
    syncButtons();
  }

  /* ---------- sticky download bar on phones ------------------- */

  const mobileBar = document.getElementById("mobileBar");
  if (mobileBar) {
    const footer = document.querySelector(".site-footer");
    const updateBar = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.75;
      const footerVisible = footer
        ? footer.getBoundingClientRect().top < window.innerHeight - 40
        : false;
      mobileBar.classList.toggle("is-visible", pastHero && !footerVisible);
    };
    updateBar();
    window.addEventListener("scroll", updateBar, { passive: true });
    window.addEventListener("resize", updateBar);
  }
})();
