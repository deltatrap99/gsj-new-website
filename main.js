/* Shared, dependency-free interactions for the GSJ static website. */
document.addEventListener("DOMContentLoaded", () => {
  const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
  const reducedMotion = () => motionPreference.matches;
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".reading-progress");
  const backTop = document.querySelector(".back-top");
  const drawer = document.querySelector("#site-menu");
  const menuToggle = document.querySelector(".menu-toggle");
  const menuClose = document.querySelector(".menu-close");
  let closing = false;
  let returnFocus = null;
  let closeTimer;

  function closeMenu() {
    if (!drawer?.open || closing) return;
    closing = true;
    menuToggle?.setAttribute("aria-expanded", "false");
    const finish = () => {
      clearTimeout(closeTimer);
      drawer.classList.remove("is-closing");
      drawer.close();
      closing = false;
      returnFocus?.focus({ preventScroll: true });
    };
    if (reducedMotion()) finish();
    else {
      drawer.classList.add("is-closing");
      closeTimer = setTimeout(finish, 300);
    }
  }
  menuToggle?.addEventListener("click", () => {
    if (drawer.open) {
      closeMenu();
      return;
    }
    returnFocus = document.activeElement;
    drawer.showModal();
    menuToggle.setAttribute("aria-expanded", "true");
    menuClose?.focus({ preventScroll: true });
  });
  menuClose?.addEventListener("click", closeMenu);
  drawer?.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const controls = [
      ...drawer.querySelectorAll("a[href], button:not([disabled])"),
    ];
    const first = controls[0];
    const last = controls.at(-1);
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        !drawer.contains(document.activeElement))
    ) {
      event.preventDefault();
      last?.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last ||
        !drawer.contains(document.activeElement))
    ) {
      event.preventDefault();
      first?.focus();
    }
  });
  drawer?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeMenu();
  });
  drawer?.addEventListener("click", (event) => {
    const rect = drawer.getBoundingClientRect();
    if (
      event.target === drawer &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    )
      closeMenu();
  });
  drawer
    ?.querySelectorAll("a")
    .forEach((link) => link.addEventListener("click", closeMenu));

  // One passive scroll listener drives header, progress and section tracking.
  const sectionNav = document.querySelector("[data-section-nav]");
  const sectionLinks = sectionNav
    ? [...sectionNav.querySelectorAll('a[href^="#"]')]
    : [];
  const sections = sectionLinks.map((link) =>
    document.getElementById(link.hash.slice(1)),
  );
  let activeSection = -1;
  let lastSidebarInteraction = -Infinity;
  let scrollFrame = 0;
  ["scroll", "pointerdown", "focusin"].forEach((type) =>
    sectionNav?.addEventListener(
      type,
      () => {
        lastSidebarInteraction = performance.now();
      },
      { passive: true },
    ),
  );
  function updateScroll() {
    scrollFrame = 0;
    const y = window.scrollY;
    header?.classList.toggle("scrolled", y > 8);
    const scrollRange =
      document.documentElement.scrollHeight - window.innerHeight;
    if (progress)
      progress.style.transform = `scaleX(${scrollRange > 0 ? Math.min(1, Math.max(0, y / scrollRange)) : 0})`;
    backTop?.classList.toggle("is-visible", y > 650);
    if (!sections.length) return;
    const mobile = window.innerWidth < 768;
    const threshold =
      (header?.offsetHeight || 80) +
      (mobile
        ? (document.querySelector(".section-sidebar")?.offsetHeight || 70) + 40
        : 84);
    let current = 0;
    sections.forEach((section, index) => {
      if (section && section.getBoundingClientRect().top <= threshold)
        current = index;
    });
    if (current === activeSection) return;
    activeSection = current;
    sectionLinks.forEach((link, index) => {
      if (index === current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    if (mobile && performance.now() - lastSidebarInteraction > 900) {
      const active = sectionLinks[current];
      const left = active.offsetLeft - sectionNav.offsetLeft;
      const right = left + active.offsetWidth;
      if (
        left < sectionNav.scrollLeft ||
        right > sectionNav.scrollLeft + sectionNav.clientWidth
      ) {
        sectionNav.scrollTo({
          left: Math.max(0, left - 16),
          behavior: reducedMotion() ? "instant" : "smooth",
        });
      }
    }
  }
  function scheduleScroll() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
  }
  addEventListener("scroll", scheduleScroll, { passive: true });
  addEventListener("resize", scheduleScroll, { passive: true });
  addEventListener("hashchange", scheduleScroll);
  updateScroll();
  backTop?.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: reducedMotion() ? "instant" : "smooth",
    });
  });

  // Reveal once, with content fully visible if JS or IntersectionObserver is unavailable.
  if ("IntersectionObserver" in window && !reducedMotion()) {
    const elements = [...document.querySelectorAll(".reveal")];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.07, rootMargin: "0px 0px -24px 0px" },
    );
    elements.forEach((element) => {
      const peers = [...element.parentElement.children].filter((child) =>
        child.classList.contains("reveal"),
      );
      element.style.setProperty(
        "--reveal-delay",
        `${Math.min(peers.indexOf(element), 3) * 65}ms`,
      );
      observer.observe(element);
    });
    document.body.classList.add("js-ready");
    motionPreference.addEventListener("change", () => {
      if (reducedMotion()) {
        document.body.classList.remove("js-ready");
        observer.disconnect();
      }
    });
  }

  const counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && !reducedMotion()) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target;
          counterObserver.unobserve(element);
          element.dataset.counterRunning = "true";
          const started = performance.now();
          const render = (now) => {
            const copy = element.dataset.cmsCountText;
            const numeric = copy?.match(/^([\d,]+)(\+?)$/);
            if (copy !== undefined && !numeric) {
              element.textContent = copy;
              element.dataset.counterRunning = "false";
              return;
            }
            const target = numeric
              ? Number(numeric[1].replaceAll(",", ""))
              : Number(element.dataset.count);
            const suffix = numeric ? numeric[2] : "+";
            const position = Math.min((now - started) / 1000, 1);
            const value = Math.round(target * (1 - (1 - position) ** 3));
            element.textContent = value.toLocaleString("en-US") + suffix;
            if (position < 1 && !reducedMotion()) requestAnimationFrame(render);
            else {
              element.textContent =
                copy ?? target.toLocaleString("en-US") + suffix;
              element.dataset.counterRunning = "false";
            }
          };
          requestAnimationFrame(render);
        });
      },
      { threshold: 0.5 },
    );
    counters.forEach((counter) => counterObserver.observe(counter));
  }

  // Native scrolling preserves touch, trackpad, keyboard and screen-reader access.
  const carousel = document.querySelector(".story-carousel");
  const previous = document.querySelector("[data-carousel-prev]");
  const next = document.querySelector("[data-carousel-next]");
  if (carousel) {
    const move = (direction) => {
      const card = carousel.querySelector(".story-card");
      const gap = parseFloat(getComputedStyle(carousel).columnGap) || 0;
      carousel.scrollBy({
        left:
          direction *
          ((card?.getBoundingClientRect().width || carousel.clientWidth) + gap),
        behavior: reducedMotion() ? "instant" : "smooth",
      });
    };
    const updateButtons = () => {
      if (previous) previous.disabled = carousel.scrollLeft < 4;
      if (next)
        next.disabled =
          carousel.scrollLeft + carousel.clientWidth >=
          carousel.scrollWidth - 4;
    };
    previous?.addEventListener("click", () => move(-1));
    next?.addEventListener("click", () => move(1));
    carousel.addEventListener("scroll", updateButtons, { passive: true });
    carousel.addEventListener("keydown", (event) => {
      if (event.target !== carousel) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        move(event.key === "ArrowRight" ? 1 : -1);
      }
    });
    addEventListener("resize", updateButtons, { passive: true });
    updateButtons();
  }

  const filters = [...document.querySelectorAll("[data-filter]")];
  const grid = document.querySelector("#destination-grid");
  filters.forEach((filter) =>
    filter.addEventListener("click", () => {
      filters.forEach((button) =>
        button.setAttribute("aria-pressed", String(button === filter)),
      );
      grid?.querySelectorAll("[data-region]").forEach((item) => {
        item.hidden =
          filter.dataset.filter !== "all" &&
          item.dataset.region !== filter.dataset.filter;
      });
      scheduleScroll();
    }),
  );

  // Keep program context even on hosts that redirect .html URLs without a query.
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    const destination = new URL(link.href, location.href);
    const program = destination.searchParams.get("program");
    if (
      destination.origin === location.origin &&
      /\/contact(?:\.html)?$/.test(destination.pathname) &&
      program
    ) {
      try {
        sessionStorage.setItem("gsj-consultation-program", program);
      } catch {
        /* Storage is optional. */
      }
    }
  });
  let requestedProgram = new URLSearchParams(location.search).get("program");
  const programSelect = document.querySelector("#contact-subject");
  if (programSelect) {
    try {
      requestedProgram ||= sessionStorage.getItem("gsj-consultation-program");
      sessionStorage.removeItem("gsj-consultation-program");
    } catch {
      /* URL context still works without storage. */
    }
  }
  if (
    requestedProgram &&
    programSelect &&
    [...programSelect.options].some(
      (option) => option.value === requestedProgram,
    )
  ) {
    programSelect.value = requestedProgram;
  }
});
