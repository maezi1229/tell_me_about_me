'use strict';
const { applyBackground } = require('../lib/chrome');

/** content: { quote: string, attribution?: string } — title is used as a small kicker, not a headline, here. */
function render({ slide, spec, tokens, qa }) {
  applyBackground(slide, tokens);
  const { width_in: w, height_in: h, margin_in: m } = tokens.slide;
  const c = spec.content || {};

  slide.addShape('rect', { x: m, y: h * 0.28, w: 0.08, h: h * 0.4, fill: { color: tokens.colors.accent.replace('#', '') } });

  slide.addText(spec.title, {
    x: m, y: m, w: w - 2 * m, h: 0.4,
    fontFace: tokens.fonts.body, fontSize: tokens.type_scale.small, bold: true,
    color: tokens.colors.text_secondary.replace('#', ''), align: 'left'
  });

  slide.addText(`“${c.quote}”`, {
    x: m + 0.3, y: h * 0.28, w: w - 2 * m - 0.3, h: h * 0.4,
    fontFace: tokens.fonts.heading, fontSize: tokens.type_scale.h1,
    color: tokens.colors.text_primary.replace('#', ''), align: 'left', valign: 'middle', italic: true
  });
  qa.addBox(spec.id, { label: 'quote', role: 'body', x: m + 0.3, y: h * 0.28, w: w - 2 * m - 0.3, h: h * 0.4, text: c.quote, fontSize: tokens.type_scale.h1, fontFace: tokens.fonts.heading });

  if (c.attribution) {
    slide.addText(`— ${c.attribution}`, {
      x: m + 0.3, y: h * 0.68, w: w - 2 * m - 0.3, h: 0.4,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.body,
      color: tokens.colors.text_secondary.replace('#', ''), align: 'left'
    });
  }
}

module.exports = { render };
