const LETTER_ORDER = ['P', 'M', 'G', 'GG', 'GGG'];

function sizeIndex(size) {
  const s = String(size ?? '').trim().toUpperCase();
  const li = LETTER_ORDER.indexOf(s);
  if (li !== -1) return li;                    // P=0, M=1, G=2, GG=3, GGG=4
  const n = parseFloat(s);
  if (!isNaN(n)) return 10000 - n;             // numérico decrescente: 44 → 9956, 36 → 9964
  return 9999;                                 // desconhecido: vai pro final
}

export function sortSizes(sizes) {
  return [...sizes].sort((a, b) => sizeIndex(a) - sizeIndex(b));
}

export function sortVariants(variants) {
  return [...variants].sort((a, b) => sizeIndex(a.size) - sizeIndex(b.size));
}
