'use strict';
const { applyBackground, addTitle, addFooter, contentArea } = require('../lib/chrome');
const { estimateLines } = require('../lib/textMetrics');

/** content: { columns: [{ heading, items: string[], emphasize?: boolean }], insight? } */
function render({ slide, spec, tokens, qa, pageNumber, totalPages }) {
  applyBackground(slide, tokens);
  const topY = addTitle(slide, tokens, spec.title, qa, spec.id);
  const area = contentArea(tokens, topY);
  const c = spec.content || {};
  const columns = c.columns || [];
  const gap = tokens.spacing.unit;
  const colH = c.insight ? area.h * 0.82 : area.h;
  const colW = (area.w - gap * (columns.length - 1)) / columns.length;
  const headFontSize = tokens.type_scale.h2;
  // Size each header band to fit its own wrapped text (never force a shrink-to-fit
  // on bold reversed-color text — a squeezed render was found to blur "J" into "I").
  const headH = Math.max(
    0.55,
    ...columns.map((col) => {
      const lines = Math.max(1, estimateLines(col.heading || '', headFontSize, (colW - 0.2) * 0.95, true));
      return lines * (headFontSize / 72) * 1.25 + 0.2;
    })
  );

  columns.forEach((col, i) => {
    const x = area.x + i * (colW + gap);
    const headBg = col.emphasize ? tokens.colors.primary : tokens.colors.text_secondary;
    slide.addShape('rect', {
      x, y: area.y, w: colW, h: headH,
      fill: { color: headBg.replace('#', '') }
    });
    slide.addText(col.heading, {
      x, y: area.y, w: colW, h: headH,
      fontFace: tokens.fonts.heading, fontSize: headFontSize, bold: true,
      color: tokens.colors.text_on_primary.replace('#', ''), align: 'center', valign: 'middle', autoFit: false
    });
    slide.addShape('rect', {
      x, y: area.y + headH, w: colW, h: colH - headH,
      fill: { color: col.emphasize ? tokens.colors.surface.replace('#', '') : tokens.colors.background.replace('#', '') },
      line: { color: tokens.colors.border.replace('#', ''), width: 1 }
    });
    const items = col.items || [];
    const bodyText = items.map((t) => ({ text: t, options: { bullet: true, breakLine: true } }));
    slide.addText(bodyText, {
      x: x + 0.15, y: area.y + headH + 0.15, w: colW - 0.3, h: colH - headH - 0.3,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.body,
      color: tokens.colors.text_primary.replace('#', ''), valign: 'top', align: 'left',
      paraSpaceAfter: 6, lineSpacingMultiple: 1.2
    });
    qa.addBox(spec.id, { label: `comparison_col_${i}`, role: 'body', x: x + 0.15, y: area.y + headH + 0.15, w: colW - 0.3, h: colH - headH - 0.3, text: items.join('\n'), fontSize: tokens.type_scale.body, fontFace: tokens.fonts.body });
    qa.addBox(spec.id, { label: `comparison_head_${i}`, role: 'title', x, y: area.y, w: colW, h: headH, text: col.heading, fontSize: headFontSize, fontFace: tokens.fonts.heading, bold: true });
  });

  if (c.insight) {
    slide.addText(c.insight, {
      x: area.x, y: area.y + colH + gap * 0.5, w: area.w, h: area.h - colH - gap * 0.5,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.body, italic: true,
      color: tokens.colors.text_primary.replace('#', ''), align: 'left', valign: 'top'
    });
  }

  addFooter(slide, tokens, { pageNumber, totalPages });
}

module.exports = { render };
