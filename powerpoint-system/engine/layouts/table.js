'use strict';
const { applyBackground, addTitle, addFooter, contentArea } = require('../lib/chrome');

/** content: { headers: string[], rows: string[][], insight? } — for reference detail, usually Appendix (Section 34). */
function render({ slide, spec, tokens, qa, pageNumber, totalPages }) {
  applyBackground(slide, tokens);
  const topY = addTitle(slide, tokens, spec.title, qa, spec.id);
  const area = contentArea(tokens, topY);
  const c = spec.content || {};
  const insightH = c.insight ? 0.5 : 0;

  const headerRow = (c.headers || []).map((h) => ({
    text: h,
    options: {
      bold: true,
      color: tokens.colors.text_on_primary.replace('#', ''),
      fill: { color: tokens.colors.primary.replace('#', '') },
      fontFace: tokens.fonts.heading,
      fontSize: tokens.type_scale.small,
      align: 'left',
      valign: 'middle'
    }
  }));
  const bodyRows = (c.rows || []).map((row, ri) =>
    row.map((cell) => ({
      text: String(cell),
      options: {
        color: tokens.colors.text_primary.replace('#', ''),
        fill: { color: ri % 2 === 0 ? tokens.colors.background.replace('#', '') : tokens.colors.surface.replace('#', '') },
        fontFace: tokens.fonts.body,
        fontSize: tokens.type_scale.small,
        align: 'left',
        valign: 'middle'
      }
    }))
  );

  slide.addTable([headerRow, ...bodyRows], {
    x: area.x, y: area.y, w: area.w, h: area.h - insightH,
    border: { type: 'solid', color: tokens.colors.border.replace('#', ''), pt: 0.5 },
    autoPage: false
  });

  if (c.insight) {
    slide.addText(c.insight, {
      x: area.x, y: area.y + area.h - insightH, w: area.w, h: insightH,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.body, italic: true,
      color: tokens.colors.text_primary.replace('#', ''), align: 'left', valign: 'middle'
    });
  }

  addFooter(slide, tokens, { pageNumber, totalPages });
}

module.exports = { render };
