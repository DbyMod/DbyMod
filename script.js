const root = document.documentElement;
const meter = document.querySelector("[data-scroll-meter]");
const header = document.querySelector(".site-header");
const hyperspeedCanvas = document.querySelector("[data-hyperspeed]");
const revealItems = document.querySelectorAll(".reveal");
const tiltCards = document.querySelectorAll("[data-tilt-card]");
const lanyardCards = document.querySelectorAll("[data-lanyard-card]");
const evilEyes = document.querySelectorAll("[data-evil-eye]");
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
const videoFrame = document.querySelector(".video-frame");
const featuredVideo = document.querySelector(".video-frame video");
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
let initialHashCorrectionExpired = false;
let userScrollIntentDetected = false;
let initialHashTimers = [];
let lastNavUpdate = 0;

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

const initHyperspeed = () => {
  if (!hyperspeedCanvas || reduceMotion.matches) return;

  const context = hyperspeedCanvas.getContext("2d", { alpha: true });
  if (!context) return;

  const preset = {
    density: 96,
    speed: 0.00034,
    horizon: 0.44,
    vanishingSpread: 0.04,
    roadSpread: 0.58,
    colors: ["#92ff00", "#ffffff", "#c8ff72"],
  };

  let width = 0;
  let height = 0;
  let dpr = 1;
  let animationFrame = null;
  let lastTime = 0;
  let isVisible = true;
  const streaks = [];

  const resetStreak = (streak, initial = false) => {
    streak.z = initial ? Math.random() : 0;
    streak.side = Math.random() > 0.5 ? 1 : -1;
    streak.offset = 0.22 + Math.random() * 0.78;
    streak.lane = (Math.random() - 0.5) * 0.32;
    streak.length = 46 + Math.random() * 132;
    streak.width = 0.7 + Math.random() * 1.9;
    streak.color = preset.colors[Math.floor(Math.random() * preset.colors.length)];
    streak.alpha = 0.32 + Math.random() * 0.48;
  };

  const resize = () => {
    const rect = hyperspeedCanvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    hyperspeedCanvas.width = Math.round(width * dpr);
    hyperspeedCanvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawPerspectiveGrid = (time) => {
    const centerX = width * 0.53;
    const horizonY = height * preset.horizon;
    context.save();
    context.globalAlpha = 0.24;
    context.lineCap = "square";

    [-1, -0.62, -0.28, 0.28, 0.62, 1].forEach((lane, index) => {
      context.beginPath();
      context.strokeStyle = index % 2 ? "#ffffff" : "#92ff00";
      context.lineWidth = index % 2 ? 1 : 1.4;
      context.moveTo(centerX + lane * width * preset.vanishingSpread, horizonY);
      context.lineTo(centerX + lane * width * preset.roadSpread, height + 24);
      context.stroke();
    });

    for (let i = 0; i < 9; i += 1) {
      const phase = ((time * 0.00018 + i / 9) % 1) ** 1.85;
      const y = horizonY + phase * height * 0.72;
      const spread = preset.vanishingSpread + phase * (preset.roadSpread - preset.vanishingSpread);
      context.globalAlpha = 0.08 + phase * 0.22;
      context.strokeStyle = i % 2 ? "#ffffff" : "#92ff00";
      context.lineWidth = 0.8 + phase * 2.6;
      context.beginPath();
      context.moveTo(centerX - spread * width, y);
      context.lineTo(centerX + spread * width, y);
      context.stroke();
    }

    context.restore();
  };

  const drawStreaks = (deltaTime) => {
    const centerX = width * 0.53;
    const horizonY = height * preset.horizon;

    streaks.forEach((streak) => {
      streak.z += deltaTime * preset.speed * (0.64 + streak.width * 0.18);
      if (streak.z > 1) resetStreak(streak);

      const depth = streak.z ** 2.05;
      const spread = preset.vanishingSpread + depth * (preset.roadSpread - preset.vanishingSpread);
      const y = horizonY + depth * height * 0.74;
      const x = centerX + streak.side * spread * width * streak.offset + streak.lane * width * depth;
      const length = streak.length * (0.18 + depth * 2.35);
      const slope = streak.side * (20 + depth * 72);

      context.save();
      context.globalAlpha = Math.min(0.92, streak.alpha * (0.18 + depth * 1.2));
      context.strokeStyle = streak.color;
      context.lineWidth = streak.width + depth * 4.8;
      context.lineCap = "square";
      context.shadowBlur = 12 + depth * 28;
      context.shadowColor = streak.color;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + streak.side * length, y - slope);
      context.stroke();
      context.restore();
    });
  };

  const render = (time = 0) => {
    if (!isVisible || document.hidden) {
      animationFrame = null;
      return;
    }

    const deltaTime = Math.min(time - lastTime || 16, 40);
    lastTime = time;
    context.clearRect(0, 0, width, height);
    drawPerspectiveGrid(time);
    drawStreaks(deltaTime);
    animationFrame = window.requestAnimationFrame(render);
  };

  const start = () => {
    if (animationFrame || document.hidden || !isVisible) return;
    lastTime = performance.now();
    animationFrame = window.requestAnimationFrame(render);
  };

  const stop = () => {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = null;
  };

  resize();
  for (let index = 0; index < preset.density; index += 1) {
    const streak = {};
    resetStreak(streak, true);
    streaks.push(streak);
  }

  const resizeObserver = new ResizeObserver(() => {
    resize();
    start();
  });
  resizeObserver.observe(hyperspeedCanvas);

  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      isVisible = Boolean(entry?.isIntersecting);
      if (isVisible) start();
      else stop();
    },
    { threshold: 0.04 }
  );
  visibilityObserver.observe(hyperspeedCanvas.closest(".hero") || hyperspeedCanvas);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  start();
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
  const firstSection = document.querySelector("main > section[id]");
  const headerOffset = (header?.offsetHeight || 72) + 120;
  if (firstSection && window.scrollY < firstSection.offsetTop - headerOffset) {
    navLinks.forEach((link) => link.removeAttribute("aria-current"));
    return;
  }

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

  const now = performance.now();
  if (now - lastNavUpdate > 120) {
    updateActiveNav();
    lastNavUpdate = now;
  }
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
  scheduleInitialHashCorrection([0, 160]);
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

