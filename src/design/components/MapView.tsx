import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { MapSpec } from '../../core/content/schemas';

export interface AssignedMapSlotInfo {
  questionNumber: number;
  label?: string;
  status?: 'idle' | 'correct' | 'wrong';
}

export interface MapViewProps {
  spec: MapSpec;
  /** Currently highlighted slot letter (e.g. 'A'..'H') for the focused question. */
  selectedKey?: string | null;
  /** Map from slot letter -> assigned question info (for displaying badges and debrief results). */
  assignedSlots?: Readonly<Record<string, AssignedMapSlotInfo>>;
  /** Callback when learner clicks or activates a letter slot on the map. */
  onSelectSlot?: (slotKey: string) => void;
  interactive?: boolean;
  /** Show zoom controls in the header (default true). */
  showZoomControls?: boolean;
  /** Optional short badge shown next to the map title (e.g. year in Task 1 maps). */
  badge?: string;
  title?: string;
  className?: string;
}

function parseViewBox(viewBox: string): { x: number; y: number; w: number; h: number } {
  const parts = viewBox
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
    return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
  }
  return { x: 0, y: 0, w: 600, h: 400 };
}

function getShapeStyle(kind: MapSpec['shapes'][number]['kind']): {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
} {
  switch (kind) {
    case 'park':
      return {
        fill: 'color-mix(in srgb, var(--color-reading) 12%, var(--color-surface))',
        stroke: 'color-mix(in srgb, var(--color-reading) 42%, var(--color-border))',
        strokeWidth: 1.5,
        strokeDasharray: '4 3',
      };
    case 'water':
      return {
        fill: 'color-mix(in srgb, var(--color-info) 16%, var(--color-surface))',
        stroke: 'color-mix(in srgb, var(--color-info) 48%, var(--color-border))',
        strokeWidth: 1.5,
      };
    case 'road':
      return {
        fill: 'var(--color-surface-2)',
        stroke: 'var(--color-border)',
        strokeWidth: 2,
      };
    case 'path':
      return {
        fill: 'none',
        stroke: 'var(--color-text-dim)',
        strokeWidth: 2,
        strokeDasharray: '6 4',
      };
    case 'parking':
      return {
        fill: 'color-mix(in srgb, var(--color-text-faint) 12%, var(--color-surface))',
        stroke: 'var(--color-border)',
        strokeWidth: 1.5,
      };
    case 'entrance':
      return {
        fill: 'color-mix(in srgb, var(--color-listening) 18%, var(--color-surface))',
        stroke: 'var(--color-listening)',
        strokeWidth: 2,
      };
    case 'building':
      return {
        fill: 'var(--color-surface-2)',
        stroke: 'var(--color-text-dim)',
        strokeWidth: 1.5,
      };
    case 'label':
    default:
      return {
        fill: 'none',
        stroke: 'none',
        strokeWidth: 0,
      };
  }
}

