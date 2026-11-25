import React, { useState } from 'react';
import { Crown, Check, RotateCcw, Sparkles, ShieldAlert, HelpCircle, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { useFxTier } from '../../design/fx';
import {
  BOSS_MODIFIER_INFO,
  type V1BossModifier,
  type V1NodeKind,
  type V1RunNode,
} from './engine';

export interface RunMapProps {
  nodes: readonly V1RunNode[];
  currentIndex: number;
  stageIndex: number;
  stageSize: number;
  isBossPhase: boolean;
  bossHp: number;
  bossDefeated: boolean;
  bossModifier?: V1BossModifier | null;
  compact?: boolean;
  examMode?: boolean;
  className?: string;
}

const NODE_KIND_COLOR: Record<V1NodeKind, string> = {
  vocab: 'var(--color-vocab)',
  collocation: 'var(--color-writing)',
  paraphrase: 'var(--color-reading)',
  error: 'var(--color-speaking)',
  listen: 'var(--color-listening)',
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
  bossModifier = null,
  compact = false,
  examMode = false,
  className = '',
}) => {
  const fx = useFxTier({ examMode });
  const [legendOpen, setLegendOpen] = useState(false);

  const stageNodes = nodes.filter((n) => n.stageIndex === stageIndex);
  const displayNodes = stageNodes.length > 0 ? stageNodes : nodes.slice(0, stageSize);

  return (
    <div
      className={`rounded-[var(--radius-lg)] border ${compact ? 'p-3 space-y-2.5' : 'p-3.5 sm:p-4 space-y-3'} ${className}`}
      style={{
        backgroundColor: isBossPhase
          ? 'color-mix(in srgb, var(--color-wrong) 10%, var(--color-surface))'
          : 'var(--color-surface)',
        borderColor: isBossPhase
          ? 'color-mix(in srgb, var(--color-wrong) 45%, var(--color-border))'
          : 'var(--color-border)',
      }}
      aria-label="Bản đồ chặng chạy"
      data-testid="v1-run-map"
    >
      {/* Tiêu đề gọn + nút tooltip "?" chú giải màu (bỏ hàng chú giải dài khỏi màn chơi) */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="font-semibold truncate"
            style={{ color: isBossPhase ? 'var(--color-wrong)' : 'var(--color-text)' }}
          >
            {isBossPhase ? 'Chặng Boss' : `Bản đồ chặng ${stageIndex + 1}`}
          </span>
          <span
            className="font-semibold tabular-nums shrink-0"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
          >
            {isBossPhase
              ? `HP ${bossHp}%`
              : `${Math.min(nodes.length, currentIndex + 1)}/${nodes.length}`}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setLegendOpen((v) => !v)}
          aria-expanded={legendOpen}
          aria-label="Chú giải màu loại thẻ"
          title="Chú giải màu loại thẻ"
          data-testid="v1-legend-toggle"
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-[var(--radius-sm)] border cursor-pointer shrink-0 transition-colors"
          style={{
            backgroundColor: legendOpen
              ? 'color-mix(in srgb, var(--color-vocab) 16%, var(--color-surface-2))'
              : 'var(--color-surface-2)',
            borderColor: legendOpen ? 'var(--color-vocab)' : 'var(--color-border)',
            color: legendOpen ? 'var(--color-vocab)' : 'var(--color-text-dim)',
          }}
        >
          <HelpCircle className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {legendOpen && (
        <div
          role="note"
          data-testid="v1-legend-tooltip"
          className="rounded-[var(--radius-md)] border p-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          {(Object.keys(NODE_KIND_COLOR) as V1NodeKind[]).map((kind) => (
            <span
              key={kind}
              className="inline-flex items-center gap-1.5"
              style={{ color: 'var(--color-text)' }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                style={{ backgroundColor: NODE_KIND_COLOR[kind] }}
              />
              <span>{NODE_KIND_LABEL_VI[kind]}</span>
            </span>
          ))}
        </div>
      )}

      {/* Lưới node tự xuống dòng (0 cuộn ngang, chữ >= 12px) */}
      <div className="flex flex-wrap items-center gap-1.5">
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
            <motion.div
              key={node.nodeId}
              animate={
                !fx.allowE1Slide
                  ? undefined
                  : isCurrent
                  ? { scale: [1, 1.06, 1] }
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
                color: isDone ? 'var(--color-on-accent)' : 'var(--color-text)',
                boxShadow: isCurrent
                  ? `0 0 0 3px color-mix(in srgb, ${baseColor} 28%, transparent)`
                  : 'none',
              }}
              title={`${NODE_KIND_LABEL_VI[node.nodeKind]}${
                node.isThornyNode ? ' · Đường gai ×1,5 XP' : ''
              }${node.isRetry ? ' · Làm lại' : ''}`}
            >
              {node.status === 'correct' ? (
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
              ) : node.isRetry ? (
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              ) : node.isThornyNode ? (
                <Flame className="w-3.5 h-3.5" aria-hidden="true" />
              ) : node.isRare ? (
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <span>{globalIdx + 1}</span>
              )}
            </motion.div>
          );
        })}

        {/* Node Boss cuối chặng */}
        <motion.div
          animate={
            !fx.allowE2Living
              ? undefined
              : isBossPhase && !bossDefeated
              ? { scale: [1, 1.06, 1] }
              : { scale: 1 }
          }
          transition={{ duration: 1.2, repeat: isBossPhase && !bossDefeated && fx.allowE2Living ? Infinity : 0 }}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold shrink-0"
          style={{
            backgroundColor: bossDefeated
              ? 'var(--color-correct)'
              : isBossPhase
              ? 'var(--color-wrong)'
              : 'color-mix(in srgb, var(--color-wrong) 18%, var(--color-surface-2))',
            borderColor: bossDefeated ? 'var(--color-correct)' : 'var(--color-wrong)',
            color: bossDefeated || isBossPhase ? 'var(--color-on-accent)' : 'var(--color-wrong)',
            boxShadow: isBossPhase ? 'var(--shadow-glow-wrong)' : 'none',
          }}
          title="Boss cuối chặng (5 thẻ khó nhất)"
        >
          {bossDefeated ? <Check className="w-4 h-4" aria-hidden="true" /> : <Crown className="w-4 h-4" aria-hidden="true" />}
        </motion.div>
      </div>

      {/* Thanh HP Boss + Luật Boss + Hiệu ứng vỡ thành 8 mảnh khi hạ Boss */}
      {(isBossPhase || bossDefeated) && (
        <div className="pt-1 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--color-wrong)' }}>
              <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                BOSS{bossModifier ? ` · ${BOSS_MODIFIER_INFO[bossModifier].labelVi}` : ''}
              </span>
            </span>
            <span
              className="tabular-nums"
              style={{
                fontFamily: 'var(--font-mono)',
                color: bossDefeated ? 'var(--color-correct)' : 'var(--color-wrong)',
              }}
            >
              {bossDefeated ? 'ĐÃ HẠ (+50 XP)' : `HP ${bossHp}%`}
            </span>
          </div>

          <div className="relative h-3.5 w-full rounded-full overflow-visible">
            {!bossDefeated ? (
              <div
                className="h-3 w-full rounded-full border overflow-hidden"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'color-mix(in srgb, var(--color-wrong) 50%, var(--color-border))',
                }}
              >
                <motion.div
                  initial={false}
                  animate={{ scaleX: Math.max(0, Math.min(1, bossHp / 100)) }}
                  transition={{ duration: fx.allowE1Slide ? 0.25 : 0.1, ease: [0.2, 0.8, 0.2, 1] }}
                  className="h-full w-full origin-left rounded-full"
                  style={{ backgroundColor: 'var(--color-wrong)' }}
                />
              </div>
            ) : (
              <div
                className="grid grid-cols-8 gap-1 h-3 w-full"
                data-testid="boss-hp-shatter"
              >
                {SHATTER_SHARDS.map((shard) => (
                  <motion.div
                    key={shard.id}
                    initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
                    animate={
                      !fx.allowE1Slide
                        ? { opacity: 0 }
                        : {
                            opacity: [1, 0.9, 0],
                            x: shard.dx,
                            y: shard.dy,
                            rotate: shard.rot,
                            scale: [1, 0.7, 0.2],
                          }
                    }
                    transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
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