const scheduleInitialHashCorrection = (delays = [80, 260]) => {
  if (!window.location.hash || userScrollIntentDetected || initialHashCorrectionExpired) return;

  delays.forEach((delay) => {
    const timer = window.setTimeout(runInitialHashCorrection, delay);
    initialHashTimers.push(timer);
  });
};

const cancelInitialHashCorrection = () => {
  userScrollIntentDetected = true;
  initialHashCorrectionExpired = true;
  initialHashTimers.forEach((timer) => window.clearTimeout(timer));
  initialHashTimers = [];
};

const watchLayoutForHashCorrection = () => {
  if (!window.location.hash || userScrollIntentDetected || initialHashCorrectionExpired) return;

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => scheduleInitialHashCorrection([0, 180]));
  }

  window.setTimeout(() => {
    initialHashCorrectionExpired = true;
  }, 1200);
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
initHyperspeed();
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

lanyardCards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (reduceMotion.matches || event.pointerType === "touch") return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.classList.add("is-active");
    card.style.setProperty("--lanyard-x", `${(y * -12).toFixed(2)}deg`);
    card.style.setProperty("--lanyard-y", `${(x * 16).toFixed(2)}deg`);
    card.style.setProperty("--lanyard-swing", `${(x * 7).toFixed(2)}deg`);
  });

  card.addEventListener("pointerleave", () => {
    card.classList.remove("is-active");
    card.style.setProperty("--lanyard-x", "0deg");
    card.style.setProperty("--lanyard-y", "0deg");
    card.style.setProperty("--lanyard-swing", "0deg");
  });
});

const updateEvilEyes = (event) => {
  if (!evilEyes.length || reduceMotion.matches || event.pointerType === "touch") return;

  evilEyes.forEach((eye) => {
    const rect = eye.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = clamp((event.clientX - centerX) / (rect.width / 2), -1, 1);
    const y = clamp((event.clientY - centerY) / (rect.height / 2), -1, 1);

    eye.style.setProperty("--eye-x", `${(x * 14).toFixed(2)}px`);
    eye.style.setProperty("--eye-y", `${(y * 9).toFixed(2)}px`);
    eye.style.setProperty("--eye-tilt", `${(x * 7).toFixed(2)}deg`);
    eye.style.setProperty("--eye-glow-x", `${(50 + x * 12).toFixed(2)}%`);
    eye.style.setProperty("--eye-glow-y", `${(48 + y * 8).toFixed(2)}%`);
  });
};

