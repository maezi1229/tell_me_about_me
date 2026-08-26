'use strict';
const { applyBackground, addTitle, addFooter, contentArea } = require('../lib/chrome');

/**
 * content: {
 *   x_axis_label?: string, y_axis_label?: string,
 *   quadrants: [ {heading, items: string[]}, {..top-right}, {..bottom-left}, {..bottom-right} ]
 * }
 */
function render({ slide, spec, tokens, qa, pageNumber, totalPages }) {
  applyBackground(slide, tokens);
  const topY = addTitle(slide, tokens, spec.title, qa, spec.id);
  const area = contentArea(tokens, topY);
  const c = spec.content || {};
  const quadrants = c.quadrants || [];
  const gap = 0.15;
  const cellW = (area.w - gap) / 2;
  const cellH = (area.h - gap) / 2;
  const positions = [
    { x: area.x, y: area.y },
    { x: area.x + cellW + gap, y: area.y },
    { x: area.x, y: area.y + cellH + gap },
    { x: area.x + cellW + gap, y: area.y + cellH + gap }
  ];
  const fills = [tokens.colors.surface, tokens.colors.primary, tokens.colors.primary, tokens.colors.surface];
  const useLightText = [false, true, true, false];

  quadrants.slice(0, 4).forEach((q, i) => {
    const pos = positions[i];
    slide.addShape('rect', {
      x: pos.x, y: pos.y, w: cellW, h: cellH,
      fill: { color: fills[i].replace('#', '') },
      line: { color: tokens.colors.border.replace('#', ''), width: 1 }
    });
    const textColor = useLightText[i] ? tokens.colors.text_on_primary : tokens.colors.text_primary;
    slide.addText(q.heading || '', {
      x: pos.x + 0.15, y: pos.y + 0.1, w: cellW - 0.3, h: 0.4,
      fontFace: tokens.fonts.heading, fontSize: tokens.type_scale.body, bold: true,
      color: textColor.replace('#', ''), align: 'left'
    });
    const items = q.items || [];
    slide.addText(items.map((t) => ({ text: t, options: { bullet: true, breakLine: true } })), {
      x: pos.x + 0.15, y: pos.y + 0.5, w: cellW - 0.3, h: cellH - 0.6,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.small,
      color: textColor.replace('#', ''), valign: 'top', align: 'left', lineSpacingMultiple: 1.2
    });
    qa.addBox(spec.id, { label: `quadrant_${i}`, role: 'body', x: pos.x + 0.15, y: pos.y + 0.5, w: cellW - 0.3, h: cellH - 0.6, text: items.join('\n'), fontSize: tokens.type_scale.small, fontFace: tokens.fonts.body });
  });

  if (c.x_axis_label) {
    slide.addText(c.x_axis_label, {
      x: area.x, y: area.y + area.h + 0.02, w: area.w, h: 0.3,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.small,
      color: tokens.colors.text_secondary.replace('#', ''), align: 'center'
    });
  }

  addFooter(slide, tokens, { pageNumber, totalPages });
}

module.exports = { render };
