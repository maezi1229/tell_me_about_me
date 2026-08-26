'use strict';
/**
 * Heuristic text metrics used only for mechanical overflow QA (Section 21/49).
 * This is deliberately approximate — it exists to catch obviously-too-much
 * text for a box, not to pixel-match PowerPoint's own text layout engine.
 */

const CJK_RE = /[　-〿぀-ヿ㐀-䶿一-鿿＀-￯]/;

// Bold glyphs render measurably wider than the regular-weight estimate below;
// found via a real overflow (chrome.addTitle is always bold) where the
// unweighted estimate predicted 1 line but LibreOffice/PowerPoint wrapped to
// 2, pushing the accent rule and body content into the wrapped second line.
const BOLD_WIDTH_FACTOR = 1.12;

function isCjk(ch) {
  return CJK_RE.test(ch);
}

/** Average glyph width in inches for a given font size (pt). CJK glyphs are ~full-width. */
function avgCharWidthIn(fontSizePt, ch, bold = false) {
  const sizeIn = fontSizePt / 72;
  const base = isCjk(ch) ? sizeIn * 1.0 : sizeIn * 0.52;
  return bold ? base * BOLD_WIDTH_FACTOR : base;
}

/** Estimate how many wrapped lines `text` needs inside a box `widthIn` wide. */
function estimateLines(text, fontSizePt, widthIn, bold = false) {
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
      const w = avgCharWidthIn(fontSizePt, ch, bold);
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
function estimateTextHeightIn(text, fontSizePt, widthIn, lineHeightMultiple = 1.3, bold = false) {
  const lines = estimateLines(text, fontSizePt, widthIn, bold);
  return lines * (fontSizePt / 72) * lineHeightMultiple;
}

module.exports = { isCjk, avgCharWidthIn, estimateLines, estimateTextHeightIn };
