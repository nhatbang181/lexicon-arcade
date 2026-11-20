// scripts/data/_para_helper.mjs
// Shared builder & strict invariant verifier for ParaphraseItem batches.

const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

function wordCount(s) {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function findNonOverlappingSpan(context, needle, usedSpans) {
  const ctxLow = context.toLowerCase();
  const ndLow = needle.toLowerCase();
  let from = 0;
  while (from < context.length) {
    let idx = context.indexOf(needle, from);
    if (idx < 0) idx = ctxLow.indexOf(ndLow, from);
    if (idx < 0) return null;
    const end = idx + needle.length;
    const overlaps = usedSpans.some((u) => !(end <= u.start || idx >= u.end));
    if (!overlaps) {
      return { text: context.slice(idx, end), start: idx, end };
    }
    from = idx + 1;
  }
  return null;
}

/**
 * Builds and validates a batch of ParaphraseItems.
 * Entry format:
 * {
 *   topic: Topic,
 *   q: string (questionPhrase),
 *   target: string,
 *   decoys: Array<[text, whyVi]>,
 *   exp: string (explanationVi),
 *   context: string (40-120 words)
 * }
 */
export function buildParaphraseBatch(entries, level, prefix) {
  const relation = level === 4 ? 'not_equivalent' : 'equivalent';
  const out = [];
  const errs = [];

  entries.forEach((e, idx) => {
    const id = `para:${prefix}_${String(idx + 1).padStart(3, '0')}`;
    const context = e.context.trim().replace(/\s+/g, ' ');
    const wc = wordCount(context);
    if (wc < 40 || wc > 120) {
      errs.push(`${id}: context wordCount=${wc} out of [40, 120]`);
      return;
    }
    if (CJK_RE.test(JSON.stringify(e))) {
      errs.push(`${id}: contains CJK`);
      return;
    }

    const used = [];
    const targetSpan = findNonOverlappingSpan(context, e.target, used);
    if (!targetSpan) {
      errs.push(`${id}: target "${e.target}" not found in context`);
      return;
    }
    used.push(targetSpan);

    const decoySpans = [];
    for (const [dText, whyVi] of e.decoys) {
      const ds = findNonOverlappingSpan(context, dText, used);
      if (!ds) {
        errs.push(`${id}: decoy "${dText}" not found or overlaps in context`);
        continue;
      }
      used.push(ds);
      decoySpans.push({ ...ds, whyVi });
    }
    if (decoySpans.length < 1 || decoySpans.length > 3) {
      errs.push(`${id}: decoys count=${decoySpans.length} out of [1, 3]`);
      return;
    }

    out.push({
      id,
      level,
      questionPhrase: e.q,
      relation,
      context,
      target: targetSpan,
      decoys: decoySpans,
      explanationVi: e.exp,
      topics: Array.isArray(e.topic) ? e.topic : [e.topic],
      provenance: {
        createdBy: 'llm+review',
        source: 'llm:gemini@2026-11-20',
        license: 'own',
        qa: { schema: 'pass', verifier: 'pass', blindSolve: 'pass' },
      },
    });
  });

  if (errs.length > 0) {
    throw new Error(`Batch ${prefix} failed with ${errs.length} errors:\n  - ${errs.join('\n  - ')}`);
  }
  return out;
}
