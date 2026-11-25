// Bộ rút gốc từ đơn giản dùng cho D10 (decoy chung lemma với questionPhrase).
const STOP = new Set('the a an of to in on for and or is are was were be been by with as at from that this it its their his her which who whom into than more most not no nor so such there these those they them we you i he she our your can could may might will would should must do does did have has had very also only just about over under between among through during before after'.split(' '));
export function stem(w) {
  w = w.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length > 4) {
    for (const [suf, rep] of [['ies', 'y'], ['ing', ''], ['edly', ''], ['ed', ''], ['est', ''], ['er', ''], ['ly', ''], ['es', ''], ['s', '']]) {
      if (w.endsWith(suf) && w.length - suf.length >= 3) { w = w.slice(0, -suf.length) + rep; break; }
    }
  }
  return w;
}
export const lemmas = (s) => s.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2 && !STOP.has(w)).map(stem);
export function sharesLemma(a, b) {
  const sa = new Set(lemmas(a));
  return lemmas(b).some((x) => sa.has(x));
}
