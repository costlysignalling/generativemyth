"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { encodeMyth, generateMyth, type Language } from "./myth";

type Tab = "visual" | "myth";
type City = { x: number; y: number; rotation: number };
type RenderResult = { drawn: number; truncated: boolean };

const MAX_CITIES = 30_000;
const DISTANCE = 30;

const copy = {
  cz: {
    title: "Generativní mýtus",
    brothers: "b : brothers : bratři : base",
    success: "s : succeeded : splnil : survived : symbol : sign",
    generations: "g : generations : generace",
    visual: "tvar",
    myth: "mýtus",
    citySize: "velikost města",
    zoom: "přiblížení",
    opacity: "neprůhlednost města",
    advanced: "vzhled",
    cityColor: "barva města",
    landColor: "barva krajiny",
    reset: "výchozí",
    downloadSvg: "stáhnout SVG",
    downloadPng: "stáhnout PNG",
    copy: "kopírovat",
    copied: "Zkopírováno",
    truncated:
      "… obraz přesahuje bezpečný limit 30 000 měst",
    canvasLabel: "Rekurzivní geometrický obraz generativního mýtu",
  },
  en: {
    title: "Generative Myth",
    brothers: "b : brothers : base",
    success: "s : succeeded : survived : symbol : sign",
    generations: "g : generations",
    visual: "shape",
    myth: "myth",
    citySize: "city size",
    zoom: "zoom",
    opacity: "city opacity",
    advanced: "visual settings",
    cityColor: "city color",
    landColor: "land color",
    reset: "default",
    downloadSvg: "download SVG",
    downloadPng: "download PNG",
    copy: "copy",
    copied: "Copied",
    truncated:
      "… image exceeds the safe limit of 30,000 cities",
    canvasLabel: "Recursive geometric image of the generative myth",
  },
  de: {
    title: "Generativer Mythos",
    brothers: "b : brothers : Brüder : base",
    success: "s : succeeded : siegreich : survived : symbol : sign",
    generations: "g : generations : Generationen",
    visual: "Form",
    myth: "Mythos",
    citySize: "Stadtgröße",
    zoom: "Vergrößerung",
    opacity: "Deckkraft der Stadt",
    advanced: "Darstellung",
    cityColor: "Stadtfarbe",
    landColor: "Landfarbe",
    reset: "Standard",
    downloadSvg: "SVG herunterladen",
    downloadPng: "PNG herunterladen",
    copy: "kopieren",
    copied: "Kopiert",
    truncated: "… das Bild überschreitet die sichere Grenze von 30.000 Städten",
    canvasLabel: "Rekursives geometrisches Bild des generativen Mythos",
  },
  fr: {
    title: "Mythe génératif",
    brothers: "b : brothers : base",
    success: "s : succès : survécu : symbole : signe",
    generations: "g : générations",
    visual: "forme",
    myth: "mythe",
    citySize: "taille de la ville",
    zoom: "zoom",
    opacity: "opacité de la ville",
    advanced: "apparence",
    cityColor: "couleur de la ville",
    landColor: "couleur du paysage",
    reset: "défaut",
    downloadSvg: "télécharger le SVG",
    downloadPng: "télécharger le PNG",
    copy: "copier",
    copied: "Copié",
    truncated: "… l’image dépasse la limite sûre de 30 000 villes",
    canvasLabel: "Image géométrique récursive du mythe génératif",
  },
} as const;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

function parseSurvivors(value: string, brothers: number) {
  const parsed = value
    .split(/[\s,;]+/)
    .map(Number)
    .filter((item) => Number.isInteger(item) && item >= 1 && item <= brothers);
  return [...new Set(parsed)];
}

function polygonPoints(city: City, brothers: number, radius: number) {
  const sides = Math.min(brothers, 72);
  return Array.from({ length: sides }, (_, index) => {
    const theta = Math.PI * (0.5 + city.rotation + (index * 2) / sides);
    return {
      x: city.x + Math.cos(theta) * radius,
      y: city.y + Math.sin(theta) * radius,
    };
  });
}

