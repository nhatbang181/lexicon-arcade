import React, { useId } from 'react';
import { scaleBand, scaleLinear, scalePoint } from 'd3-scale';
import { arc as d3Arc, line as d3Line, pie as d3Pie, type PieArcDatum } from 'd3-shape';
import type { ChartKind, VisualSpec } from '../../core/content/schemas';
import { MapView } from '../../design/components/MapView';

export interface ChartRendererProps {
  visual: VisualSpec & { kind?: ChartKind };
  /** Optional explicit kind override when `visual` does not carry `kind`. */
  kind?: ChartKind;
  /** Optional outer figure title override. */
  title?: string;
  /** Compact density for tighter panels or 360px side-by-side layouts. */
  compact?: boolean;
  className?: string;
}

type ChartData = NonNullable<VisualSpec['chart']>;
type TableData = NonNullable<VisualSpec['table']>;
type ProcessData = NonNullable<VisualSpec['process']>;
type MapsData = NonNullable<VisualSpec['maps']>;

const TIME_LABEL_RE = /\b(year|quarter|month|date|time|decade|period)\b/i;
const TIME_CATEGORY_RE = /^\d{4}(\s*Q[1-4])?$/i;

/** Infer chart kind when `visual.kind` is not provided. */
export function resolveVisualKind(
  visual: VisualSpec & { kind?: ChartKind },
  explicitKind?: ChartKind,
): ChartKind {
  if (explicitKind) return explicitKind;
  if (visual.kind) return visual.kind;
  if (visual.maps) return 'map';
  if (visual.process) return 'process';
  if (visual.chart && visual.table) return 'mixed';
  if (visual.table) return 'table';
  if (visual.chart) {
    if (visual.chart.pie) return 'pie';
    const isTimeSeries =
      (visual.chart.xLabel ? TIME_LABEL_RE.test(visual.chart.xLabel) : false) ||
      visual.chart.categories.every((c) => TIME_CATEGORY_RE.test(c.trim()));
    return isTimeSeries && visual.chart.categories.length >= 5 ? 'line' : 'bar';
  }
  return 'bar';
}

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '');
}

function wrapText(text: string, maxChars: number, maxLines = 3): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current) lines.push(current);

  if (lines.length > maxLines) {
    return lines.slice(0, maxLines);
  }
  return lines;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '';
  if (Number.isInteger(value)) {
    // Preserve 4-digit years like 1908/2025 without thousand separators.
    if (Math.abs(value) >= 10000) {
      return value.toLocaleString('en-GB');
    }
    return String(value);
  }
  return Number(value.toFixed(2)).toString();
}

function computeNiceMax(values: number[]): number {
  const maxVal = Math.max(0, ...values);
  if (maxVal === 0) return 10;
  return maxVal * 1.12;
}

/**
 * Monochrome IELTS-exam series fills using CSS tokens + SVG patterns.
 * Works cleanly in dark, light, and exam modes with zero hard-coded colors.
 */
const SERIES_PATTERN_COUNT = 6;

function getSeriesFill(uid: string, index: number): string {
  const slot = index % SERIES_PATTERN_COUNT;
  switch (slot) {
    case 0:
      return 'var(--color-text)';
    case 1:
      return `url(#${uid}-pat-diag)`;
    case 2:
      return 'color-mix(in srgb, var(--color-text) 52%, var(--color-surface))';
    case 3:
      return `url(#${uid}-pat-rev)`;
    case 4:
      return 'color-mix(in srgb, var(--color-text) 22%, var(--color-surface))';
    case 5:
    default:
      return `url(#${uid}-pat-dots)`;
  }
}

const PatternDefs: React.FC<{ uid: string }> = ({ uid }) => (
  <defs>
    <pattern
      id={`${uid}-pat-diag`}
      width="8"
      height="8"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(45)"
    >
      <rect width="8" height="8" fill="var(--color-surface)" />
      <line
        x1="0"
        y1="0"
        x2="0"
        y2="8"
        stroke="var(--color-text)"
        strokeWidth="2.5"
        strokeOpacity="0.82"
      />
    </pattern>

    <pattern
      id={`${uid}-pat-rev`}
      width="8"
      height="8"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(-45)"
    >
      <rect
        width="8"
        height="8"
        fill="color-mix(in srgb, var(--color-text) 10%, var(--color-surface))"
      />
      <line
        x1="0"
        y1="0"
        x2="0"
        y2="8"
        stroke="var(--color-text)"
        strokeWidth="2"
        strokeOpacity="0.72"
      />
    </pattern>

    <pattern id={`${uid}-pat-dots`} width="7" height="7" patternUnits="userSpaceOnUse">
      <rect width="7" height="7" fill="var(--color-surface)" />
      <circle cx="3.5" cy="3.5" r="1.4" fill="var(--color-text)" fillOpacity="0.85" />
    </pattern>
  </defs>
);

