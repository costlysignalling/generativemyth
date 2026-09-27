(() => {
  "use strict";

  const data = window.STORY_MAP_DATA;
  if (!data) throw new Error("Story map data is missing.");

  const SVG_NS = "http://www.w3.org/2000/svg";
  const STORAGE_KEY = "story-map-settings-v1";
  const HINT_KEY = "story-map-keyboard-hint-seen";
  const STORY_WIDTH = 4000;
  const JUMP_HALF_WIDTH = 2000;
  const JUMP_SAMPLE_COUNT = 96;
  const elements = {
    stage: document.querySelector("#stage"),
    svg: document.querySelector("#story-map"),
    timeline: document.querySelector("#timeline-layer"),
    readings: document.querySelector("#reading-layer"),
    jumps: document.querySelector("#jump-layer"),
    marker: document.querySelector("#marker-layer"),
    chapterName: document.querySelector("#chapter-name"),
    chapterPosition: document.querySelector("#chapter-position"),
    playPause: document.querySelector("#play-pause"),
    playReverse: document.querySelector("#play-reverse"),
    start: document.querySelector("#go-start"),
    end: document.querySelector("#go-end"),
    previous: document.querySelector("#previous-frame"),
    next: document.querySelector("#next-frame"),
    stepWrappers: document.querySelectorAll(".step-controls"),
    dock: document.querySelector("#control-dock"),
    hint: document.querySelector("#keyboard-hint"),
    settingsButton: document.querySelector("#settings-button"),
    settingsPanel: document.querySelector("#settings-panel"),
    speed: document.querySelector("#speed-slider"),
    speedOutput: document.querySelector("#speed-output"),
    beta: document.querySelector("#beta-slider"),
    betaOutput: document.querySelector("#beta-output"),
    labelModes: document.querySelectorAll('input[name="label-mode"]'),
    colorcode: document.querySelector("#colorcode"),
    resetSettings: document.querySelector("#reset-settings"),
    loading: document.querySelector("#loading"),
  };

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const stored = readStoredSettings();
  let settings = {
    speed: validNumber(stored.speed, data.defaults.speed),
    beta: validNumber(stored.beta, data.defaults.beta),
    labelMode: stored.labelMode === "opening" ? "opening" : "name",
    colorcode: stored.colorcode === true,
  };
  let phases = [];
  let totalDuration = 0;
  let time = 0;
  let playing = !prefersReducedMotion.matches;
  let playbackDirection = 1;
  let animationFrame = 0;
  let previousTimestamp = null;
  let previousPhaseIndex = -1;
  let firstPauseHandled = false;
  let positionMarker = null;
  let previousChapterName = "";
  let previousChapterColor = "";
  let previousChapterPosition = "";

  const sectionRects = data.sections.map(() => createSvg("rect", {
    y: -2000,
    height: 4000,
    fill: "#f00080",
  }));
  const jumpPaths = [];
  const jumpLengths = [];
  const jumpPointTables = [];
  const completedSectionCounts = new Uint16Array(data.sections.length);
  const completedJumpFlags = new Uint8Array(Math.max(0, data.route.length - 1));

  initialize();

  function initialize() {
    const total = data.totalCharacters;
    const horizontalPadding = total * 0.035;
    const verticalExtent = total / 2 + 7000;
    elements.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const timelineExtension = createSvg("rect", {
      id: "timeline-extension",
      x: -horizontalPadding,
      y: -2000,
      width: total + horizontalPadding * 2,
      height: 4000,
      fill: "#57575a",
    });
    elements.timeline.append(timelineExtension);
    elements.timeline.append(createSvg("rect", {
      id: "book-material",
      x: 0,
      y: -2000,
      width: total,
      height: 4000,
      fill: "#747476",
    }));

    sectionRects.forEach((rect, index) => {
      rect.setAttribute("x", data.sections[index].start);
      rect.setAttribute("width", 0);
      elements.readings.append(rect);
    });

    for (let routeIndex = 0; routeIndex < data.route.length - 1; routeIndex += 1) {
      const from = data.sections[data.route[routeIndex]];
      const to = data.sections[data.route[routeIndex + 1]];
      const direction = Math.sign(to.start - from.end) || 1;
      const startX = from.end - direction * JUMP_HALF_WIDTH;
      const endX = to.start + direction * JUMP_HALF_WIDTH;
      const above = routeIndex % 2 === 0;
      const forward = startX < endX;
      const radius = Math.abs(endX - startX) / 2;
      const sweep = above === forward ? 1 : 0;
      const baselineY = above ? -STORY_WIDTH / 2 : STORY_WIDTH / 2;
      const path = createSvg("path", {
        d: `M ${startX} ${baselineY} A ${radius} ${radius} 0 0 ${sweep} ${endX} ${baselineY}`,
        fill: "none",
        stroke: "rgba(255,255,255,.50)",
        "stroke-width": JUMP_HALF_WIDTH * 2,
        "stroke-linecap": "butt",
        pathLength: 1,
        "stroke-dasharray": 1,
        "stroke-dashoffset": 1,
      });
      jumpPaths.push(path);
      elements.jumps.append(path);
      jumpLengths.push(path.getTotalLength());
    }

    positionMarker = createSvg("circle", {
      id: "position-marker",
      r: 7200,
      fill: "#ffe600",
      stroke: "#f00080",
      "stroke-width": 3200,
    });
    elements.marker.append(positionMarker);

    syncControlsFromSettings();
    applyColorMode();
    rebuildPhases();
    bindEvents();
    const updateViewBox = () => {
      const bounds = elements.stage.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const minimumWidth = total + horizontalPadding * 2;
      const minimumHeight = verticalExtent * 2;
      const aspect = bounds.width / bounds.height;
      const viewWidth = Math.max(minimumWidth, minimumHeight * aspect);
      const viewHeight = Math.max(minimumHeight, minimumWidth / aspect);
      const viewX = (total - viewWidth) / 2;
      const viewY = -viewHeight / 2;
      elements.svg.setAttribute("viewBox", `${viewX} ${viewY} ${viewWidth} ${viewHeight}`);
      timelineExtension.setAttribute("x", viewX);
      timelineExtension.setAttribute("width", viewWidth);
    };
    updateViewBox();
    new ResizeObserver(updateViewBox).observe(elements.stage);
    const shouldAutoPlay = playing;
    setPlaying(false, false);
    render();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      preloadJumpPoints();
      elements.loading.classList.add("is-hidden");
      window.setTimeout(() => {
        elements.loading.remove();
        if (shouldAutoPlay) {
          window.setTimeout(() => setPlaying(true, false, 1), data.defaults.introHoldMs);
        }
      }, 220);
    }));
  }

  function preloadJumpPoints() {
    jumpPaths.forEach((path, routeIndex) => {
      const length = jumpLengths[routeIndex];
      jumpPointTables[routeIndex] = Array.from({ length: JUMP_SAMPLE_COUNT + 1 }, (_, sampleIndex) => {
        const point = path.getPointAtLength(length * sampleIndex / JUMP_SAMPLE_COUNT);
        return { x: point.x, y: point.y };
      });
    });
  }

  function rebuildPhases(anchor = null) {
    const weights = data.route.map(sectionIndex => {
      const n = data.sections[sectionIndex].characters;
      return Math.pow(1 + n, settings.beta) - 1;
    });
    const minimumTotal = data.defaults.minimumSectionMs * weights.length;
    const weightedBudget = Math.max(0, data.defaults.readingDurationMs - minimumTotal);
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    const nextPhases = [];
    let cursor = 0;

    data.route.forEach((sectionIndex, routeIndex) => {
      const readingDuration = data.defaults.minimumSectionMs + weightedBudget * weights[routeIndex] / weightSum;
      nextPhases.push({
        type: "reading",
        routeIndex,
        sectionIndex,
        start: cursor,
        duration: readingDuration,
        end: cursor + readingDuration,
      });
      cursor += readingDuration;

      if (routeIndex < data.route.length - 1) {
        const jumpDuration = data.defaults.jumpDurationMs;
        nextPhases.push({
          type: "jumping",
          routeIndex,
          sectionIndex,
          nextSectionIndex: data.route[routeIndex + 1],
          start: cursor,
          duration: jumpDuration,
          end: cursor + jumpDuration,
        });
        cursor += jumpDuration;
      }
    });

    phases = nextPhases;
    totalDuration = cursor;
    if (anchor) {
      const matching = phases.find(phase => phase.type === anchor.type && phase.routeIndex === anchor.routeIndex);
      time = matching ? matching.start + matching.duration * anchor.progress : Math.min(time, totalDuration);
    }
    previousPhaseIndex = -1;
  }

  function render() {
    const phaseIndex = phaseIndexAt(time);
    const phase = phases[phaseIndex];
    const progress = phase.duration ? clamp((time - phase.start) / phase.duration, 0, 1) : 1;

    if (phaseIndex !== previousPhaseIndex) {
      syncCompletedState(phaseIndex);
      previousPhaseIndex = phaseIndex;
    }

    const section = data.sections[phase.sectionIndex];
    const chapterName = section[settings.labelMode];
    const chapterColor = settings.colorcode ? section.color : "";
    const chapterPosition = `${phase.routeIndex + 1} / ${data.route.length}`;
    if (chapterName !== previousChapterName) {
      elements.chapterName.textContent = chapterName;
      previousChapterName = chapterName;
    }
    if (chapterColor !== previousChapterColor) {
      elements.chapterName.style.color = chapterColor;
      previousChapterColor = chapterColor;
    }
    if (chapterPosition !== previousChapterPosition) {
      elements.chapterPosition.textContent = chapterPosition;
      previousChapterPosition = chapterPosition;
    }

    let x;
    let y = 0;
    if (phase.type === "reading") {
      const alreadyRead = completedSectionCounts[phase.sectionIndex] > 0;
      sectionRects[phase.sectionIndex].setAttribute("width", alreadyRead ? section.characters : section.characters * progress);
      x = section.start + section.characters * progress;
    } else {
      jumpPaths[phase.routeIndex].setAttribute("stroke-dashoffset", 1 - progress);
      const point = pointOnPreloadedJump(phase.routeIndex, progress);
      x = point.x;
      y = point.y;
    }

    positionMarker.setAttribute("cx", x);
    positionMarker.setAttribute("cy", y);
  }

  function pointOnPreloadedJump(routeIndex, progress) {
    const points = jumpPointTables[routeIndex];
    if (!points) {
      return jumpPaths[routeIndex].getPointAtLength(jumpLengths[routeIndex] * progress);
    }
    const samplePosition = clamp(progress, 0, 1) * JUMP_SAMPLE_COUNT;
    const lowerIndex = Math.floor(samplePosition);
    const upperIndex = Math.min(JUMP_SAMPLE_COUNT, lowerIndex + 1);
    const fraction = samplePosition - lowerIndex;
    const lower = points[lowerIndex];
    const upper = points[upperIndex];
    return {
      x: lower.x + (upper.x - lower.x) * fraction,
      y: lower.y + (upper.y - lower.y) * fraction,
    };
  }

  function resetCompletedState(currentPhaseIndex) {
    completedSectionCounts.fill(0);
    completedJumpFlags.fill(0);
    for (let index = 0; index < currentPhaseIndex; index += 1) updateCompletedPhase(index, 1);
    sectionRects.forEach((rect, index) => {
      rect.setAttribute("width", completedSectionCounts[index] ? data.sections[index].characters : 0);
    });
    jumpPaths.forEach((path, index) => {
      path.setAttribute("stroke-dashoffset", completedJumpFlags[index] ? 0 : 1);
    });
  }

  function updateCompletedPhase(phaseIndex, delta) {
    const phase = phases[phaseIndex];
    if (phase.type === "reading") {
      const nextCount = Math.max(0, completedSectionCounts[phase.sectionIndex] + delta);
      completedSectionCounts[phase.sectionIndex] = nextCount;
      sectionRects[phase.sectionIndex].setAttribute("width", nextCount ? data.sections[phase.sectionIndex].characters : 0);
    } else {
      completedJumpFlags[phase.routeIndex] = delta > 0 ? 1 : 0;
      jumpPaths[phase.routeIndex].setAttribute("stroke-dashoffset", delta > 0 ? 0 : 1);
    }
  }

  function syncCompletedState(currentPhaseIndex) {
    if (previousPhaseIndex < 0) {
      resetCompletedState(currentPhaseIndex);
    } else if (currentPhaseIndex > previousPhaseIndex) {
      for (let index = previousPhaseIndex; index < currentPhaseIndex; index += 1) updateCompletedPhase(index, 1);
    } else {
      for (let index = previousPhaseIndex - 1; index >= currentPhaseIndex; index -= 1) updateCompletedPhase(index, -1);
    }
  }

  function tick(timestamp) {
    if (!playing) return;
    if (previousTimestamp !== null) time += (timestamp - previousTimestamp) * settings.speed * playbackDirection;
    previousTimestamp = timestamp;

    if (playbackDirection > 0 && time >= totalDuration) {
      time = totalDuration;
      setPlaying(false, false);
    } else if (time <= 0 && playbackDirection < 0) {
      time = 0;
      setPlaying(false, false);
    }

    render();
    if (playing) animationFrame = requestAnimationFrame(tick);
  }

  function setPlaying(nextPlaying, userInitiated = true, direction = playbackDirection) {
    if (nextPlaying) {
      playbackDirection = direction;
      if (playbackDirection > 0 && time >= totalDuration) time = 0;
      if (playbackDirection < 0 && time <= 0) time = totalDuration;
    }
    playing = nextPlaying;
    previousTimestamp = null;
    elements.dock.classList.toggle("is-paused", !playing);
    elements.playPause.setAttribute("aria-label", playing ? "Pozastavit" : "Přehrát");
    elements.stepWrappers.forEach(wrapper => wrapper.setAttribute("aria-hidden", String(playing)));
    [elements.start, elements.previous, elements.playReverse, elements.next, elements.end].forEach(button => {
      button.tabIndex = playing ? -1 : 0;
    });
    cancelAnimationFrame(animationFrame);
    if (playing) animationFrame = requestAnimationFrame(tick);
    else if (userInitiated) showKeyboardHintOnce();
  }

  function stepFrame(direction) {
    if (playing) setPlaying(false);
    time = clamp(time + direction * data.defaults.frameDurationMs, 0, totalDuration);
    previousPhaseIndex = -1;
    render();
  }

  function showKeyboardHintOnce() {
    if (firstPauseHandled) return;
    firstPauseHandled = true;
    let seen = false;
    try { seen = localStorage.getItem(HINT_KEY) === "1"; } catch {}
    if (seen) return;
    elements.hint.classList.add("is-visible");
    try { localStorage.setItem(HINT_KEY, "1"); } catch {}
    window.setTimeout(() => elements.hint.classList.remove("is-visible"), 4700);
  }

  function bindEvents() {
    elements.playPause.addEventListener("click", () => playing ? setPlaying(false) : setPlaying(true, true, 1));
    elements.playReverse.addEventListener("click", () => setPlaying(true, true, -1));
    elements.previous.addEventListener("click", () => stepFrame(-1));
    elements.next.addEventListener("click", () => stepFrame(1));
    elements.start.addEventListener("click", () => seekTo(0));
    elements.end.addEventListener("click", () => seekTo(totalDuration));

    elements.settingsButton.addEventListener("click", () => {
      const open = elements.settingsPanel.hidden;
      elements.settingsPanel.hidden = !open;
      elements.settingsButton.setAttribute("aria-expanded", String(open));
    });

    elements.speed.addEventListener("input", () => {
      settings.speed = Math.pow(2, Number(elements.speed.value));
      updateSettingOutputs();
      storeSettings();
    });

    elements.beta.addEventListener("input", () => {
      const anchor = currentAnchor();
      settings.beta = Number(elements.beta.value);
      rebuildPhases(anchor);
      updateSettingOutputs();
      storeSettings();
      render();
    });

    elements.labelModes.forEach(input => input.addEventListener("change", () => {
      if (!input.checked) return;
      settings.labelMode = input.value;
      storeSettings();
      render();
    }));

    elements.colorcode.addEventListener("click", () => {
      settings.colorcode = !settings.colorcode;
      applyColorMode();
      storeSettings();
      render();
    });

    elements.resetSettings.addEventListener("click", () => {
      const anchor = currentAnchor();
      settings = { speed: 1, beta: 0.5, labelMode: "name", colorcode: false };
      syncControlsFromSettings();
      applyColorMode();
      rebuildPhases(anchor);
      storeSettings();
      render();
    });

    document.addEventListener("click", event => {
      if (!elements.settingsPanel.hidden && !event.target.closest(".settings-wrap")) {
        elements.settingsPanel.hidden = true;
        elements.settingsButton.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", event => {
      if (event.target.closest("#settings-panel") && event.key !== "Escape") return;
      if (event.key === " ") {
        if (event.target.matches("button")) return;
        event.preventDefault();
        setPlaying(!playing);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepFrame(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        stepFrame(1);
      } else if (event.key === "Home") {
        event.preventDefault();
        seekTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        seekTo(totalDuration);
      } else if (event.key === "Escape" && !elements.settingsPanel.hidden) {
        elements.settingsPanel.hidden = true;
        elements.settingsButton.setAttribute("aria-expanded", "false");
        elements.settingsButton.focus();
      }
    });

    document.addEventListener("visibilitychange", () => {
      previousTimestamp = null;
    });
  }

  function currentAnchor() {
    const phase = phases[phaseIndexAt(time)];
    return {
      type: phase.type,
      routeIndex: phase.routeIndex,
      progress: phase.duration ? clamp((time - phase.start) / phase.duration, 0, 1) : 0,
    };
  }

  function seekTo(targetTime) {
    if (playing) setPlaying(false);
    time = clamp(targetTime, 0, totalDuration);
    previousPhaseIndex = -1;
    render();
  }

  function applyColorMode() {
    sectionRects.forEach((rect, index) => {
      rect.setAttribute("fill", settings.colorcode ? data.sections[index].color : "#f00080");
    });
    elements.colorcode.setAttribute("aria-pressed", String(settings.colorcode));
  }

  function phaseIndexAt(targetTime) {
    if (targetTime >= totalDuration) return phases.length - 1;
    let low = 0;
    let high = phases.length - 1;
    while (low <= high) {
      const middle = (low + high) >> 1;
      if (targetTime < phases[middle].start) high = middle - 1;
      else if (targetTime >= phases[middle].end) low = middle + 1;
      else return middle;
    }
    return clamp(low, 0, phases.length - 1);
  }

  function syncControlsFromSettings() {
    elements.speed.value = Math.log2(settings.speed);
    elements.beta.value = settings.beta;
    elements.labelModes.forEach(input => { input.checked = input.value === settings.labelMode; });
    elements.colorcode.setAttribute("aria-pressed", String(settings.colorcode));
    updateSettingOutputs();
  }

  function updateSettingOutputs() {
    elements.speedOutput.value = `${formatSpeed(settings.speed)}×`;
    elements.speedOutput.textContent = elements.speedOutput.value;
    elements.betaOutput.value = `β = ${settings.beta.toFixed(2)}`;
    elements.betaOutput.textContent = elements.betaOutput.value;
  }

  function readStoredSettings() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch { return {}; }
  }

  function storeSettings() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
  }

  function createSvg(tag, attributes) {
    const element = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    return element;
  }

  function validNumber(value, fallback) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  function formatSpeed(speed) {
    if (Math.abs(speed - 1) < .005) return "1";
    return speed < 1 ? speed.toFixed(2) : speed.toFixed(speed < 2 ? 2 : 1);
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }
})();
