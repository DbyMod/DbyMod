const root = document.documentElement;
const meter = document.querySelector("[data-scroll-meter]");
const header = document.querySelector(".site-header");
const revealItems = document.querySelectorAll(".reveal");
const tiltCards = document.querySelectorAll("[data-tilt-card]");
const depthCards = document.querySelectorAll("[data-scroll-depth]");
const imageCards = document.querySelectorAll("[data-3d-image]");
const showcaseOptions = document.querySelectorAll("[data-showcase-option]");
const showcaseMedia = document.querySelector("[data-showcase-media]");
const showcaseImage = document.querySelector("[data-showcase-image]");
const showcaseKicker = document.querySelector("[data-showcase-kicker]");
const showcaseTitle = document.querySelector("[data-showcase-title]");
const showcaseDescription = document.querySelector("[data-showcase-description]");
const showcaseSpecs = document.querySelector("[data-showcase-specs]");
const cinemaChapters = document.querySelectorAll("[data-cinema-step]");
const cinemaScreen = document.querySelector("[data-cinema-screen]");
const cinemaImage = document.querySelector("[data-cinema-image]");
const cinemaCode = document.querySelector("[data-cinema-code]");
const cinemaName = document.querySelector("[data-cinema-name]");
const isekaiOpening = document.querySelector("[data-isekai-opening]");
const isekaiPanel = document.querySelector("[data-isekai-panel]");
const isekaiArt = document.querySelector("[data-isekai-art]");
const isekaiStep = document.querySelector("[data-isekai-step]");
const isekaiNext = document.querySelector("[data-isekai-next]");
const isekaiSkip = document.querySelector("[data-isekai-skip]");
const isekaiProgress = document.querySelector("[data-isekai-progress]");
const summonTrigger = document.querySelector("[data-summon-trigger]");
const summonStage = document.querySelector("[data-summon]");
const summonCloseButtons = document.querySelectorAll("[data-summon-close]");
const featuredVideo = document.querySelector(".video-frame video");
const videoToggle = document.querySelector("[data-video-toggle]");
const videoMute = document.querySelector("[data-video-mute]");
const navLinks = document.querySelectorAll(".site-header nav a[href^='#']");
const scrollPrev = document.querySelector("[data-scroll-prev]");
const scrollNext = document.querySelector("[data-scroll-next]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (window.history && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

let pointerTicking = false;
let scrollTicking = false;
let lastPointerEvent = null;
let isekaiIndex = 0;
let isekaiTransitioning = false;
let initialHashCorrectionActive = Boolean(window.location.hash);
let initialHashCorrectionExpired = false;
let userScrollIntentDetected = false;
let initialHashTimers = [];
let lastTouchY = null;

const getSessionFlag = (key) => {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const setSessionFlag = (key, value) => {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
};

const isekaiStages = [
  {
    image: "assets/summon/comic-01.png",
  },
  {
    image: "assets/summon/comic-02.png",
  },
  {
    image: "assets/summon/comic-03.png",
  },
  {
    image: "assets/summon/comic-04.png",
  },
  {
    image: "assets/summon/comic-05.png",
  },
  {
    image: "assets/summon/comic-06.png",
  },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const scrollingElement = () => document.scrollingElement || document.documentElement;

const scrollByFallback = (deltaY) => {
  if (!deltaY) return;
  const before = window.scrollY;
  window.scrollBy({ top: deltaY, behavior: "auto" });
  if (window.scrollY === before) {
    const scroller = scrollingElement();
    scroller.scrollTop = clamp(scroller.scrollTop + deltaY, 0, scroller.scrollHeight - window.innerHeight);
  }
  requestScrollUpdate();
};

const ensureWheelScroll = (event) => {
  if (event.ctrlKey || event.metaKey || Math.abs(event.deltaY) < 1) return;
  cancelInitialHashCorrection();
  const before = window.scrollY;
  const delta = event.deltaMode === 1 ? event.deltaY * 40 : event.deltaY;
  window.requestAnimationFrame(() => {
    if (Math.abs(window.scrollY - before) < 1) scrollByFallback(delta);
  });
};

const ensureTouchScroll = (event) => {
  if (event.touches.length !== 1) return;
  const currentY = event.touches[0].clientY;
  if (lastTouchY == null) {
    lastTouchY = currentY;
    return;
  }
  const delta = lastTouchY - currentY;
  lastTouchY = currentY;
  if (Math.abs(delta) < 2) return;
  cancelInitialHashCorrection();
  const before = window.scrollY;
  window.requestAnimationFrame(() => {
    if (Math.abs(window.scrollY - before) < 1) scrollByFallback(delta);
  });
};

const ensureKeyboardScroll = (event) => {
  const tagName = document.activeElement?.tagName;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(tagName)) return;

  const keyDeltas = {
    ArrowDown: 90,
    ArrowUp: -90,
    PageDown: Math.round(window.innerHeight * 0.82),
    PageUp: -Math.round(window.innerHeight * 0.82),
    Home: -window.scrollY,
    End: scrollingElement().scrollHeight,
    " ": event.shiftKey ? -Math.round(window.innerHeight * 0.82) : Math.round(window.innerHeight * 0.82),
  };
  const delta = keyDeltas[event.key];
  if (delta == null) return;

  const before = window.scrollY;
  window.setTimeout(() => {
    if (Math.abs(window.scrollY - before) < 1) scrollByFallback(delta);
  }, 24);
};

const syncHeaderOffset = () => {
  if (header) root.style.setProperty("--header-actual", `${header.offsetHeight}px`);
};

const setPointerVars = () => {
  if (!lastPointerEvent) return;
  root.style.setProperty("--mx", `${(lastPointerEvent.clientX / window.innerWidth) * 100}%`);
  root.style.setProperty("--my", `${(lastPointerEvent.clientY / window.innerHeight) * 100}%`);
  pointerTicking = false;
};

const setPointer = (event) => {
  lastPointerEvent = event;
  if (!pointerTicking) {
    pointerTicking = true;
    requestAnimationFrame(setPointerVars);
  }
};

const updateActiveNav = () => {
  const current = [...document.querySelectorAll("section[id]")]
    .map((section) => ({
      id: section.id,
      top: Math.abs(section.getBoundingClientRect().top - (header?.offsetHeight || 72) - 24),
    }))
    .sort((a, b) => a.top - b.top)[0];

  navLinks.forEach((link) => {
    const isCurrent = current && link.getAttribute("href") === `#${current.id}`;
    if (isCurrent) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const updateScrollMotion = () => {
  const scroller = scrollingElement();
  const max = scroller.scrollHeight - window.innerHeight;
  const progress = max > 0 ? scroller.scrollTop / max : 0;
  if (meter) meter.style.width = `${clamp(progress, 0, 1) * 100}%`;

  if (!reduceMotion.matches) {
    const center = window.innerHeight / 2;
    depthCards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      if (rect.bottom < -160 || rect.top > window.innerHeight + 160) return;
      const offset = clamp((rect.top + rect.height / 2 - center) / center, -1, 1);
      card.style.setProperty("--scroll-tilt", `${(-offset * 2.4).toFixed(2)}deg`);
      card.style.setProperty("--float", `${(-offset * 7).toFixed(2)}px`);
    });
  }

  updateActiveNav();
  scrollTicking = false;
};

const requestScrollUpdate = () => {
  if (!scrollTicking) {
    scrollTicking = true;
    requestAnimationFrame(updateScrollMotion);
  }
};

const renderIsekaiStage = () => {
  if (!isekaiOpening) return;
  const stage = isekaiStages[isekaiIndex];
  isekaiOpening.dataset.step = String(isekaiIndex);
  if (isekaiArt) isekaiArt.src = stage.image;
  if (isekaiStep) isekaiStep.textContent = `${String(isekaiIndex + 1).padStart(2, "0")} / ${String(isekaiStages.length).padStart(2, "0")}`;
  if (isekaiNext) {
    isekaiNext.textContent = "";
    isekaiNext.setAttribute("aria-label", isekaiIndex >= isekaiStages.length - 1 ? "Enter portfolio" : "Next comic panel");
  }
  isekaiProgress?.querySelectorAll("span").forEach((dot, index) => {
    dot.classList.toggle("is-active", index === isekaiIndex);
  });
};

const closeIsekaiOpening = () => {
  if (!isekaiOpening) return;
  setSessionFlag("cia0_isekai_seen", "true");
  isekaiOpening.classList.remove("is-open");
  isekaiOpening.classList.add("is-complete");
  isekaiOpening.setAttribute("aria-hidden", "true");
  scheduleInitialHashCorrection([0, 120, 360, 760, 1400, 2400, 3600]);
  requestScrollUpdate();
};

const advanceIsekaiOpening = () => {
  if (!isekaiOpening?.classList.contains("is-open") || isekaiTransitioning) return;
  if (isekaiIndex >= isekaiStages.length - 1) {
    closeIsekaiOpening();
    return;
  }

  isekaiTransitioning = true;
  isekaiPanel?.classList.add("is-flipping");
  window.setTimeout(() => {
    isekaiIndex += 1;
    renderIsekaiStage();
  }, 170);
  window.setTimeout(() => {
    isekaiPanel?.classList.remove("is-flipping");
    isekaiTransitioning = false;
  }, 540);
};

const scrollToHash = (hash, behavior = "smooth") => {
  if (!hash || hash === "#") return false;
  const target = document.querySelector(hash);
  if (!target) return false;

  const scroller = scrollingElement();
  const offset = (header?.offsetHeight || 72) + 18;
  const top = target.getBoundingClientRect().top + scroller.scrollTop - offset;
  if (behavior === "auto" || reduceMotion.matches) {
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo({ top, behavior: "auto" });
    requestAnimationFrame(() => {
      root.style.scrollBehavior = previousScrollBehavior;
    });
  } else {
    window.scrollTo({ top, behavior });
  }
  return true;
};

const scrollToAdjacentSection = (direction) => {
  const sections = [...document.querySelectorAll("main > section[id]")];
  if (!sections.length) return;

  cancelInitialHashCorrection();
  const offset = (header?.offsetHeight || 72) + 18;
  const currentIndex = sections
    .map((section, index) => ({
      index,
      distance: Math.abs(section.getBoundingClientRect().top - offset),
    }))
    .sort((a, b) => a.distance - b.distance)[0]?.index;
  const targetIndex = clamp((currentIndex ?? 0) + direction, 0, sections.length - 1);
  const target = sections[targetIndex];

  if (!target?.id) return;
  scrollToHash(`#${target.id}`);
  const nextUrl = new URL(window.location.href);
  nextUrl.hash = `#${target.id}`;
  window.history.replaceState(null, "", nextUrl);
};

const runInitialHashCorrection = () => {
  if (!window.location.hash || userScrollIntentDetected || initialHashCorrectionExpired) return;
  scrollToHash(window.location.hash, "auto");
  requestScrollUpdate();
};

const scheduleInitialHashCorrection = (delays = [80, 220, 520, 900, 1400, 2200, 3400, 5000]) => {
  if (!window.location.hash || userScrollIntentDetected || initialHashCorrectionExpired) return;

  delays.forEach((delay) => {
    const timer = window.setTimeout(runInitialHashCorrection, delay);
    initialHashTimers.push(timer);
  });
};

const cancelInitialHashCorrection = () => {
  userScrollIntentDetected = true;
  initialHashCorrectionActive = false;
  initialHashCorrectionExpired = true;
  initialHashTimers.forEach((timer) => window.clearTimeout(timer));
  initialHashTimers = [];
};

const watchLayoutForHashCorrection = () => {
  if (!window.location.hash || userScrollIntentDetected || initialHashCorrectionExpired) return;

  const pendingImages = [...document.images].filter((image) => !image.complete);
  Promise.allSettled(
    pendingImages.map(
      (image) =>
        new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        })
    )
  ).then(() => scheduleInitialHashCorrection([0, 140, 420]));

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => scheduleInitialHashCorrection([0, 180, 520]));
  }

  if ("ResizeObserver" in window) {
    const layoutObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(runInitialHashCorrection);
    });
    layoutObserver.observe(document.body);
    window.setTimeout(() => layoutObserver.disconnect(), 6200);
  }

  window.setTimeout(() => {
    initialHashCorrectionActive = false;
    initialHashCorrectionExpired = true;
  }, 6400);
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  },
  { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
);