if (evilEyes.length) {
  window.addEventListener("pointermove", updateEvilEyes, { passive: true });
}

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

let videoAutoplayTimer = null;

const syncVideoButtons = () => {
  if (!featuredVideo) return;

  const hasError = Boolean(featuredVideo.error);
  const isPlaying = !featuredVideo.paused && !hasError;

  videoFrame?.classList.toggle("is-playing", isPlaying);
  videoFrame?.classList.toggle("is-paused", !isPlaying);
  videoFrame?.classList.toggle("has-video-error", hasError);
};

const prepareFeaturedVideo = () => {
  if (!featuredVideo) return;
  featuredVideo.defaultMuted = true;
  featuredVideo.muted = true;
  featuredVideo.loop = true;
  featuredVideo.autoplay = true;
  featuredVideo.playsInline = true;
  featuredVideo.setAttribute("muted", "");
  featuredVideo.setAttribute("autoplay", "");
  featuredVideo.setAttribute("loop", "");
  featuredVideo.setAttribute("playsinline", "");
  featuredVideo.setAttribute("webkit-playsinline", "");
};

const playFeaturedVideo = async ({ forceMuted = false } = {}) => {
  if (!featuredVideo) return;

  prepareFeaturedVideo();
  if (forceMuted) featuredVideo.muted = true;

  if (featuredVideo.error || featuredVideo.networkState === HTMLMediaElement.NETWORK_EMPTY) {
    featuredVideo.load();
  }

  try {
    await featuredVideo.play();
  } catch {
    if (!featuredVideo.muted) {
      featuredVideo.muted = true;
      await featuredVideo.play().catch(() => {});
    }
  }

  syncVideoButtons();
};

const attemptFeaturedAutoplay = (delay = 0) => {
  if (!featuredVideo) return;
  window.clearTimeout(videoAutoplayTimer);
  prepareFeaturedVideo();
  videoAutoplayTimer = window.setTimeout(() => {
    if (document.hidden || document.visibilityState === "hidden") return;
    playFeaturedVideo({ forceMuted: true });
  }, delay);
};

videoFrame?.addEventListener("click", () => {
  if (featuredVideo?.paused) playFeaturedVideo({ forceMuted: true });
});

featuredVideo?.addEventListener("play", syncVideoButtons);
featuredVideo?.addEventListener("playing", syncVideoButtons);
featuredVideo?.addEventListener("pause", () => {
  syncVideoButtons();
  if (featuredVideo.autoplay && !featuredVideo.ended) attemptFeaturedAutoplay(320);
});
featuredVideo?.addEventListener("canplay", () => attemptFeaturedAutoplay(0));
featuredVideo?.addEventListener("loadeddata", () => {
  syncVideoButtons();
  attemptFeaturedAutoplay(120);
});
featuredVideo?.addEventListener("volumechange", syncVideoButtons);
featuredVideo?.addEventListener("error", syncVideoButtons);

if (featuredVideo) {
  prepareFeaturedVideo();
  const reelObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) attemptFeaturedAutoplay(120);
    },
    { threshold: 0.16 }
  );
  if (videoFrame) reelObserver.observe(videoFrame);

  window.addEventListener("load", () => attemptFeaturedAutoplay(450), { once: true });
  window.addEventListener("focus", () => attemptFeaturedAutoplay(80), { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && featuredVideo.paused && featuredVideo.autoplay) attemptFeaturedAutoplay(80);
  });
}

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
    }
  }
);

const startInitialHashCorrection = () => {
  if (!window.location.hash || userScrollIntentDetected || initialHashCorrectionExpired) return;
  correctInitialHash();
};

[0, 180].forEach((delay) => window.setTimeout(startInitialHashCorrection, delay));

if (document.readyState === "complete") {
  startInitialHashCorrection();
} else {
  window.addEventListener("load", startInitialHashCorrection, { once: true });
}

requestScrollUpdate();
syncVideoButtons();