function walkCities(
  brothers: number,
  survivors: number[],
  generations: number,
  visit: (city: City) => void,
): RenderResult {
  let drawn = 0;
  let active: City[] = [{ x: 0, y: 0, rotation: 0 }];
  visit(active[0]);
  drawn += 1;

  for (let level = 1; level <= generations; level += 1) {
    const nextActive: City[] = [];
    for (const parent of active) {
      for (let index = 0; index < brothers; index += 1) {
        if (drawn >= MAX_CITIES) return { drawn, truncated: true };
        const rotation = parent.rotation + (index * 2) / brothers;
        const theta = Math.PI * (0.5 + rotation);
        const child = {
          x: parent.x + Math.cos(theta) * DISTANCE,
          y: parent.y + Math.sin(theta) * DISTANCE,
          rotation,
        };
        visit(child);
        drawn += 1;
        if (survivors.includes(index + 1)) nextActive.push(child);
      }
    }
    active = nextActive;
    if (active.length === 0) break;
  }
  return { drawn, truncated: false };
}

function hexToRgba(hex: string, opacity: number) {
  const value = hex.replace("#", "");
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function download(name: string, blob: Blob) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(href);
}

export default function GenerativeMyth() {
  const [language, setLanguage] = useState<Language>("cz");
  const [brothers, setBrothers] = useState(5);
  const [brothersInput, setBrothersInput] = useState("5");
  const [successfulInput, setSuccessfulInput] = useState("5");
  const [generations, setGenerations] = useState(0);
  const [generationsInput, setGenerationsInput] = useState("0");
  const [logSize, setLogSize] = useState(0);
  const [logZoom, setLogZoom] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [cityColor, setCityColor] = useState("#ffffff");
  const [landColor, setLandColor] = useState("#000000");
  const [tab, setTab] = useState<Tab>("visual");
  const [raw, setRaw] = useState(false);
  const [renderResult, setRenderResult] = useState<RenderResult>({
    drawn: 1,
    truncated: false,
  });
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const t = copy[language];

  const survivors = useMemo(
    () => parseSurvivors(successfulInput, brothers),
    [brothers, successfulInput],
  );

  const myth = useMemo(
    () => {
      if (tab !== "myth") return "";
      const story = generateMyth(language, brothers, survivors, generations);
      return raw ? encodeMyth(story, language, brothers) : story;
    },
    [brothers, generations, language, raw, survivors, tab],
  );

  useEffect(() => {
    document.documentElement.lang = language === "cz" ? "cs" : language;
  }, [language]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const bounds = stage.getBoundingClientRect();
    const width = Math.max(320, Math.floor(bounds.width));
    const height = Math.max(420, Math.floor(bounds.height));
    const density = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * density;
    canvas.height = height * density;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(density, density);
    context.fillStyle = landColor;
    context.fillRect(0, 0, width, height);

    const fieldY = 100 / 2 ** logZoom;
    const scale = height / (fieldY * 2);
    const fieldX = width / (scale * 2);
    const radius = 5 * 2 ** logSize;
    const fill = hexToRgba(cityColor, opacity);

    context.save();
    context.translate(width / 2, height / 2);
    context.scale(scale, -scale);
    context.fillStyle = fill;

    const result = walkCities(brothers, survivors, generations, (city) => {
      const margin = radius * 1.5;
      if (
        city.x + margin < -fieldX ||
        city.x - margin > fieldX ||
        city.y + margin < -fieldY ||
        city.y - margin > fieldY
      )
        return;
      const points = polygonPoints(city, brothers, radius);
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
      context.closePath();
      context.fill();
    });
    context.restore();
    setRenderResult(result);
  }, [
    brothers,
    cityColor,
    generations,
    landColor,
    logSize,
    logZoom,
    opacity,
    survivors,
  ]);

  useEffect(() => {
    if (tab !== "visual") return;
    const frame = window.requestAnimationFrame(drawCanvas);
    const observer = new ResizeObserver(drawCanvas);
    if (stageRef.current) observer.observe(stageRef.current);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [drawCanvas, tab]);

  const exportSvg = () => {
    const size = 1600;
    const field = 100 / 2 ** logZoom;
    const scale = size / (field * 2);
    const radius = 5 * 2 ** logSize;
    const shapes: string[] = [];
    walkCities(brothers, survivors, generations, (city) => {
      const points = polygonPoints(city, brothers, radius)
        .map(
          (point) =>
            `${((point.x + field) * scale).toFixed(2)},${(
              (field - point.y) *
              scale
            ).toFixed(2)}`,
        )
        .join(" ");
      shapes.push(`<polygon points="${points}"/>`);
    });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="100%" height="100%" fill="${landColor}"/><g fill="${cityColor}" fill-opacity="${opacity}">${shapes.join("")}</g></svg>`;
    download("generative-myth.svg", new Blob([svg], { type: "image/svg+xml" }));
  };

  const exportPng = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) download("generative-myth.png", blob);
    }, "image/png");
  };

  const resetAppearance = () => {
    setLogSize(0);
    setLogZoom(0);
    setOpacity(1);
    setCityColor("#ffffff");
    setLandColor("#000000");
  };

  const setSuccessful = (values: number[]) =>
    setSuccessfulInput(values.join(", "));

  const applyBrothers = (value: string) => {
    if (!/^\d+$/.test(value)) return;
    const next = Number(value);
    if (next < 3 || next > 1000) return;
    setBrothers(next);
    setSuccessful(parseSurvivors(successfulInput, next));
  };

  const commitBrothers = () => {
    const next = clamp(Number(brothersInput), 3, 1000);
    setBrothers(next);
    setBrothersInput(String(next));
    setSuccessful(parseSurvivors(successfulInput, next));
  };

  const stepBrothers = (direction: -1 | 1) => {
    const next = clamp(brothers + direction, 3, 1000);
    setBrothers(next);
    setBrothersInput(String(next));
    setSuccessful(parseSurvivors(successfulInput, next));
  };

  const applyGenerations = (value: string) => {
    if (!/^\d+$/.test(value)) return;
    const next = Number(value);
    if (next >= 0 && next <= 10000) setGenerations(next);
  };

  const commitGenerations = () => {
    const next = clamp(Number(generationsInput), 0, 10000);
    setGenerations(next);
    setGenerationsInput(String(next));
  };

  const stepGenerations = (direction: -1 | 1) => {
    const next = clamp(generations + direction, 0, 10000);
    setGenerations(next);
    setGenerationsInput(String(next));
  };

  const addSuccessful = () => {
    const used = new Set(survivors);
    const next = Array.from({ length: brothers }, (_, index) => index + 1).find(
      (value) => !used.has(value),
    );
    if (next !== undefined) setSuccessful([...survivors, next]);
  };

  const removeSuccessful = () => setSuccessful(survivors.slice(0, -1));

  const stepLastSuccessful = (direction: -1 | 1) => {
    if (survivors.length === 0) {
      if (direction > 0) setSuccessful([1]);
      return;
    }

    const next = [...survivors];
    const occupied = new Set(next.slice(0, -1));
    let candidate = next[next.length - 1] + direction;
    while (
      candidate >= 1 &&
      candidate <= brothers &&
      occupied.has(candidate)
    ) {
      candidate += direction;
    }
    if (candidate >= 1 && candidate <= brothers) {
      next[next.length - 1] = candidate;
      setSuccessful(next);
    }
  };

  const copyMyth = async () => {
    await navigator.clipboard.writeText(myth);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="app-shell">
      <header className="masthead">
        <h1>{t.title}</h1>
        <div className="language-select">
          <select
            aria-label="Language"
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
          >
            <option value="cz">CZ</option>
            <option value="en">EN</option>
            <option value="de">GE</option>
            <option value="fr">FR</option>
          </select>
        </div>
      </header>

      <div className="workspace">
        <aside className="control-panel">
          <label className="field">
            <span>{t.brothers}</span>
            <div className="number-control">
              <input
                inputMode="numeric"
                type="text"
                value={brothersInput}
                onChange={(event) => {
                  const value = event.target.value;
                  setBrothersInput(value);
                  applyBrothers(value);
                }}
                onBlur={commitBrothers}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
              />
              <div className="control-column arrow-column">
                <button
                  aria-label="Increase number of brothers"
                  onClick={() => stepBrothers(1)}
                  type="button"
                >
                  ▴
                </button>
                <button
                  aria-label="Decrease number of brothers"
                  disabled={brothers <= 3}
                  onClick={() => stepBrothers(-1)}
                  type="button"
                >
                  ▾
                </button>
              </div>
            </div>
          </label>

          <div className="field success-field">
            <span>{t.success}</span>
            <div className="success-vector">
              <input
                aria-label={t.success}
                inputMode="numeric"
                type="text"
                value={successfulInput}
                onChange={(event) => setSuccessfulInput(event.target.value)}
                onBlur={() => setSuccessful(survivors)}
              />
              <div className="control-column math-column">
                <button
                  aria-label="Add lowest unused successful brother"
                  disabled={survivors.length >= brothers}
                  onClick={addSuccessful}
                  title="Add lowest unused"
                  type="button"
                >
                  +
                </button>
                <button
                  aria-label="Remove last successful brother"
                  disabled={survivors.length === 0}
                  onClick={removeSuccessful}
                  title="Remove last"
                  type="button"
                >
                  −
                </button>
              </div>
              <div className="control-column arrow-column">
                <button
                  aria-label="Increase last successful brother"
                  onClick={() => stepLastSuccessful(1)}
                  title="Increase last"
                  type="button"
                >
                  ▴
                </button>
                <button
                  aria-label="Decrease last successful brother"
                  disabled={survivors.length === 0}
                  onClick={() => stepLastSuccessful(-1)}
                  title="Decrease last"
                  type="button"
                >
                  ▾
                </button>
              </div>
            </div>
          </div>

          <label className="field">
            <span>{t.generations}</span>
            <div className="number-control">
              <input
                inputMode="numeric"
                type="text"
                value={generationsInput}
                onChange={(event) => {
                  const value = event.target.value;
                  setGenerationsInput(value);
                  applyGenerations(value);
                }}
                onBlur={commitGenerations}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
              />
              <div className="control-column arrow-column">
                <button
                  aria-label="Increase generations"
                  onClick={() => stepGenerations(1)}
                  type="button"
                >
                  ▴
                </button>
                <button
                  aria-label="Decrease generations"
                  disabled={generations <= 0}
                  onClick={() => stepGenerations(-1)}
                  type="button"
                >
                  ▾
                </button>
              </div>
            </div>
          </label>

          <div className="rule" />

          <label className="range-field">
            <span>
              {t.opacity}
              <output>{Math.round(opacity * 100)}%</output>
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={opacity}
              onChange={(event) => setOpacity(Number(event.target.value))}
            />
          </label>

          <label className="range-field">
            <span>
              {t.citySize}
              <output>{(2 ** logSize).toFixed(2)}×</output>
            </span>
            <input
              type="range"
              min="-4"
              max="4"
              step="0.1"
              value={logSize}
              onChange={(event) => setLogSize(Number(event.target.value))}
            />
          </label>

          <label className="range-field">
            <span>
              {t.zoom}
              <output>{(2 ** logZoom).toFixed(2)}×</output>
            </span>
            <input
              type="range"
              min="-4"
              max="4"
              step="0.1"
              value={logZoom}
              onChange={(event) => setLogZoom(Number(event.target.value))}
            />
          </label>

          <details className="advanced">
            <summary>{t.advanced}</summary>
            <div className="colour-row">
              <label>
                <span>{t.cityColor}</span>
                <input
                  type="color"
                  value={cityColor}
                  onChange={(event) => setCityColor(event.target.value)}
                />
              </label>
              <label>
                <span>{t.landColor}</span>
                <input
                  type="color"
                  value={landColor}
                  onChange={(event) => setLandColor(event.target.value)}
                />
              </label>
            </div>
            <div className="button-stack">
              <button type="button" onClick={exportSvg}>
                {t.downloadSvg}
              </button>
              <button type="button" onClick={exportPng}>
                {t.downloadPng}
              </button>
              <button className="quiet" type="button" onClick={resetAppearance}>
                {t.reset}
              </button>
            </div>
          </details>
        </aside>

        <section className="output-panel">
          {tab === "visual" ? (
            <>
              <div className="canvas-stage" ref={stageRef}>
                <canvas ref={canvasRef} aria-label={t.canvasLabel} />
              </div>
              {renderResult.truncated && (
                <p className="notice">{t.truncated}</p>
              )}
            </>
          ) : (
            <article className="myth-panel">
              <div className="myth-actions">
                <span>
                  {t.myth} · {generations + 1}
                </span>
                <button type="button" onClick={copyMyth}>
                  {copied ? t.copied : t.copy}
                </button>
              </div>
              <pre>{myth}</pre>
            </article>
          )}

          <div className="output-toolbar">
            <div className="tabs" role="tablist">
              <button
                aria-selected={tab === "visual"}
                className={tab === "visual" ? "active" : ""}
                onClick={() => setTab("visual")}
                role="tab"
                type="button"
              >
                {t.visual}
              </button>
              <button
                aria-selected={tab === "myth"}
                className={tab === "myth" ? "active" : ""}
                onClick={() => setTab("myth")}
                role="tab"
                type="button"
              >
                {t.myth}
              </button>
            </div>
            {tab === "myth" && (
              <label className="raw-toggle">
                <input
                  checked={raw}
                  onChange={(event) => setRaw(event.target.checked)}
                  type="checkbox"
                />
                <span>raw</span>
              </label>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
