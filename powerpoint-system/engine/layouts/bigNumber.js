'use strict';
const { applyBackground, addTitle, addFooter, contentArea } = require('../lib/chrome');

/** content: { number: string, unit?: string, caption: string, insight?: string } */
function render({ slide, spec, tokens, qa, pageNumber, totalPages }) {
  applyBackground(slide, tokens);
  const topY = addTitle(slide, tokens, spec.title, qa, spec.id);
  const area = contentArea(tokens, topY);
  const c = spec.content || {};

  const numberText = c.unit ? `${c.number}${c.unit}` : String(c.number);
  slide.addText(numberText, {
    x: area.x, y: area.y, w: area.w, h: area.h * 0.55,
    fontFace: tokens.fonts.heading, fontSize: tokens.type_scale.big_number, bold: true,
    color: tokens.colors.primary.replace('#', ''), align: 'center', valign: 'bottom'
  });
  if (c.caption) {
    slide.addText(c.caption, {
      x: area.x, y: area.y + area.h * 0.55, w: area.w, h: 0.5,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.h2,
      color: tokens.colors.text_secondary.replace('#', ''), align: 'center', valign: 'top'
    });
  }
  if (c.insight) {
    slide.addText(c.insight, {
      x: area.x + area.w * 0.1, y: area.y + area.h * 0.7, w: area.w * 0.8, h: area.h * 0.3,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.body,
      color: tokens.colors.text_primary.replace('#', ''), align: 'center', valign: 'top', italic: true
    });
    qa.addBox(spec.id, { label: 'insight', role: 'body', x: area.x + area.w * 0.1, y: area.y + area.h * 0.7, w: area.w * 0.8, h: area.h * 0.3, text: c.insight, fontSize: tokens.type_scale.body, fontFace: tokens.fonts.body });
  }

  addFooter(slide, tokens, { pageNumber, totalPages });
}

module.exports = { render };