export const MapView: React.FC<MapViewProps> = ({
  spec,
  selectedKey = null,
  assignedSlots = {},
  onSelectSlot,
  interactive = true,
  showZoomControls = true,
  badge,
  title,
  className = '',
}) => {
  const [zoom, setZoom] = useState(1);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const vb = parseViewBox(spec.viewBox);

  const compassX = vb.x + vb.w - 42;
  const compassY = vb.y + 42;

  return (
    <div
      className={`rounded-[var(--radius-md)] border overflow-hidden ${className}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
      data-testid="map-view"
    >
      {/* Header + zoom controls for 360px readability */}
      <div
        className="px-3 py-2 border-b flex items-center justify-between gap-2"
        style={{
          backgroundColor: 'var(--color-surface-2)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>
            {title ?? 'Bản đồ khu vực (bấm chữ cái để chọn)'}
          </span>
          {badge && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-[var(--radius-sm)] border shrink-0 tabular-nums"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {showZoomControls && (
          <div className="inline-flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.85, Number((z - 0.15).toFixed(2))))}
            aria-label="Thu nhỏ bản đồ"
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-[var(--radius-sm)] border cursor-pointer"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-dim)',
            }}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span
            className="text-xs font-semibold tabular-nums px-1"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
            aria-label="Phóng to bản đồ"
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-[var(--radius-sm)] border cursor-pointer"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-dim)',
            }}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {zoom !== 1 && (
            <button
              type="button"
              onClick={() => setZoom(1)}
              aria-label="Đặt lại thu phóng"
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-[var(--radius-sm)] border cursor-pointer"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-dim)',
              }}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          </div>
        )}
      </div>

      {/* Scrollable zoom container */}
      <div className="overflow-auto p-2.5" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div
          style={{
            width: `${Math.round(zoom * 100)}%`,
            minWidth: '100%',
            transition: 'width 150ms ease-out',
          }}
        >
          <svg
            viewBox={spec.viewBox}
            className="w-full h-auto block rounded-[var(--radius-sm)]"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
            role="img"
            aria-label={title ?? 'Bản đồ IELTS Listening'}
          >
            {/* Base map shapes */}
            {spec.shapes.map((shape) => {
              const st = getShapeStyle(shape.kind);
              const centerX =
                shape.x !== undefined && shape.w !== undefined
                  ? shape.x + shape.w / 2
                  : shape.x ?? 0;
              const centerY =
                shape.y !== undefined && shape.h !== undefined
                  ? shape.y + shape.h / 2
                  : shape.y ?? 0;

              return (
                <g key={shape.id}>
                  {shape.d ? (
                    <path
                      d={shape.d}
                      fill={shape.kind === 'path' ? 'none' : st.fill}
                      stroke={st.stroke}
                      strokeWidth={st.strokeWidth}
                      strokeDasharray={st.strokeDasharray}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : shape.kind !== 'label' &&
                    shape.x !== undefined &&
                    shape.y !== undefined &&
                    shape.w !== undefined &&
                    shape.h !== undefined ? (
                    <rect
                      x={shape.x}
                      y={shape.y}
                      width={shape.w}
                      height={shape.h}
                      rx={shape.kind === 'building' || shape.kind === 'parking' ? 6 : 3}
                      fill={st.fill}
                      stroke={st.stroke}
                      strokeWidth={st.strokeWidth}
                      strokeDasharray={st.strokeDasharray}
                    />
                  ) : null}

                  {shape.label && (
                    <text
                      x={centerX}
                      y={centerY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={shape.kind === 'road' ? 11 : 12}
                      fontWeight={shape.kind === 'building' || shape.kind === 'entrance' ? 600 : 500}
                      style={{
                        fill:
                          shape.kind === 'entrance'
                            ? 'var(--color-listening)'
                            : 'var(--color-text-dim)',
                        fontFamily: 'var(--font-ui)',
                        pointerEvents: 'none',
                      }}
                    >
                      {shape.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Compass rose */}
            {spec.compass && (
              <g transform={`translate(${compassX}, ${compassY})`} aria-label="La bàn phương hướng">
                <circle
                  cx={0}
                  cy={0}
                  r={22}
                  fill="var(--color-surface-2)"
                  stroke="var(--color-border)"
                  strokeWidth={1.5}
                />
                <polygon
                  points="0,-16 4,-2 0,-5 -4,-2"
                  fill="var(--color-listening)"
                />
                <polygon
                  points="0,16 4,2 0,5 -4,2"
                  fill="var(--color-text-faint)"
                />
                <text
                  x={0}
                  y={-25}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  style={{ fill: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}
                >
                  N
                </text>
                <text
                  x={28}
                  y={4}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={600}
                  style={{ fill: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}
                >
                  E
                </text>
                <text
                  x={-28}
                  y={4}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={600}
                  style={{ fill: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}
                >
                  W
                </text>
                <text
                  x={0}
                  y={32}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={600}
                  style={{ fill: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}
                >
                  S
                </text>
              </g>
            )}

            {/* "You are here" marker */}
            {spec.youAreHere && (
              <g
                transform={`translate(${spec.youAreHere.x}, ${spec.youAreHere.y})`}
                aria-label="Vị trí xuất phát: You are here"
              >
                <circle
                  cx={0}
                  cy={0}
                  r={10}
                  fill="color-mix(in srgb, var(--color-wrong) 22%, var(--color-surface))"
                  stroke="var(--color-wrong)"
                  strokeWidth={2}
                />
                <polygon points="0,-16 5,-7 -5,-7" fill="var(--color-wrong)" />
                <circle cx={0} cy={0} r={3.5} fill="var(--color-wrong)" />
                <rect
                  x={-44}
                  y={12}
                  width={88}
                  height={18}
                  rx={4}
                  fill="var(--color-surface-2)"
                  stroke="var(--color-wrong)"
                  strokeWidth={1}
                />
                <text
                  x={0}
                  y={21}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={10}
                  fontWeight={700}
                  style={{ fill: 'var(--color-text)', fontFamily: 'var(--font-ui)' }}
                >
                  You are here
                </text>
              </g>
            )}

            {/* Interactive A-H / A-I slots */}
            {spec.slots.map((slot) => {
              const keyUpper = slot.key.toUpperCase();
              const isSelected = selectedKey?.toUpperCase() === keyUpper;
              const isHovered = hoveredKey === keyUpper;
              const assigned = assignedSlots[keyUpper] ?? assignedSlots[slot.key];

              let fill = 'var(--color-surface)';
              let stroke = 'var(--color-listening)';
              let textFill = 'var(--color-text)';

              if (assigned?.status === 'correct') {
                fill = 'color-mix(in srgb, var(--color-correct) 22%, var(--color-surface))';
                stroke = 'var(--color-correct)';
              } else if (assigned?.status === 'wrong') {
                fill = 'color-mix(in srgb, var(--color-wrong) 22%, var(--color-surface))';
                stroke = 'var(--color-wrong)';
              } else if (isSelected) {
                fill = 'var(--color-listening)';
                stroke = 'var(--color-listening)';
                textFill = 'var(--color-bg)';
              } else if (assigned) {
                fill = 'color-mix(in srgb, var(--color-info) 20%, var(--color-surface))';
                stroke = 'var(--color-info)';
              }

              const scale = isHovered || isSelected ? 1.12 : 1;

              return (
                <g
                  key={slot.key}
                  transform={`translate(${slot.x}, ${slot.y}) scale(${scale})`}
                  style={{
                    cursor: interactive ? 'pointer' : 'default',
                    transition: 'transform 140ms ease-out',
                  }}
                  role={interactive ? 'button' : undefined}
                  tabIndex={interactive ? 0 : undefined}
                  aria-label={`Vị trí ${keyUpper}${
                    assigned ? `, đã gán câu ${assigned.questionNumber}` : ''
                  }`}
                  data-testid={`map-slot-${keyUpper}`}
                  onMouseEnter={() => setHoveredKey(keyUpper)}
                  onMouseLeave={() => setHoveredKey((cur) => (cur === keyUpper ? null : cur))}
                  onClick={() => {
                    if (interactive) onSelectSlot?.(keyUpper);
                  }}
                  onKeyDown={(e) => {
                    if (!interactive) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectSlot?.(keyUpper);
                    }
                  }}
                >
                  <circle
                    cx={0}
                    cy={0}
                    r={18}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isSelected ? 3 : 2}
                  />
                  <text
                    x={0}
                    y={1}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={14}
                    fontWeight={800}
                    style={{
                      fill: textFill,
                      fontFamily: 'var(--font-mono)',
                      pointerEvents: 'none',
                    }}
                  >
                    {keyUpper}
                  </text>

                  {assigned && (
                    <g transform="translate(15, -15)">
                      <rect
                        x={-11}
                        y={-9}
                        width={22}
                        height={16}
                        rx={8}
                        fill={
                          assigned.status === 'correct'
                            ? 'var(--color-correct)'
                            : assigned.status === 'wrong'
                              ? 'var(--color-wrong)'
                              : 'var(--color-info)'
                        }
                      />
                      <text
                        x={0}
                        y={0}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={9}
                        fontWeight={800}
                        style={{
                          fill: 'var(--color-bg)',
                          fontFamily: 'var(--font-mono)',
                          pointerEvents: 'none',
                        }}
                      >
                        {assigned.questionNumber}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
