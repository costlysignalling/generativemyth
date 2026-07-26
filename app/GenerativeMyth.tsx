"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateMyth, type Language } from "./myth";

type SuccessMode = "single" | "several" | "all";
type Tab = "visual" | "myth";
type City = { x: number; y: number; rotation: number };
type RenderResult = { drawn: number; truncated: boolean };

const MAX_CITIES = 30_000;
const DISTANCE = 30;

const copy = {
  cz: {
    eyebrow: "Rekurzivní vyprávěcí stroj",
    title: "Generativní Mýtus",
    intro:
      "Měňte rodokmen identických princů. Obraz i příběh vznikají okamžitě ve vašem prohlížeči.",
    controls: "Pravidla světa",
    brothers: "Bratři",
    brothersHint: "Počet synů, cest a měst v každém světě.",
    success: "Kdo uspěje?",
    single: "Jeden",
    several: "Několik",
    all: "Všichni",
    prince: "Číslo úspěšného prince",
    vector: "Úspěšní princové",
    vectorHint: "Čísla oddělte čárkou, například 1, 2, 3.",
    generations: "Generace",
    visual: "Obraz",
    myth: "Mýtus",
    citySize: "Velikost měst",
    zoom: "Přiblížení",
    opacity: "Neprůhlednost",
    advanced: "Vzhled a export",
    cityColor: "Barva měst",
    landColor: "Barva krajiny",
    reset: "Výchozí vzhled",
    downloadSvg: "Stáhnout SVG",
    downloadPng: "Stáhnout PNG",
    copy: "Kopírovat text",
    copied: "Zkopírováno",
    cities: "měst v obrazci",
    survivors: "úspěšných linií",
    live: "živý výpočet",
    truncated:
      "Náhled zobrazuje první část obrazce. SVG zachová stejný bezpečný limit.",
    canvasLabel: "Rekurzivní geometrický obraz generativního mýtu",
    language: "Jazyk",
  },
  en: {
    eyebrow: "A recursive storytelling engine",
    title: "Generative Myth",
    intro:
      "Alter the lineage of identical princes. Image and story unfold instantly in your browser.",
    controls: "Rules of the world",
    brothers: "Brothers",
    brothersHint: "The number of sons, paths and cities in every world.",
    success: "Who succeeds?",
    single: "One",
    several: "Several",
    all: "All",
    prince: "Successful prince number",
    vector: "Successful princes",
    vectorHint: "Separate numbers with commas, for example 1, 2, 3.",
    generations: "Generations",
    visual: "Image",
    myth: "Myth",
    citySize: "City size",
    zoom: "Zoom",
    opacity: "Opacity",
    advanced: "Appearance & export",
    cityColor: "City colour",
    landColor: "Land colour",
    reset: "Reset appearance",
    downloadSvg: "Download SVG",
    downloadPng: "Download PNG",
    copy: "Copy text",
    copied: "Copied",
    cities: "cities in the pattern",
    survivors: "successful lineages",
    live: "live calculation",
    truncated:
      "The preview shows the first part of the pattern. SVG uses the same safe limit.",
    canvasLabel: "Recursive geometric image of the generative myth",
    language: "Language",
  },
} as const;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

function parseSurvivors(value: string, brothers: number) {
  const parsed = value
    .split(/[\s,;]+/)
    .map(Number)
    .filter((item) => Number.isInteger(item) && item >= 1 && item <= brothers);
  return [...new Set(parsed)].sort((a, b) => a - b);
}

