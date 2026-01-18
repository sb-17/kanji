import { useEffect, useState } from "react";
import "./KanjiStrokeViewer.css";

type KanjiStrokeViewerProps = {
  kanji: string;
};

export default function KanjiStrokeViewer({ kanji }: KanjiStrokeViewerProps) {
  const [frames, setFrames] = useState<string[][]>([]);

  useEffect(() => {
    async function loadSVG() {
      try {
        const fileName = kanjiToSvgName(kanji);
        const res = await fetch(`/kanjii/kanjiVG/${fileName}`);
        if (!res.ok) {
          console.error("SVG not found:", fileName);
          return;
        }
        const svgText = await res.text();

        const paths = getStrokePaths(svgText);
        const newFrames = paths.map((_, i) => paths.slice(0, i + 1));
        setFrames(newFrames);
      } catch (err) {
        console.error("Error loading SVG:", err);
      }
    }

    loadSVG();
  }, [kanji]);

  return (
    <div className="kanji-stroke-section">
      <strong>Stroke order</strong>

      <div className="kanji-stroke-container">
        {frames.map((frame, i) => (
          <svg
            key={i}
            className="kanji-frame"
            viewBox="0 0 110 110"
            style={{ width: "100px", height: "auto" }}
          >
            <line
              x1="0"
              y1="55"
              x2="110"
              y2="55"
              stroke="gray"
              strokeWidth={1}
            />
            <line
              x1="55"
              y1="0"
              x2="55"
              y2="110"
              stroke="gray"
              strokeWidth={1}
            />

            {frame.map((d, j) => (
              <path key={j} d={d} stroke="white" strokeWidth={3} fill="none" />
            ))}
          </svg>
        ))}
      </div>
    </div>
  );
}

function getStrokePaths(svgText: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");

  const groups = Array.from(doc.getElementsByTagName("g"));
  const strokeGroup = groups.find((g) => g.id && g.id.includes("StrokePaths"));
  if (!strokeGroup) {
    console.warn("No StrokePaths group found");
    return [];
  }

  const pathElements = strokeGroup.getElementsByTagName("path");
  const paths = Array.from(pathElements)
    .map((p) => p.getAttribute("d"))
    .filter(Boolean) as string[];

  return paths;
}

function kanjiToSvgName(kanji: string) {
  const codePoint = kanji.codePointAt(0);
  if (!codePoint) throw new Error("Invalid kanji");

  return codePoint.toString(16).padStart(5, "0") + ".svg";
}
