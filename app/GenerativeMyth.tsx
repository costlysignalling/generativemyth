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
    title: "Generativní Mýtus",
    brothers: "b : brothers : bratři : base",
    success: "s : succeeded : splnil : survived : symbol : sign",
    single: "1 : one : jeden",
    several: "+ : more : více",
    all: "* : all : všichni",
    prince: "s : succeeded : splnil : survived : symbol : sign",
    vector:
      "s : succeeded : splnil : survived : symbol : sign (vector : vektor)",
    generations: "g : generations : generace",
    visual: "plot : obraz",
    myth: "myth : mýtus",
    citySize: "city size : velikost města",
    zoom: "zoom",
    opacity: "city opacity : neprůhlednost města",
    advanced: "advanced visual settings : vzhled",
    cityColor: "city color : barva města",
    landColor: "land color : barva krajiny",
    reset: "reset : výchozí",
    downloadSvg: "download SVG : stáhnout SVG",
    downloadPng: "download PNG : stáhnout PNG",
    copy: "copy : kopírovat",
    copied: "Zkopírováno",
    truncated:
      "… obraz přesahuje bezpečný limit 30 000 měst",
    canvasLabel: "Rekurzivní geometrický obraz generativního mýtu",
    language: "Jazyk",
  },
  en: {
    title: "Generative Myth",
    brothers: "b : brothers : bratři : base",
    success: "s : succeeded : splnil : survived : symbol : sign",
    single: "1 : one : jeden",
    several: "+ : more : více",
    all: "* : all : všichni",
    prince: "s : succeeded : splnil : survived : symbol : sign",
    vector:
      "s : succeeded : splnil : survived : symbol : sign (vector : vektor)",
    generations: "g : generations : generace",
    visual: "plot : obraz",
    myth: "myth : mýtus",
    citySize: "city size : velikost města",
    zoom: "zoom",
    opacity: "city opacity : neprůhlednost města",
    advanced: "advanced visual settings : vzhled",
    cityColor: "city color : barva města",
    landColor: "land color : barva krajiny",
    reset: "reset : výchozí",
    downloadSvg: "download SVG : stáhnout SVG",
    downloadPng: "download PNG : stáhnout PNG",
    copy: "copy : kopírovat",
    copied: "Copied",
    truncated:
      "… image exceeds the safe limit of 30,000 cities",
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
        <h1>{t.title}</h1>
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
          </div>

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
        </section>
      </div>
    </main>
  );
}
