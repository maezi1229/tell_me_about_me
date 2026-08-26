'use strict';
/**
 * Heuristic text metrics used only for mechanical overflow QA (Section 21/49).
 * This is deliberately approximate — it exists to catch obviously-too-much
 * text for a box, not to pixel-match PowerPoint's own text layout engine.
 */

const CJK_RE = /[　-〿぀-ヿ㐀-䶿一-鿿＀-￯]/;

function isCjk(ch) {
  return CJK_RE.test(ch);
}

/** Average glyph width in inches for a given font size (pt). CJK glyphs are ~full-width. */
function avgCharWidthIn(fontSizePt, ch) {
  const sizeIn = fontSizePt / 72;
  return isCjk(ch) ? sizeIn * 1.0 : sizeIn * 0.52;
}

/** Estimate how many wrapped lines `text` needs inside a box `widthIn` wide. */
function estimateLines(text, fontSizePt, widthIn) {
  if (!text) return 0;
  const paragraphs = String(text).split('\n');
  let totalLines = 0;
  for (const para of paragraphs) {
    if (para.length === 0) {
      totalLines += 1;
      continue;
    }
    let lineWidth = 0;
    let lines = 1;
    for (const ch of para) {
      const w = avgCharWidthIn(fontSizePt, ch);
      if (lineWidth + w > widthIn) {
        lines += 1;
        lineWidth = w;
      } else {
        lineWidth += w;
      }
    }
    totalLines += lines;
  }
  return totalLines;
}

/** Estimate block height in inches for text inside a box of widthIn, given font size and line-height multiple. */
function estimateTextHeightIn(text, fontSizePt, widthIn, lineHeightMultiple = 1.3) {
  const lines = estimateLines(text, fontSizePt, widthIn);
  return lines * (fontSizePt / 72) * lineHeightMultiple;
}

module.exports = { isCjk, avgCharWidthIn, estimateLines, estimateTextHeightIn };
