import React, { useEffect, useMemo, useRef, useState } from "react";
import { geoNaturalEarth1, geoPath, GeoProjection } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import { Job } from "./types";
import { lookupCoords } from "./data/cityCoords";

const W = 960;
const H = 500;

type JobMarker = {
  key: string;
  x: number;
  y: number;
  label: string;
  region: "us" | "uk" | "eu" | "china" | "hk" | "sg" | "me" | "international" | "other";
  jobs: Job[];
};

function regionColor(r: JobMarker["region"]): string {
  switch (r) {
    case "us": return "#3b82f6";
    case "uk": return "#f59e0b";
    case "eu": return "#22d3ee";
    case "china": return "#ef4444";
    case "hk": return "#a855f7";
    case "sg": return "#10b981";
    case "me": return "#eab308";
    case "international": return "#94a3b8";
    default: return "#94a3b8";
  }
}

export function WorldMap({ jobs }: { jobs: Job[] }) {
  const [countryPaths, setCountryPaths] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hover, setHover] = useState<JobMarker | null>(null);
  const [projection, setProjection] = useState<GeoProjection | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/world-countries-50m.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((topo: Topology) => {
        if (cancelled) return;
        const countries: any = feature(topo, topo.objects.countries as any);
        const proj = geoNaturalEarth1().fitSize([W, H], countries);
        const pathGen = geoPath(proj);
        const paths: string[] = (countries.features as any[])
          .map((f: any) => pathGen(f))
          .filter((d): d is string => !!d);
        setCountryPaths(paths);
        setProjection(() => proj);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const markers = useMemo<JobMarker[]>(() => {
    if (!projection) return [];
    const grouped = new Map<string, JobMarker>();
    for (const job of jobs) {
      const c = lookupCoords(job.location);
      if (!c) continue;
      const coords = projection([c.lng, c.lat]);
      if (!coords) continue;
      const [x, y] = coords;
      const key = `${c.label}|${job.region ?? "other"}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.jobs.push(job);
      } else {
        grouped.set(key, {
          key,
          x, y,
          label: c.label,
          region: (job.region ?? "other") as JobMarker["region"],
          jobs: [job],
        });
      }
    }
    return Array.from(grouped.values());
  }, [jobs, projection]);

  const totalMarked = markers.reduce((s, m) => s + m.jobs.length, 0);

  return (
    <div className="world-map-wrapper" ref={wrapperRef}>
      <div className="world-map-header">
        <h3>🌍 岗位地理分布（{totalMarked} 个有坐标，共 {jobs.length} 个岗位）</h3>
        <div className="world-map-legend">
          <span><span className="legend-dot" style={{ background: "#3b82f6" }} /> 🇺🇸 美国</span>
          <span><span className="legend-dot" style={{ background: "#f59e0b" }} /> 🇬🇧 UK</span>
          <span><span className="legend-dot" style={{ background: "#22d3ee" }} /> 🇪🇺 EU</span>
        </div>
      </div>
      <div className="world-map-svg-wrapper">
        {loadError && <div className="world-map-error">加载地图失败：{loadError}</div>}
        <svg viewBox={`0 0 ${W} ${H}`} className="world-map-svg" preserveAspectRatio="xMidYMid meet">
          {/* Ocean (sphere) */}
          <rect x={0} y={0} width={W} height={H} fill="#0b1324" />
          {/* Countries */}
          <g className="world-map-countries">
            {countryPaths.map((d, i) => (
              <path key={i} d={d} fill="#1e293b" stroke="#334155" strokeWidth={0.4} />
            ))}
          </g>

          {/* Job markers */}
          {markers.map((m) => {
            const r = 4 + Math.min(6, Math.sqrt(m.jobs.length) * 2.5);
            return (
              <g key={m.key}
                 onMouseEnter={() => setHover(m)}
                 onMouseLeave={() => setHover((h) => (h?.key === m.key ? null : h))}
                 style={{ cursor: "pointer" }}>
                <circle cx={m.x} cy={m.y} r={r + 3} fill={regionColor(m.region)} fillOpacity={0.2} />
                <circle cx={m.x} cy={m.y} r={r} fill={regionColor(m.region)} stroke="#fff" strokeWidth={0.9} />
                {m.jobs.length > 1 && (
                  <text x={m.x} y={m.y + 3} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff">
                    {m.jobs.length}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {hover && (
          <div className="world-map-tooltip"
               style={{
                 left: `${(hover.x / W) * 100}%`,
                 top: `${(hover.y / H) * 100}%`,
               }}>
            <div className="tooltip-city">{hover.label} · {hover.jobs.length} 个岗位</div>
            <ul>
              {hover.jobs.slice(0, 10).map((j) => (
                <li key={j.id}>
                  <b>{j.organization}</b> — {j.title}
                </li>
              ))}
              {hover.jobs.length > 10 && <li>⋯ +{hover.jobs.length - 10} 个</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