revealItems.forEach((item) => revealObserver.observe(item));

syncHeaderOffset();
renderIsekaiStage();

const shouldShowIsekaiOpening = Boolean(isekaiOpening && !window.location.hash && getSessionFlag("cia0_isekai_seen") !== "true");
if (isekaiOpening) {
  isekaiOpening.classList.toggle("is-open", shouldShowIsekaiOpening);
  isekaiOpening.classList.toggle("is-complete", !shouldShowIsekaiOpening);
  isekaiOpening.setAttribute("aria-hidden", shouldShowIsekaiOpening ? "false" : "true");
}

isekaiPanel?.addEventListener("click", advanceIsekaiOpening);

isekaiNext?.addEventListener("click", (event) => {
  event.stopPropagation();
  advanceIsekaiOpening();
});

isekaiSkip?.addEventListener("click", (event) => {
  event.stopPropagation();
  closeIsekaiOpening();
});

tiltCards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (reduceMotion.matches || event.pointerType === "touch") return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.classList.add("tilt-active");
    card.style.setProperty("--rx", `${(y * -7).toFixed(2)}deg`);
    card.style.setProperty("--ry", `${(x * 9).toFixed(2)}deg`);
  });

  card.addEventListener("pointerleave", () => {
    card.classList.remove("tilt-active");
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  });
});

