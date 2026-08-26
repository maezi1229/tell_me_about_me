'use strict';
const { applyBackground, addTitle, addFooter, contentArea } = require('../lib/chrome');

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

  columns.forEach((col, i) => {
    const x = area.x + i * (colW + gap);
    const headBg = col.emphasize ? tokens.colors.primary : tokens.colors.text_secondary;
    slide.addShape('rect', {
      x, y: area.y, w: colW, h: 0.55,
      fill: { color: headBg.replace('#', '') }
    });
    slide.addText(col.heading, {
      x, y: area.y, w: colW, h: 0.55,
      fontFace: tokens.fonts.heading, fontSize: tokens.type_scale.h2, bold: true,
      color: tokens.colors.text_on_primary.replace('#', ''), align: 'center', valign: 'middle'
    });
    slide.addShape('rect', {
      x, y: area.y + 0.55, w: colW, h: colH - 0.55,
      fill: { color: col.emphasize ? tokens.colors.surface.replace('#', '') : tokens.colors.background.replace('#', '') },
      line: { color: tokens.colors.border.replace('#', ''), width: 1 }
    });
    const items = col.items || [];
    const bodyText = items.map((t) => ({ text: t, options: { bullet: true, breakLine: true } }));
    slide.addText(bodyText, {
      x: x + 0.15, y: area.y + 0.7, w: colW - 0.3, h: colH - 0.85,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.body,
      color: tokens.colors.text_primary.replace('#', ''), valign: 'top', align: 'left',
      paraSpaceAfter: 6, lineSpacingMultiple: 1.2
    });
    qa.addBox(spec.id, { label: `comparison_col_${i}`, role: 'body', x: x + 0.15, y: area.y + 0.7, w: colW - 0.3, h: colH - 0.85, text: items.join('\n'), fontSize: tokens.type_scale.body, fontFace: tokens.fonts.body });
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
