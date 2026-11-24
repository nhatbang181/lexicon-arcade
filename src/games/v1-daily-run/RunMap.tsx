import React from 'react';
import { Crown, Check, RotateCcw, Sparkles, ShieldAlert } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { V1NodeKind, V1RunNode } from './engine';

export interface RunMapProps {
  nodes: readonly V1RunNode[];
  currentIndex: number;
  stageIndex: number;
  stageSize: number;
  isBossPhase: boolean;
  bossHp: number;
  bossDefeated: boolean;
  className?: string;
}

const NODE_KIND_COLOR: Record<V1NodeKind, string> = {
  vocab: 'var(--color-vocab)', // tím
  collocation: 'var(--color-writing)', // cam
  paraphrase: 'var(--color-reading)', // xanh lá
  error: 'var(--color-speaking)', // đỏ
  listen: 'var(--color-listening)', // xanh dương
};

const NODE_KIND_LABEL_VI: Record<V1NodeKind, string> = {
  vocab: 'Từ vựng',
  collocation: 'Collocation',
  paraphrase: 'Paraphrase · Reading',
  error: 'Sửa lỗi',
  listen: 'Nghe',
};

const SHATTER_SHARDS: ReadonlyArray<{
  id: number;
  dx: number;
  dy: number;
  rot: number;
}> = [
  { id: 0, dx: -48, dy: -26, rot: -35 },
  { id: 1, dx: -28, dy: 24, rot: 28 },
  { id: 2, dx: -14, dy: -32, rot: -18 },
  { id: 3, dx: -4, dy: 28, rot: 22 },
  { id: 4, dx: 12, dy: -28, rot: 19 },
  { id: 5, dx: 24, dy: 26, rot: -26 },
  { id: 6, dx: 38, dy: -22, rot: 32 },
  { id: 7, dx: 52, dy: 22, rot: -38 },
];

