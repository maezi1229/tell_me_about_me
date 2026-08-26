'use strict';
const { applyBackground, addTitle, addFooter, contentArea } = require('../lib/chrome');

/** content: { items: [{ label: string }] } */
function render({ slide, spec, tokens, qa, pageNumber, totalPages }) {
  applyBackground(slide, tokens);
  const topY = addTitle(slide, tokens, spec.title, qa, spec.id);
  const area = contentArea(tokens, topY);
  const items = (spec.content && spec.content.items) || [];
  const rowH = Math.min(0.9, area.h / Math.max(items.length, 1));

  items.forEach((item, i) => {
    const y = area.y + i * rowH;
    slide.addText(String(i + 1).padStart(2, '0'), {
      x: area.x, y, w: 0.7, h: rowH,
      fontFace: tokens.fonts.heading, fontSize: tokens.type_scale.h2, bold: true,
      color: tokens.colors.accent.replace('#', ''), align: 'left', valign: 'middle'
    });
    slide.addText(typeof item === 'string' ? item : item.label, {
      x: area.x + 0.8, y, w: area.w - 0.8, h: rowH,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.h2,
      color: tokens.colors.text_primary.replace('#', ''), align: 'left', valign: 'middle'
    });
    qa.addBox(spec.id, { label: `agenda_item_${i}`, role: 'body', x: area.x + 0.8, y, w: area.w - 0.8, h: rowH, text: typeof item === 'string' ? item : item.label, fontSize: tokens.type_scale.h2, fontFace: tokens.fonts.body });
    if (i < items.length - 1) {
      slide.addShape('line', { x: area.x, y: y + rowH, w: area.w, h: 0, line: { color: tokens.colors.border.replace('#', ''), width: 0.75 } });
    }
  });

  addFooter(slide, tokens, { pageNumber, totalPages });
}

module.exports = { render };