function countLabel(brothers: number, survivors: number, generations: number) {
  if (generations === 0) return "1";
  if (survivors === 0) return String(1 + brothers);
  const logTerm =
    Math.log10(brothers) +
    (survivors === 1
      ? Math.log10(generations)
      : generations * Math.log10(survivors) - Math.log10(survivors - 1));
  if (logTerm < 12) {
    const total =
      survivors === 1
        ? 1 + brothers * generations
        : 1 + (brothers * (survivors ** generations - 1)) / (survivors - 1);
    return Math.round(total).toLocaleString();
  }
  const exponent = Math.floor(logTerm);
  const coefficient = 10 ** (logTerm - exponent);
  return `${coefficient.toFixed(2)} × 10^${exponent}`;
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
  const [mode, setMode] = useState<SuccessMode>("single");
  const [single, setSingle] = useState(5);
  const [several, setSeveral] = useState("1, 2, 3");
  const [generations, setGenerations] = useState(0);
  const [logSize, setLogSize] = useState(0);
  const [logZoom, setLogZoom] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [cityColor, setCityColor] = useState("#f4efe1");
  const [landColor, setLandColor] = useState("#121515");
  const [tab, setTab] = useState<Tab>("visual");
  const [renderResult, setRenderResult] = useState<RenderResult>({
    drawn: 1,
    truncated: false,
  });
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const t = copy[language];

  const survivors = useMemo(() => {
    if (mode === "all")
      return Array.from({ length: brothers }, (_, index) => index + 1);
    if (mode === "single") return [clamp(single, 1, brothers)];
    const parsed = parseSurvivors(several, brothers);
    return parsed.length ? parsed : [1];
  }, [brothers, mode, several, single]);

  const myth = useMemo(
    () =>
      tab === "myth"
        ? generateMyth(language, brothers, survivors, generations)
        : "",
    [brothers, generations, language, survivors, tab],
  );

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

    const field = 100 / 2 ** logZoom;
    const scale = Math.min(width, height) / (field * 2);
    const radius = 5 * 2 ** logSize;
    const fill = hexToRgba(cityColor, opacity);

    context.save();
    context.translate(width / 2, height / 2);
    context.scale(scale, -scale);
    context.fillStyle = fill;

    const result = walkCities(brothers, survivors, generations, (city) => {
      const margin = radius * 1.5;
      if (
        city.x + margin < -field ||
        city.x - margin > field ||
        city.y + margin < -field ||
        city.y - margin > field
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
    drawCanvas();
    const observer = new ResizeObserver(drawCanvas);
    if (stageRef.current) observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, [drawCanvas]);

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
    setCityColor("#f4efe1");
    setLandColor("#121515");
  };

  const copyMyth = async () => {
    await navigator.clipboard.writeText(myth);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="app-shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p className="intro">{t.intro}</p>
        </div>
        <div className="language-switch" aria-label={t.language}>
          <button
            className={language === "cz" ? "active" : ""}
            onClick={() => setLanguage("cz")}
            type="button"
          >
            CZ
          </button>
          <button
            className={language === "en" ? "active" : ""}
            onClick={() => setLanguage("en")}
            type="button"
          >
            EN
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="control-panel">
          <div className="panel-heading">
            <span>01</span>
            <h2>{t.controls}</h2>
          </div>

          <label className="field">
            <span>{t.brothers}</span>
            <input
              type="number"
              min="3"
              max="1000"
              value={brothers}
              onChange={(event) => {
                const next = clamp(Number(event.target.value), 3, 1000);
                setBrothers(next);
                setSingle((current) => clamp(current, 1, next));
              }}
            />
            <small>{t.brothersHint}</small>
          </label>

          <fieldset className="field">
            <legend>{t.success}</legend>
            <div className="segmented">
              {(["single", "several", "all"] as SuccessMode[]).map((item) => (
                <button
                  className={mode === item ? "active" : ""}
                  key={item}
                  onClick={() => setMode(item)}
                  type="button"
                >
                  {t[item]}
                </button>
              ))}
            </div>
          </fieldset>

          {mode === "single" && (
            <label className="field">
              <span>{t.prince}</span>
              <input
                type="number"
                min="1"
                max={brothers}
                value={single}
                onChange={(event) =>
                  setSingle(clamp(Number(event.target.value), 1, brothers))
                }
              />
            </label>
          )}

          {mode === "several" && (
            <label className="field">
              <span>{t.vector}</span>
              <input
                type="text"
                value={several}
                onChange={(event) => setSeveral(event.target.value)}
              />
              <small>{t.vectorHint}</small>
            </label>
          )}

          <label className="field">
            <span>{t.generations}</span>
            <input
              type="number"
              min="0"
              max="10000"
              value={generations}
              onChange={(event) =>
                setGenerations(clamp(Number(event.target.value), 0, 10000))
              }
            />
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
            <div className="live-badge">
              <i />
              {t.live}
            </div>
          </div>

          {tab === "visual" ? (
            <>
              <div className="canvas-stage" ref={stageRef}>
                <canvas ref={canvasRef} aria-label={t.canvasLabel} />
                <div className="north-mark" aria-hidden="true">
                  N
                </div>
                <div className="stage-index" aria-hidden="true">
                  GM / {String(generations).padStart(2, "0")}
                </div>
              </div>
              <div className="status-row">
                <p>
                  <strong>
                    {countLabel(brothers, survivors.length, generations)}
                  </strong>{" "}
                  {t.cities}
                </p>
                <p>
                  <strong>{survivors.length}</strong> {t.survivors}
                </p>
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
        </section>
      </div>
    </main>
  );
}
