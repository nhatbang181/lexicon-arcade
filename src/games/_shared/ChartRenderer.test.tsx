import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  WritingTask1PromptSchema,
  type WritingTask1Prompt,
} from '../../core/content/schemas';
import { ChartRenderer, resolveVisualKind } from './ChartRenderer';

const TASK1_DIR = resolve(process.cwd(), 'public/data/writing/task1');

function loadAllTask1Visuals(): Array<{ file: string; item: WritingTask1Prompt }> {
  const files = readdirSync(TASK1_DIR)
    .filter((f) => /^w1_\d+\.json$/.test(f))
    .sort();

  return files.map((file) => {
    const raw = JSON.parse(readFileSync(resolve(TASK1_DIR, file), 'utf8'));
    const item = WritingTask1PromptSchema.parse(raw);
    return { file, item };
  });
}

const ALL_VISUALS = loadAllTask1Visuals();

afterEach(() => {
  cleanup();
});

describe('ChartRenderer — 24 real IELTS Task 1 visuals', () => {
  it('loads all 24 real Task 1 files covering all 7 VisualSpec kinds', () => {
    expect(ALL_VISUALS).toHaveLength(24);
    const kinds = new Set(ALL_VISUALS.map(({ item }) => item.kind));
    expect(kinds).toEqual(new Set(['bar', 'line', 'pie', 'table', 'mixed', 'process', 'map']));
  });

  for (const { file, item } of ALL_VISUALS) {
    it(`renders ${file} (${item.id} · ${item.kind}) cleanly`, () => {
      const { container } = render(<ChartRenderer visual={item} />);

      const root = container.querySelector('[data-testid="chart-renderer"]');
      expect(root).not.toBeNull();
      expect(root?.getAttribute('data-visual-kind')).toBe(item.kind);

      switch (item.kind) {
        case 'bar': {
          const barWrap = container.querySelector('[data-testid="chart-bar"]');
          expect(barWrap).not.toBeNull();
          const svg = barWrap?.querySelector('svg[role="img"]');
          expect(svg).not.toBeNull();
          expect(container.textContent).toContain(item.chart!.title);
          // At least one bar rect per category * series
          const expectedBars = item.chart!.categories.length * item.chart!.series.length;
          const barRects = svg?.querySelectorAll('g > rect') ?? [];
          expect(barRects.length).toBeGreaterThanOrEqual(expectedBars);
          break;
        }
        case 'line': {
          const lineWrap = container.querySelector('[data-testid="chart-line"]');
          expect(lineWrap).not.toBeNull();
          const svg = lineWrap?.querySelector('svg[role="img"]');
          expect(svg).not.toBeNull();
          expect(container.textContent).toContain(item.chart!.title);
          const seriesPaths = svg?.querySelectorAll('path') ?? [];
          expect(seriesPaths.length).toBe(item.chart!.series.length);
          break;
        }
        case 'pie': {
          const pieWrap = container.querySelector('[data-testid="chart-pie"]');
          expect(pieWrap).not.toBeNull();
          const pieSvgs = pieWrap?.querySelectorAll('svg[role="img"]') ?? [];
          expect(pieSvgs.length).toBe(item.chart!.series.length);
          expect(container.textContent).toContain(item.chart!.title);
          break;
        }
        case 'table': {
          const tableWrap = container.querySelector('[data-testid="chart-table"]');
          expect(tableWrap).not.toBeNull();
          const ths = tableWrap?.querySelectorAll('thead th') ?? [];
          const trs = tableWrap?.querySelectorAll('tbody tr') ?? [];
          expect(ths.length).toBe(item.table!.columns.length);
          expect(trs.length).toBe(item.table!.rows.length);
          expect(container.textContent).toContain(item.table!.title);
          break;
        }
        case 'mixed': {
          const mixedWrap = container.querySelector('[data-testid="chart-mixed"]');
          expect(mixedWrap).not.toBeNull();
          expect(mixedWrap?.querySelector('svg[role="img"]')).not.toBeNull();
          expect(mixedWrap?.querySelector('table')).not.toBeNull();
          expect(container.textContent).toContain(item.chart!.title);
          expect(container.textContent).toContain(item.table!.title);
          break;
        }
        case 'process': {
          const procWrap = container.querySelector('[data-testid="chart-process"]');
          expect(procWrap).not.toBeNull();
          const svg = procWrap?.querySelector('svg[role="img"]');
          expect(svg).not.toBeNull();
          expect(container.textContent).toContain(item.process!.title);
          expect(container.textContent).toContain(
            item.process!.cyclic ? 'Cyclic process' : 'Linear process',
          );
          const stepBoxes = svg?.querySelectorAll('g > rect') ?? [];
          expect(stepBoxes.length).toBe(item.process!.steps.length);
          break;
        }
        case 'map': {
          const mapWrap = container.querySelector('[data-testid="chart-map"]');
          expect(mapWrap).not.toBeNull();
          const mapViews = mapWrap?.querySelectorAll('[data-testid="map-view"]') ?? [];
          expect(mapViews.length).toBe(2);
          expect(container.textContent).toContain(item.maps!.before.year);
          expect(container.textContent).toContain(item.maps!.after.year);
          break;
        }
      }
    });
  }
});

describe('ChartRenderer — props & kind inference', () => {
  it('supports optional outer title and compact mode', () => {
    const sample = ALL_VISUALS[0].item;
    const { container } = render(
      <ChartRenderer visual={sample} title="Task 1 Figure A" compact />,
    );
    expect(container.querySelector('figcaption')?.textContent).toBe('Task 1 Figure A');
    expect(container.querySelector('[data-testid="chart-bar"]')).not.toBeNull();
  });

  it('infers visual kind when plain VisualSpec has no kind field', () => {
    const barOnly = { chart: ALL_VISUALS.find((v) => v.item.kind === 'bar')!.item.chart };
    const lineOnly = { chart: ALL_VISUALS.find((v) => v.item.kind === 'line')!.item.chart };
    const pieOnly = { chart: ALL_VISUALS.find((v) => v.item.kind === 'pie')!.item.chart };
    const tableOnly = { table: ALL_VISUALS.find((v) => v.item.kind === 'table')!.item.table };
    const mixedOnly = {
      chart: ALL_VISUALS.find((v) => v.item.kind === 'mixed')!.item.chart,
      table: ALL_VISUALS.find((v) => v.item.kind === 'mixed')!.item.table,
    };
    const processOnly = { process: ALL_VISUALS.find((v) => v.item.kind === 'process')!.item.process };
    const mapOnly = { maps: ALL_VISUALS.find((v) => v.item.kind === 'map')!.item.maps };

    expect(resolveVisualKind(barOnly)).toBe('bar');
    expect(resolveVisualKind(lineOnly)).toBe('line');
    expect(resolveVisualKind(pieOnly)).toBe('pie');
    expect(resolveVisualKind(tableOnly)).toBe('table');
    expect(resolveVisualKind(mixedOnly)).toBe('mixed');
    expect(resolveVisualKind(processOnly)).toBe('process');
    expect(resolveVisualKind(mapOnly)).toBe('map');
  });
});
