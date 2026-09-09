/**
 * Matching a typed query against a name that may be written three ways.
 *
 * A reader who sees 三笘薫 on the page types 三笘薫 — or みとま, or ミトマ, or
 * Mitoma, depending on what their keyboard is doing at the time. Until now the
 * player filter compared the query against the Latin name alone, so the one
 * spelling actually printed on the page was the one that returned nothing.
 *
 * Both sides go through the same folding, so anything that survives it on one
 * side survives it on the other.
 */

/**
 * Folds away the differences that are never meaningful in a search box:
 * case, accents, full-width forms, and the hiragana/katakana split.
 *
 * Accents matter because the feed itself is inconsistent about them — the same
 * player arrives as "Daniel Muñoz" and "D. Munoz" — so a reader copying either
 * one has to find him.
 */
export function foldForSearch(value: string): string {
  return value
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))
    .replace(/[øØ]/g, "o")
    .replace(/[đĐ]/g, "d")
    .replace(/[łŁ]/g, "l")
    .replace(/ß/g, "ss")
    .replace(/[・･\s]+/g, "")
    .toLowerCase()
    .trim();
}

/**
 * True when `query` appears in any of `names`. An empty query matches
 * everything, so callers can pass the raw input without guarding it.
 */
export function nameMatchesQuery(names: (string | undefined)[], query: string): boolean {
  const q = foldForSearch(query);
  if (!q) return true;
  return names.some((name) => name && foldForSearch(name).includes(q));
}