imageCards.forEach((card) => {
  let pulseTimer;
  card.addEventListener("click", () => {
    if (!reduceMotion.matches) {
      clearTimeout(pulseTimer);
      card.classList.add("is-activated");
      card.style.setProperty("--rx", "-8deg");
      card.style.setProperty("--ry", "7deg");
      pulseTimer = window.setTimeout(() => {
        card.classList.remove("is-activated");
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      }, 650);
    }

    if (card === summonTrigger) {
      summonStage?.classList.add("is-open");
      summonStage?.setAttribute("aria-hidden", "false");
      window.setTimeout(() => document.querySelector(".summon-close")?.focus({ preventScroll: true }), 80);
    }
  });
});

const setShowcaseOption = (option) => {
  if (!option) return;

  showcaseOptions.forEach((item) => {
    const isActive = item === option;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-pressed", String(isActive));
  });

  if (showcaseImage && option.dataset.showcaseImage) {
    showcaseImage.src = option.dataset.showcaseImage;
    showcaseImage.alt = option.dataset.showcaseAlt || "";
  }
  if (showcaseKicker) showcaseKicker.textContent = option.dataset.showcaseKicker || "";
  if (showcaseTitle) showcaseTitle.textContent = option.dataset.showcaseTitle || "";
  if (showcaseDescription) showcaseDescription.textContent = option.dataset.showcaseDescription || "";

  if (showcaseSpecs) {
    const specs = (option.dataset.showcaseSpecs || "").split("|").filter(Boolean);
    showcaseSpecs.replaceChildren(
      ...specs.map((spec) => {
        const item = document.createElement("li");
        item.textContent = spec;
        return item;
      })
    );
  }

  if (!reduceMotion.matches && showcaseMedia) {
    showcaseMedia.classList.remove("is-activated");
    void showcaseMedia.offsetWidth;
    showcaseMedia.classList.add("is-activated");
    window.setTimeout(() => showcaseMedia.classList.remove("is-activated"), 650);
  }
};