// ---------------------------------------------------------------------------
// 1. Grouped Bar Chart (d3-scale: scaleBand + scaleLinear)
// ---------------------------------------------------------------------------

const BarChartView: React.FC<{
  chart: ChartData;
  uid: string;
  compact: boolean;
}> = ({ chart, uid, compact }) => {
  const width = 640;
  const height = compact ? 300 : 350;
  const margin = { top: 26, right: 20, bottom: chart.xLabel ? 68 : 50, left: 58 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const allValues = chart.series.flatMap((s) => s.values);
  const yScale = scaleLinear()
    .domain([0, computeNiceMax(allValues)])
    .nice(5)
    .range([innerH, 0]);

  const x0 = scaleBand<string>()
    .domain(chart.categories)
    .range([0, innerW])
    .paddingInner(0.22)
    .paddingOuter(0.1);

  const seriesNames = chart.series.map((s) => s.name);
  const x1 = scaleBand<string>()
    .domain(seriesNames)
    .range([0, x0.bandwidth()])
    .paddingInner(chart.series.length > 1 ? 0.1 : 0);

  const yTicks = yScale.ticks(5);
  const totalBars = chart.categories.length * chart.series.length;
  const showBarValues = x1.bandwidth() >= 18 && totalBars <= 24;

  return (
    <div className="space-y-2.5" data-testid="chart-bar">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text)' }}>
          {chart.title}
        </h4>
        {chart.unit && (
          <span
            className="text-xs tabular-nums shrink-0"
            style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}
          >
            Unit: {chart.unit}
          </span>
        )}
      </div>

      {/* Legend */}
      {chart.series.length > 1 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          {chart.series.map((s, idx) => (
            <div key={s.name} className="inline-flex items-center gap-1.5">
              <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
                <PatternDefs uid={`${uid}-lg`} />
                <rect
                  x="0.75"
                  y="0.75"
                  width="14.5"
                  height="10.5"
                  rx="1.5"
                  fill={getSeriesFill(`${uid}-lg`, idx)}
                  stroke="var(--color-text)"
                  strokeWidth="1.2"
                />
              </svg>
              <span style={{ color: 'var(--color-text)' }}>{s.name}</span>
            </div>
          ))}
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto block"
        role="img"
        aria-label={chart.title}
      >
        <PatternDefs uid={uid} />
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Horizontal gridlines & Y ticks */}
          {yTicks.map((tick) => {
            const y = yScale(tick);
            return (
              <g key={tick} transform={`translate(0, ${y})`}>
                <line
                  x1={0}
                  x2={innerW}
                  y1={0}
                  y2={0}
                  stroke={tick === 0 ? 'var(--color-text)' : 'var(--color-border)'}
                  strokeWidth={tick === 0 ? 1.5 : 1}
                  strokeDasharray={tick === 0 ? undefined : '3 3'}
                />
                <text
                  x={-8}
                  y={0}
                  textAnchor="end"
                  dominantBaseline="central"
                  fontSize={11}
                  style={{
                    fill: 'var(--color-text-dim)',
                    fontFamily: 'var(--font-mono)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatNumber(tick)}
                </text>
              </g>
            );
          })}

          {/* Y axis line */}
          <line
            x1={0}
            x2={0}
            y1={0}
            y2={innerH}
            stroke="var(--color-text)"
            strokeWidth={1.5}
          />

          {/* Y axis label */}
          {chart.yLabel && (
            <text
              transform={`translate(-44, ${innerH / 2}) rotate(-90)`}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              style={{ fill: 'var(--color-text-dim)', fontFamily: 'var(--font-ui)' }}
            >
              {chart.yLabel}
            </text>
          )}

          {/* Grouped bars */}
          {chart.categories.map((cat, catIdx) => {
            const catX = x0(cat) ?? 0;
            const labelLines = wrapText(cat, chart.categories.length > 4 ? 12 : 16, 2);

            return (
              <g key={cat} transform={`translate(${catX}, 0)`}>
                {chart.series.map((s, sIdx) => {
                  const val = s.values[catIdx] ?? 0;
                  const bx = x1(s.name) ?? 0;
                  const bw = Math.max(4, x1.bandwidth());
                  const by = yScale(val);
                  const bh = Math.max(0, innerH - by);

                  return (
                    <g key={s.name}>
                      <rect
                        x={bx}
                        y={by}
                        width={bw}
                        height={bh}
                        fill={getSeriesFill(uid, sIdx)}
                        stroke="var(--color-text)"
                        strokeWidth={1.2}
                      />
                      {showBarValues && (
                        <text
                          x={bx + bw / 2}
                          y={Math.max(8, by - 5)}
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight={600}
                          style={{
                            fill: 'var(--color-text)',
                            fontFamily: 'var(--font-mono)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {formatNumber(val)}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* X category label */}
                <text
                  x={x0.bandwidth() / 2}
                  y={innerH + 16}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={500}
                  style={{ fill: 'var(--color-text)', fontFamily: 'var(--font-ui)' }}
                >
                  {labelLines.map((lineText, lIdx) => (
                    <tspan key={lIdx} x={x0.bandwidth() / 2} dy={lIdx === 0 ? 0 : 13}>
                      {lineText}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}

          {/* X axis label */}
          {chart.xLabel && (
            <text
              x={innerW / 2}
              y={innerH + 54}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              style={{ fill: 'var(--color-text-dim)', fontFamily: 'var(--font-ui)' }}
            >
              {chart.xLabel}
            </text>
          )}
        </g>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. Multi-Line Chart (d3-scale + d3-shape line())
// ---------------------------------------------------------------------------

interface LineSeriesStyle {
  dash?: string;
  marker: 'circle' | 'square' | 'triangle' | 'diamond';
  filled: boolean;
}

const LINE_STYLES: readonly LineSeriesStyle[] = [
  { dash: undefined, marker: 'circle', filled: true },
  { dash: '6 3', marker: 'square', filled: false },
  { dash: '2 3', marker: 'triangle', filled: true },
  { dash: '8 3 2 3', marker: 'diamond', filled: false },
];

const PointMarker: React.FC<{
  x: number;
  y: number;
  style: LineSeriesStyle;
  size?: number;
}> = ({ x, y, style, size = 4 }) => {
  const fill = style.filled ? 'var(--color-text)' : 'var(--color-surface)';
  const stroke = 'var(--color-text)';

  switch (style.marker) {
    case 'square':
      return (
        <rect
          x={x - size}
          y={y - size}
          width={size * 2}
          height={size * 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.6}
        />
      );
    case 'triangle':
      return (
        <polygon
          points={`${x},${y - size - 1} ${x + size + 0.5},${y + size} ${x - size - 0.5},${y + size}`}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.5}
        />
      );
    case 'diamond':
      return (
        <polygon
          points={`${x},${y - size - 1} ${x + size + 1},${y} ${x},${y + size + 1} ${x - size - 1},${y}`}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.5}
        />
      );
    case 'circle':
    default:
      return <circle cx={x} cy={y} r={size} fill={fill} stroke={stroke} strokeWidth={1.6} />;
  }
};

const LineChartView: React.FC<{
  chart: ChartData;
  compact: boolean;
}> = ({ chart, compact }) => {
  const width = 640;
  const height = compact ? 300 : 350;
  const manyCategories = chart.categories.length > 8;
  const margin = {
    top: 22,
    right: 24,
    bottom: chart.xLabel ? (manyCategories ? 74 : 62) : manyCategories ? 58 : 44,
    left: 58,
  };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const allValues = chart.series.flatMap((s) => s.values);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  // Start Y at 0 unless all values are tightly clustered well above 0 (e.g. index 88..186).
  const yMin = minVal > 60 && maxVal - minVal < maxVal * 0.65 ? Math.floor((minVal * 0.85) / 10) * 10 : 0;

  const yScale = scaleLinear()
    .domain([yMin, computeNiceMax(allValues)])
    .nice(5)
    .range([innerH, 0]);

  const xScale = scalePoint<string>()
    .domain(chart.categories)
    .range([0, innerW])
    .padding(0.2);

  const lineGenerator = d3Line<{ x: number; y: number }>()
    .x((d) => d.x)
    .y((d) => d.y);

  const yTicks = yScale.ticks(5);
  const tickStep = chart.categories.length > 10 ? 2 : 1;

  return (
    <div className="space-y-2.5" data-testid="chart-line">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text)' }}>
          {chart.title}
        </h4>
        {chart.unit && (
          <span
            className="text-xs tabular-nums shrink-0"
            style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}
          >
            Unit: {chart.unit}
          </span>
        )}
      </div>

      {/* Legend with line style + marker */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
        {chart.series.map((s, idx) => {
          const st = LINE_STYLES[idx % LINE_STYLES.length];
          return (
            <div key={s.name} className="inline-flex items-center gap-1.5">
              <svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true">
                <line
                  x1="1"
                  x2="27"
                  y1="7"
                  y2="7"
                  stroke="var(--color-text)"
                  strokeWidth="2"
                  strokeDasharray={st.dash}
                />
                <PointMarker x={14} y={7} style={st} size={3.5} />
              </svg>
              <span style={{ color: 'var(--color-text)' }}>{s.name}</span>
            </div>
          );
        })}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto block"
        role="img"
        aria-label={chart.title}
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Horizontal gridlines & Y ticks */}
          {yTicks.map((tick, tIdx) => {
            const y = yScale(tick);
            const isBase = tIdx === 0;
            return (
              <g key={tick} transform={`translate(0, ${y})`}>
                <line
                  x1={0}
                  x2={innerW}
                  y1={0}
                  y2={0}
                  stroke={isBase ? 'var(--color-text)' : 'var(--color-border)'}
                  strokeWidth={isBase ? 1.5 : 1}
                  strokeDasharray={isBase ? undefined : '3 3'}
                />
                <text
                  x={-8}
                  y={0}
                  textAnchor="end"
                  dominantBaseline="central"
                  fontSize={11}
                  style={{
                    fill: 'var(--color-text-dim)',
                    fontFamily: 'var(--font-mono)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatNumber(tick)}
                </text>
              </g>
            );
          })}

          {/* Y axis */}
          <line x1={0} x2={0} y1={0} y2={innerH} stroke="var(--color-text)" strokeWidth={1.5} />

          {/* Y axis label */}
          {chart.yLabel && (
            <text
              transform={`translate(-44, ${innerH / 2}) rotate(-90)`}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              style={{ fill: 'var(--color-text-dim)', fontFamily: 'var(--font-ui)' }}
            >
              {chart.yLabel}
            </text>
          )}

          {/* X axis ticks */}
          {chart.categories.map((cat, idx) => {
            const x = xScale(cat) ?? 0;
            const showLabel =
              idx % tickStep === 0 || idx === chart.categories.length - 1;
            return (
              <g key={cat} transform={`translate(${x}, ${innerH})`}>
                <line x1={0} x2={0} y1={0} y2={5} stroke="var(--color-text)" strokeWidth={1.2} />
                {showLabel && (
                  <text
                    x={0}
                    y={manyCategories ? 14 : 18}
                    textAnchor={manyCategories ? 'end' : 'middle'}
                    transform={manyCategories ? 'rotate(-30 0 14)' : undefined}
                    fontSize={11}
                    fontWeight={500}
                    style={{
                      fill: 'var(--color-text)',
                      fontFamily: 'var(--font-mono)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {cat}
                  </text>
                )}
              </g>
            );
          })}

          {/* X axis label */}
          {chart.xLabel && (
            <text
              x={innerW / 2}
              y={innerH + (manyCategories ? 60 : 48)}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              style={{ fill: 'var(--color-text-dim)', fontFamily: 'var(--font-ui)' }}
            >
              {chart.xLabel}
            </text>
          )}

          {/* Series paths + markers */}
          {chart.series.map((s, sIdx) => {
            const st = LINE_STYLES[sIdx % LINE_STYLES.length];
            const pts = chart.categories.map((cat, cIdx) => ({
              x: xScale(cat) ?? 0,
              y: yScale(s.values[cIdx] ?? 0),
              val: s.values[cIdx] ?? 0,
            }));
            const pathD = lineGenerator(pts) ?? '';

            return (
              <g key={s.name}>
                <path
                  d={pathD}
                  fill="none"
                  stroke="var(--color-text)"
                  strokeWidth={2.2}
                  strokeDasharray={st.dash}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {pts.map((pt, pIdx) => (
                  <PointMarker key={pIdx} x={pt.x} y={pt.y} style={st} size={4} />
                ))}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. Pie Chart (1 or multiple pies via d3-shape pie() + arc())
// ---------------------------------------------------------------------------

interface PieDatum {
  category: string;
  value: number;
  index: number;
}

const SinglePieSvg: React.FC<{
  seriesName: string;
  categories: string[];
  values: number[];
  unit: string;
  uid: string;
  compact: boolean;
}> = ({ seriesName, categories, values, unit, uid, compact }) => {
  const size = compact ? 240 : 270;
  const cx = size / 2;
  const cy = size / 2;
  const radius = compact ? 74 : 84;

  const data: PieDatum[] = categories.map((category, index) => ({
    category,
    value: values[index] ?? 0,
    index,
  }));

  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const pieGen = d3Pie<PieDatum>()
    .value((d) => d.value)
    .sort(null);
  const arcs = pieGen(data);

  const sliceArc = d3Arc<PieArcDatum<PieDatum>>().innerRadius(0).outerRadius(radius);
  const innerLabelArc = d3Arc<PieArcDatum<PieDatum>>()
    .innerRadius(radius * 0.56)
    .outerRadius(radius * 0.56);
  const outerAnchorArc = d3Arc<PieArcDatum<PieDatum>>()
    .innerRadius(radius + 4)
    .outerRadius(radius + 4);
  const outerLabelArc = d3Arc<PieArcDatum<PieDatum>>()
    .innerRadius(radius + 22)
    .outerRadius(radius + 22);

  // De-overlap external labels for small slices (< 10%)
  const externalLabels: Array<{
    idx: number;
    pctText: string;
    ax: number;
    ay: number;
    lx: number;
    ly: number;
    side: 'left' | 'right';
  }> = [];

  for (const a of arcs) {
    const pct = (a.data.value / total) * 100;
    if (pct < 10 && a.data.value > 0) {
      const [ax, ay] = outerAnchorArc.centroid(a);
      const [lx, ly] = outerLabelArc.centroid(a);
      const side: 'left' | 'right' = lx >= 0 ? 'right' : 'left';
      externalLabels.push({
        idx: a.data.index,
        pctText: `${formatNumber(a.data.value)}${unit === '%' ? '%' : ''}`,
        ax,
        ay,
        lx: side === 'right' ? Math.max(lx, radius + 18) : Math.min(lx, -(radius + 18)),
        ly,
        side,
      });
    }
  }

  for (const side of ['left', 'right'] as const) {
    const sideItems = externalLabels
      .filter((item) => item.side === side)
      .sort((a, b) => a.ly - b.ly);
    for (let i = 1; i < sideItems.length; i++) {
      if (sideItems[i].ly - sideItems[i - 1].ly < 15) {
        sideItems[i].ly = sideItems[i - 1].ly + 15;
      }
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className="text-xs font-semibold mb-1 text-center"
        style={{ color: 'var(--color-text)' }}
      >
        {seriesName}
      </div>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[270px] h-auto block"
        role="img"
        aria-label={`Pie chart: ${seriesName}`}
      >
        <PatternDefs uid={uid} />
        <g transform={`translate(${cx}, ${cy})`}>
          {arcs.map((a) => {
            const pathD = sliceArc(a) ?? '';
            const pct = (a.data.value / total) * 100;
            const [ix, iy] = innerLabelArc.centroid(a);
            const valLabel = `${formatNumber(a.data.value)}${unit === '%' ? '%' : ''}`;

            return (
              <g key={a.data.category}>
                <path
                  d={pathD}
                  fill={getSeriesFill(uid, a.data.index)}
                  stroke="var(--color-surface)"
                  strokeWidth={1.8}
                />
                {/* Crisp outer border for monochrome exam clarity */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="var(--color-text)"
                  strokeWidth={1}
                />
                {pct >= 10 && (
                  <g transform={`translate(${ix}, ${iy})`}>
                    <rect
                      x={-18}
                      y={-9}
                      width={36}
                      height={18}
                      rx={4}
                      fill="var(--color-surface)"
                      fillOpacity={0.92}
                      stroke="var(--color-border)"
                      strokeWidth={0.8}
                    />
                    <text
                      x={0}
                      y={0.5}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={10.5}
                      fontWeight={700}
                      style={{
                        fill: 'var(--color-text)',
                        fontFamily: 'var(--font-mono)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {valLabel}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* External callouts for small slices */}
          {externalLabels.map((lbl) => (
            <g key={lbl.idx}>
              <polyline
                points={`${lbl.ax},${lbl.ay} ${lbl.lx},${lbl.ly}`}
                fill="none"
                stroke="var(--color-text)"
                strokeWidth={1}
              />
              <text
                x={lbl.lx + (lbl.side === 'right' ? 3 : -3)}
                y={lbl.ly}
                textAnchor={lbl.side === 'right' ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize={10.5}
                fontWeight={700}
                style={{
                  fill: 'var(--color-text)',
                  fontFamily: 'var(--font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {lbl.pctText}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

const PieChartView: React.FC<{
  chart: ChartData;
  uid: string;
  compact: boolean;
}> = ({ chart, uid, compact }) => {
  const multiple = chart.series.length > 1;

  return (
    <div className="space-y-3" data-testid="chart-pie">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text)' }}>
          {chart.title}
        </h4>
        {chart.unit && (
          <span
            className="text-xs tabular-nums shrink-0"
            style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}
          >
            Unit: {chart.unit}
          </span>
        )}
      </div>

      {/* Shared category legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
        {chart.categories.map((cat, idx) => (
          <div key={cat} className="inline-flex items-center gap-1.5">
            <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
              <PatternDefs uid={`${uid}-plg`} />
              <rect
                x="0.75"
                y="0.75"
                width="14.5"
                height="10.5"
                rx="1.5"
                fill={getSeriesFill(`${uid}-plg`, idx)}
                stroke="var(--color-text)"
                strokeWidth="1.2"
              />
            </svg>
            <span style={{ color: 'var(--color-text)' }}>{cat}</span>
          </div>
        ))}
      </div>

      <div className={multiple ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'flex justify-center'}>
        {chart.series.map((s, sIdx) => (
          <SinglePieSvg
            key={s.name}
            seriesName={s.name}
            categories={chart.categories}
            values={s.values}
            unit={chart.unit}
            uid={`${uid}-p${sIdx}`}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 4. IELTS Exam Table
// ---------------------------------------------------------------------------

function isNumericColumn(rows: TableData['rows'], colIndex: number): boolean {
  let hasValue = false;
  for (const row of rows) {
    const cell = row[colIndex];
    if (cell === undefined || cell === '') continue;
    hasValue = true;
    if (typeof cell === 'number') continue;
    const cleaned = String(cell).replace(/[,%£$€+\s]/g, '');
    if (cleaned === '' || !Number.isFinite(Number(cleaned))) {
      return false;
    }
  }
  return hasValue;
}

const TableView: React.FC<{ table: TableData; compact: boolean }> = ({ table, compact }) => {
  const numericCols = table.columns.map((_, idx) => isNumericColumn(table.rows, idx));
  const cellPad = compact ? 'px-2.5 py-1.5' : 'px-3 py-2';

  return (
    <div className="space-y-2" data-testid="chart-table">
      <h4 className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text)' }}>
        {table.title}
      </h4>
      <div
        className="overflow-x-auto rounded-[var(--radius-sm)] border"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <table className="w-full border-collapse text-xs sm:text-sm">
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderBottom: '2px solid var(--color-text)',
              }}
            >
              {table.columns.map((col, cIdx) => (
                <th
                  key={col}
                  scope="col"
                  className={`${cellPad} font-semibold whitespace-nowrap ${
                    numericCols[cIdx] ? 'text-right' : 'text-left'
                  }`}
                  style={{ color: 'var(--color-text)' }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                style={{
                  backgroundColor:
                    rIdx % 2 === 1
                      ? 'color-mix(in srgb, var(--color-surface-2) 55%, var(--color-surface))'
                      : 'var(--color-surface)',
                  borderBottom:
                    rIdx === table.rows.length - 1
                      ? 'none'
                      : '1px solid var(--color-border)',
                }}
              >
                {row.map((cell, cIdx) => {
                  const isNum = numericCols[cIdx];
                  const display =
                    typeof cell === 'number' ? formatNumber(cell) : String(cell);
                  return (
                    <td
                      key={cIdx}
                      className={`${cellPad} ${
                        isNum ? 'text-right font-mono tabular-nums' : 'text-left font-medium'
                      }`}
                      style={{
                        color: cIdx === 0 ? 'var(--color-text)' : 'var(--color-text-dim)',
                      }}
                    >
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 5. Process Diagram (steps + edges + cyclic loop support)
// ---------------------------------------------------------------------------

interface NodePos {
  id: string;
  index: number;
  label: string;
  row: number;
  col: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

const ProcessView: React.FC<{
  process: ProcessData;
  uid: string;
  compact: boolean;
}> = ({ process, uid, compact }) => {
  const count = process.steps.length;
  const cols = count <= 3 ? count : count <= 6 ? 3 : 4;
  const rows = Math.ceil(count / cols);

  const boxW = 148;
  const boxH = compact ? 64 : 72;
  const gapX = 36;
  const gapY = compact ? 52 : 60;
  const padX = 24;
  const padY = 24;

  const width = padX * 2 + cols * boxW + (cols - 1) * gapX;
  const height = padY * 2 + rows * boxH + (rows - 1) * gapY + (process.cyclic ? 16 : 0);

  // Serpentine layout: even rows L->R, odd rows R->L so cyclic & linear arrows stay short.
  const nodes: NodePos[] = process.steps.map((step, idx) => {
    const row = Math.floor(idx / cols);
    const colInRow = idx % cols;
    const col = row % 2 === 0 ? colInRow : cols - 1 - colInRow;
    const x = padX + col * (boxW + gapX);
    const y = padY + row * (boxH + gapY);
    return { id: step.id, index: idx, label: step.label, row, col, x, y, w: boxW, h: boxH };
  });

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const markerId = `${uid}-arrow`;

  const buildEdgePath = (from: NodePos, to: NodePos): string => {
    const fCx = from.x + from.w / 2;
    const fCy = from.y + from.h / 2;
    const tCx = to.x + to.w / 2;
    const tCy = to.y + to.h / 2;

    // Same row, adjacent columns
    if (from.row === to.row && Math.abs(from.col - to.col) === 1) {
      if (to.col > from.col) {
        return `M ${from.x + from.w} ${fCy} L ${to.x - 4} ${tCy}`;
      }
      return `M ${from.x} ${fCy} L ${to.x + to.w + 4} ${tCy}`;
    }

    // Same row, non-adjacent (e.g. branching skip s5 -> s7 over s6): arc cleanly below/above
    if (from.row === to.row && Math.abs(from.col - to.col) > 1) {
      const startY = from.y + from.h;
      const endY = to.y + to.h + 4;
      const arcY = from.y + from.h + 26;
      const midX = (fCx + tCx) / 2;
      return `M ${fCx} ${startY} Q ${midX} ${arcY} ${tCx} ${endY}`;
    }

    // Same column, adjacent rows (vertical down or closing cyclic vertical up)
    if (from.col === to.col && Math.abs(from.row - to.row) === 1) {
      if (to.row > from.row) {
        return `M ${fCx} ${from.y + from.h} L ${tCx} ${to.y - 4}`;
      }
      return `M ${fCx} ${from.y} L ${tCx} ${to.y + to.h + 4}`;
    }

    // General fallback: gentle quadratic curve between box edges
    const goingDown = to.y > from.y;
    const sy = goingDown ? from.y + from.h : from.y;
    const ey = goingDown ? to.y - 4 : to.y + to.h + 4;
    const midY = (sy + ey) / 2;
    return `M ${fCx} ${sy} C ${fCx} ${midY}, ${tCx} ${midY}, ${tCx} ${ey}`;
  };

  return (
    <div className="space-y-2.5" data-testid="chart-process">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text)' }}>
          {process.title}
        </h4>
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-[var(--radius-sm)] border"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-dim)',
          }}
        >
          {process.cyclic ? 'Cyclic process' : 'Linear process'}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto block"
        role="img"
        aria-label={process.title}
      >
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--color-text)" />
          </marker>
        </defs>

        {/* Edges */}
        {process.edges.map(([fromId, toId], idx) => {
          const from = nodeById.get(fromId);
          const to = nodeById.get(toId);
          if (!from || !to) return null;
          const isClosingEdge =
            process.cyclic && from.index === nodes.length - 1 && to.index === 0;
          return (
            <path
              key={`${fromId}-${toId}-${idx}`}
              d={buildEdgePath(from, to)}
              fill="none"
              stroke="var(--color-text)"
              strokeWidth={1.7}
              strokeDasharray={isClosingEdge ? '5 3' : undefined}
              markerEnd={`url(#${markerId})`}
            />
          );
        })}

        {/* Step nodes */}
        {nodes.map((node) => {
          const lines = wrapText(node.label, 18, 3);
          const lineHeight = 14;
          const textBlockH = lines.length * lineHeight;
          const startY = node.y + (node.h - textBlockH) / 2 + 10;

          return (
            <g key={node.id}>
              <rect
                x={node.x}
                y={node.y}
                width={node.w}
                height={node.h}
                rx={8}
                fill="var(--color-surface)"
                stroke="var(--color-text)"
                strokeWidth={1.5}
              />
              {/* Step number badge */}
              <circle
                cx={node.x + 12}
                cy={node.y + 12}
                r={9}
                fill="var(--color-text)"
              />
              <text
                x={node.x + 12}
                y={node.y + 12.5}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10}
                fontWeight={700}
                style={{
                  fill: 'var(--color-surface)',
                  fontFamily: 'var(--font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {node.index + 1}
              </text>

              {/* Step label */}
              <text
                x={node.x + node.w / 2 + 4}
                y={startY}
                textAnchor="middle"
                fontSize={11.5}
                fontWeight={500}
                style={{ fill: 'var(--color-text)', fontFamily: 'var(--font-ui)' }}
              >
                {lines.map((lineText, lIdx) => (
                  <tspan key={lIdx} x={node.x + node.w / 2 + 4} dy={lIdx === 0 ? 0 : lineHeight}>
                    {lineText}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 6. Map Comparison (Before / After side-by-side reusing MapView)
// ---------------------------------------------------------------------------

const MapComparisonView: React.FC<{
  maps: MapsData;
  compact: boolean;
}> = ({ maps, compact }) => (
  <div
    className="grid grid-cols-1 md:grid-cols-2 gap-4"
    data-testid="chart-map"
  >
    <MapView
      spec={maps.before}
      interactive={false}
      showZoomControls={!compact}
      title={`Before (${maps.before.year})`}
      badge={maps.before.year}
    />
    <MapView
      spec={maps.after}
      interactive={false}
      showZoomControls={!compact}
      title={`After (${maps.after.year})`}
      badge={maps.after.year}
    />
  </div>
);

// ---------------------------------------------------------------------------
// Main ChartRenderer Component
// ---------------------------------------------------------------------------

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  visual,
  kind,
  title,
  compact = false,
  className = '',
}) => {
  const uid = sanitizeId(useId());
  const resolvedKind = resolveVisualKind(visual, kind);

  const renderChartPart = (chart: ChartData, forceKind?: 'bar' | 'line' | 'pie') => {
    if (forceKind === 'pie' || chart.pie) {
      return <PieChartView chart={chart} uid={`${uid}-pie`} compact={compact} />;
    }
    if (forceKind === 'line') {
      return <LineChartView chart={chart} compact={compact} />;
    }
    return <BarChartView chart={chart} uid={`${uid}-bar`} compact={compact} />;
  };

  let body: React.ReactNode = null;

  switch (resolvedKind) {
    case 'bar':
      body = visual.chart ? renderChartPart(visual.chart, 'bar') : null;
      break;
    case 'line':
      body = visual.chart ? renderChartPart(visual.chart, 'line') : null;
      break;
    case 'pie':
      body = visual.chart ? renderChartPart(visual.chart, 'pie') : null;
      break;
    case 'table':
      body = visual.table ? <TableView table={visual.table} compact={compact} /> : null;
      break;
    case 'mixed': {
      const subChartKind: 'bar' | 'line' | 'pie' | undefined = visual.chart?.pie
        ? 'pie'
        : visual.chart && visual.chart.categories.length >= 6 &&
            (visual.chart.xLabel ? TIME_LABEL_RE.test(visual.chart.xLabel) : false)
          ? 'line'
          : 'bar';
      body = (
        <div className="space-y-5" data-testid="chart-mixed">
          {visual.chart && renderChartPart(visual.chart, subChartKind)}
          {visual.chart && visual.table && (
            <hr style={{ borderColor: 'var(--color-border)' }} />
          )}
          {visual.table && <TableView table={visual.table} compact={compact} />}
        </div>
      );
      break;
    }
    case 'process':
      body = visual.process ? (
        <ProcessView process={visual.process} uid={`${uid}-proc`} compact={compact} />
      ) : null;
      break;
    case 'map':
      body = visual.maps ? <MapComparisonView maps={visual.maps} compact={compact} /> : null;
      break;
  }

  return (
    <figure
      className={`rounded-[var(--radius-md)] border ${compact ? 'p-3' : 'p-4'} ${className}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
      data-testid="chart-renderer"
      data-visual-kind={resolvedKind}
    >
      {title && (
        <figcaption
          className="text-sm font-bold mb-3 pb-2 border-b"
          style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
        >
          {title}
        </figcaption>
      )}
      {body}
    </figure>
  );
};
