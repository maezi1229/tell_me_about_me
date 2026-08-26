'use strict';
/**
 * Shared "chrome" every non-cover layout uses: title band, footer/page number,
 * background. Keeping this in one place is what makes slide-to-slide design
 * consistency (Section 51 contact-sheet check) possible at all — individual
 * layouts must not hand-roll their own title styling.
 */
const { estimateLines } = require('./textMetrics');

function applyBackground(slide, tokens) {
  slide.background = { color: tokens.colors.background.replace('#', '') };
}

/**
 * Places the slide title as the page's stated conclusion (Section 9).
 * Returns the Y (inches) where body content may safely start.
 */
function addTitle(slide, tokens, titleText, qa, slideId, opts = {}) {
  const m = tokens.slide.margin_in;
  const w = tokens.slide.width_in - 2 * m;
  const fontSize = opts.fontSize || tokens.type_scale.h1;
  const maxWidthForEstimate = w - 0.1;
  const lines = Math.min(3, Math.max(1, estimateLines(titleText, fontSize, maxWidthForEstimate)));
  const lineHeightIn = (fontSize / 72) * 1.25;
  const boxH = Math.max(0.55, lines * lineHeightIn + 0.15);

  slide.addText(titleText, {
    x: m,
    y: m,
    w,
    h: boxH,
    fontFace: tokens.fonts.heading,
    fontSize,
    bold: true,
    color: tokens.colors.text_primary.replace('#', ''),
    valign: 'top',
    align: 'left',
    autoFit: false
  });

  qa.addBox(slideId, {
    label: 'title',
    role: 'title',
    x: m, y: m, w, h: boxH,
    text: titleText,
    fontSize,
    fontFace: tokens.fonts.heading
  });

  // accent rule under the title
  slide.addShape('line', {
    x: m,
    y: m + boxH + tokens.spacing.unit * 0.4,
    w,
    h: 0,
    line: { color: tokens.colors.accent.replace('#', ''), width: 1.5 }
  });

  return m + boxH + tokens.spacing.unit * 1.2;
}

function addFooter(slide, tokens, { pageNumber, totalPages, isCover = false, sourceNote = null } = {}) {
  if (isCover && tokens.footer.show_on_cover === false) return;
  const m = tokens.slide.margin_in;
  const y = tokens.slide.height_in - 0.4;

  if (tokens.footer.text) {
    slide.addText(tokens.footer.text, {
      x: m, y, w: tokens.slide.width_in / 2 - m, h: 0.3,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.small,
      color: tokens.colors.text_secondary.replace('#', ''), align: 'left', valign: 'middle'
    });
  }

  if (sourceNote) {
    slide.addText(sourceNote, {
      x: m, y, w: tokens.slide.width_in - 2 * m - 1.0, h: 0.3,
      fontFace: tokens.fonts.body, fontSize: 8,
      color: tokens.colors.text_secondary.replace('#', ''), align: 'left', valign: 'middle'
    });
  }

  if (tokens.footer.show_page_number && pageNumber) {
    slide.addText(totalPages ? `${pageNumber} / ${totalPages}` : String(pageNumber), {
      x: tokens.slide.width_in - m - 1.0, y, w: 1.0, h: 0.3,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.small,
      color: tokens.colors.text_secondary.replace('#', ''), align: 'right', valign: 'middle'
    });
  }
}

function contentArea(tokens, topY) {
  const m = tokens.slide.margin_in;
  return {
    x: m,
    y: topY,
    w: tokens.slide.width_in - 2 * m,
    h: tokens.slide.height_in - topY - 0.55
  };
}

module.exports = { applyBackground, addTitle, addFooter, contentArea };