showcaseOptions.forEach((option) => {
  option.setAttribute("aria-pressed", String(option.classList.contains("is-active")));
  option.addEventListener("click", () => setShowcaseOption(option));
});

const setCinemaStep = (chapter) => {
  if (!chapter || chapter.classList.contains("is-active")) return;

  cinemaChapters.forEach((item) => item.classList.toggle("is-active", item === chapter));

  if (cinemaImage && chapter.dataset.cinemaImage) {
    cinemaImage.src = chapter.dataset.cinemaImage;
    cinemaImage.alt = chapter.dataset.cinemaAlt || "";
  }
  if (cinemaCode) cinemaCode.textContent = chapter.dataset.cinemaCode || "";
  if (cinemaName) cinemaName.textContent = chapter.dataset.cinemaName || "";

  if (!reduceMotion.matches && cinemaScreen) {
    cinemaScreen.classList.remove("is-activated");
    void cinemaScreen.offsetWidth;
    cinemaScreen.classList.add("is-activated");
    window.setTimeout(() => cinemaScreen.classList.remove("is-activated"), 680);
  }
};

const cinemaObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setCinemaStep(visible.target);
  },
  { rootMargin: "-28% 0px -42% 0px", threshold: [0.12, 0.35, 0.58] }
);

cinemaChapters.forEach((chapter) => {
  cinemaObserver.observe(chapter);
  chapter.addEventListener("mouseenter", () => setCinemaStep(chapter));
});