export const RunMap: React.FC<RunMapProps> = ({
  nodes,
  currentIndex,
  stageIndex,
  stageSize,
  isBossPhase,
  bossHp,
  bossDefeated,
  className = '',
}) => {
  const prefersReduced = useReducedMotion();

  const stageNodes = nodes.filter((n) => n.stageIndex === stageIndex);
  const displayNodes = stageNodes.length > 0 ? stageNodes : nodes.slice(0, stageSize);

  return (
    <div
      className={`rounded-[var(--radius-lg)] border p-3.5 sm:p-4 space-y-3 ${className}`}
      style={{
        backgroundColor: isBossPhase
          ? 'color-mix(in srgb, var(--color-wrong) 10%, var(--color-surface))'
          : 'var(--color-surface)',
        borderColor: isBossPhase
          ? 'color-mix(in srgb, var(--color-wrong) 45%, var(--color-border))'
          : 'var(--color-border)',
      }}
      aria-label="Bản đồ Run"
    >
      {/* Hàng chú thích màu loại node + Tiến độ chặng */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {(Object.keys(NODE_KIND_COLOR) as V1NodeKind[]).map((kind) => (
            <span
              key={kind}
              className="inline-flex items-center gap-1.5"
              style={{ color: 'var(--color-text-dim)' }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: NODE_KIND_COLOR[kind] }}
              />
              <span>{NODE_KIND_LABEL_VI[kind]}</span>
            </span>
          ))}
        </div>

        <div
          className="font-semibold tabular-nums"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
        >
          {isBossPhase
            ? `BOSS · HP ${bossHp}%`
            : `Thẻ ${Math.min(nodes.length, currentIndex + 1)}/${nodes.length}`}
        </div>
      </div>

      {/* Đường ngang các node tròn + Node Boss to ở cuối */}
      <div className="overflow-x-auto py-1">
        <div className="flex items-center gap-1.5 min-w-max">
          {displayNodes.map((node) => {
            const globalIdx = nodes.findIndex((n) => n.nodeId === node.nodeId);
            const isCurrent = !isBossPhase && globalIdx === currentIndex;
            const isDone =
              isBossPhase ||
              globalIdx < currentIndex ||
              node.status !== 'pending';
            const baseColor = NODE_KIND_COLOR[node.nodeKind];

            const statusColor =
              node.status === 'correct'
                ? 'var(--color-correct)'
                : node.status === 'partial'
                ? 'var(--color-partial)'
                : node.status === 'wrong'
                ? 'var(--color-wrong)'
                : baseColor;

            return (
              <React.Fragment key={node.nodeId}>
                <motion.div
                  animate={
                    prefersReduced
                      ? undefined
                      : isCurrent
                      ? { scale: [1, 1.12, 1] }
                      : { scale: 1 }
                  }
                  transition={{ duration: 0.35 }}
                  className="relative inline-flex items-center justify-center w-7 h-7 rounded-full border text-xs font-bold shrink-0"
                  style={{
                    backgroundColor: isDone
                      ? statusColor
                      : isCurrent
                      ? `color-mix(in srgb, ${baseColor} 28%, var(--color-surface-2))`
                      : 'var(--color-surface-2)',
                    borderColor: isCurrent ? baseColor : isDone ? statusColor : baseColor,
                    borderWidth: isCurrent ? '2px' : '1.5px',
                    color: isDone ? 'var(--color-bg)' : 'var(--color-text)',
                    boxShadow: isCurrent ? `0 0 0 3px color-mix(in srgb, ${baseColor} 28%, transparent)` : 'none',
                  }}
                  title={`${NODE_KIND_LABEL_VI[node.nodeKind]} · ${node.face}${
                    node.isRetry ? ' (Làm lại)' : ''
                  }`}
                >
                  {node.status === 'correct' ? (
                    <Check className="w-3 h-3" />
                  ) : node.isRetry ? (
                    <RotateCcw className="w-3 h-3" />
                  ) : node.isRare ? (
                    <Sparkles className="w-3 h-3" />
                  ) : (
                    <span>{globalIdx + 1}</span>
                  )}
                </motion.div>

                <span
                  className="w-2 h-[2px] rounded-full shrink-0"
                  style={{
                    backgroundColor: isDone ? statusColor : 'var(--color-border)',
                  }}
                />
              </React.Fragment>
            );
          })}

          {/* Node Boss to ở cuối */}
          <motion.div
            animate={
              prefersReduced
                ? undefined
                : isBossPhase && !bossDefeated
                ? { scale: [1, 1.08, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.8, repeat: isBossPhase && !bossDefeated ? Infinity : 0 }}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border-2 font-bold shrink-0"
            style={{
              backgroundColor: bossDefeated
                ? 'var(--color-correct)'
                : isBossPhase
                ? 'var(--color-wrong)'
                : 'color-mix(in srgb, var(--color-wrong) 18%, var(--color-surface-2))',
              borderColor: bossDefeated ? 'var(--color-correct)' : 'var(--color-wrong)',
              color: bossDefeated || isBossPhase ? 'var(--color-bg)' : 'var(--color-wrong)',
              boxShadow: isBossPhase ? 'var(--shadow-glow-wrong)' : 'none',
            }}
            title="Boss cuối chặng (5 thẻ khó nhất)"
          >
            {bossDefeated ? <Check className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
          </motion.div>
        </div>
      </div>

      {/* Thanh HP Boss đỏ thẫm + Hiệu ứng vỡ thành 8 mảnh khi hạ Boss */}
      {(isBossPhase || bossDefeated) && (
        <div className="pt-1 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--color-wrong)' }}>
              <ShieldAlert className="w-4 h-4" />
              <span>BOSS CUỐI CHẶNG (5 THẺ KHÓ NHẤT)</span>
            </span>
            <span
              className="tabular-nums"
              style={{
                fontFamily: 'var(--font-mono)',
                color: bossDefeated ? 'var(--color-correct)' : 'var(--color-wrong)',
              }}
            >
              {bossDefeated ? 'ĐÃ HẠ BOSS (+50 XP)' : `HP ${bossHp}/100%`}
            </span>
          </div>

          <div className="relative h-4 w-full rounded-full overflow-visible">
            {!bossDefeated ? (
              <div
                className="h-3.5 w-full rounded-full border overflow-hidden"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'color-mix(in srgb, var(--color-wrong) 50%, var(--color-border))',
                }}
              >
                <motion.div
                  initial={false}
                  animate={{ scaleX: Math.max(0, Math.min(1, bossHp / 100)) }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full w-full origin-left rounded-full"
                  style={{
                    backgroundColor: 'var(--color-wrong)',
                  }}
                />
              </div>
            ) : (
              /* Khi hạ Boss: thanh HP vỡ thành 8 mảnh (0.5s, chỉ animate transform & opacity) */
              <div
                className="grid grid-cols-8 gap-1 h-3.5 w-full"
                data-testid="boss-hp-shatter"
              >
                {SHATTER_SHARDS.map((shard) => (
                  <motion.div
                    key={shard.id}
                    initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
                    animate={
                      prefersReduced
                        ? { opacity: 0 }
                        : {
                            opacity: [1, 0.9, 0],
                            x: shard.dx,
                            y: shard.dy,
                            rotate: shard.rot,
                            scale: [1, 0.7, 0.2],
                          }
                    }
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-sm"
                    style={{ backgroundColor: 'var(--color-wrong)' }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