const closeSummon = () => {
  summonStage?.classList.remove("is-open");
  summonStage?.setAttribute("aria-hidden", "true");
  summonTrigger?.focus({ preventScroll: true });
};

summonCloseButtons.forEach((button) => {
  button.addEventListener("click", closeSummon);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isekaiOpening?.classList.contains("is-open")) closeIsekaiOpening();
  if (event.key === "Escape" && summonStage?.classList.contains("is-open")) closeSummon();
});

const syncVideoButtons = () => {
  if (!featuredVideo) return;
  if (videoToggle) videoToggle.textContent = featuredVideo.paused ? "Play" : "Pause";
  if (videoMute) videoMute.textContent = featuredVideo.muted ? "Unmute" : "Mute";
};

videoToggle?.addEventListener("click", async () => {
  if (!featuredVideo) return;
  if (featuredVideo.paused) {
    await featuredVideo.play().catch(() => {});
  } else {
    featuredVideo.pause();
  }
  syncVideoButtons();
});

videoMute?.addEventListener("click", () => {
  if (!featuredVideo) return;
  featuredVideo.muted = !featuredVideo.muted;
  syncVideoButtons();
});

featuredVideo?.addEventListener("play", syncVideoButtons);
featuredVideo?.addEventListener("pause", syncVideoButtons);
featuredVideo?.addEventListener("loadeddata", syncVideoButtons);
featuredVideo?.addEventListener("volumechange", syncVideoButtons);

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");
    cancelInitialHashCorrection();
    if (!scrollToHash(hash)) return;

    event.preventDefault();
    const nextUrl = new URL(window.location.href);
    nextUrl.hash = hash;
    window.history.pushState(null, "", nextUrl);
  });
});

scrollPrev?.addEventListener("click", () => scrollToAdjacentSection(-1));
scrollNext?.addEventListener("click", () => scrollToAdjacentSection(1));

window.addEventListener("pointermove", setPointer, { passive: true });
window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("wheel", ensureWheelScroll, { passive: true });
window.addEventListener("touchmove", ensureTouchScroll, { passive: true });
window.addEventListener("touchend", () => {
  lastTouchY = null;
});
const correctInitialHash = () => {
  scheduleInitialHashCorrection();
  watchLayoutForHashCorrection();
};

window.addEventListener(
  "resize",
  () => {
    syncHeaderOffset();
    requestScrollUpdate();
  },
  { passive: true }
);
window.addEventListener("wheel", cancelInitialHashCorrection, { passive: true, once: true });
window.addEventListener("touchmove", cancelInitialHashCorrection, { passive: true, once: true });
window.addEventListener(
  "keydown",
  (event) => {
    if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
      cancelInitialHashCorrection();
      ensureKeyboardScroll(event);
    }
  }
);

const startInitialHashCorrection = () => {
  if (!window.location.hash || userScrollIntentDetected || initialHashCorrectionExpired) return;
  initialHashCorrectionActive = true;
  correctInitialHash();
};

[0, 120, 420].forEach((delay) => window.setTimeout(startInitialHashCorrection, delay));

if (document.readyState === "complete") {
  startInitialHashCorrection();
} else {
  window.addEventListener("load", startInitialHashCorrection, { once: true });
}

requestScrollUpdate();
syncVideoButtons();
