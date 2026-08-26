'use strict';
const { applyBackground } = require('../lib/chrome');

/** content: { number?: "01", kicker?: string } */
function render({ slide, spec, tokens, qa }) {
  applyBackground(slide, tokens);
  const { width_in: w, height_in: h, margin_in: m } = tokens.slide;
  const c = spec.content || {};

  slide.background = { color: tokens.colors.primary.replace('#', '') };

  if (c.number) {
    slide.addText(c.number, {
      x: m, y: h * 0.28, w: 2.5, h: 1.2,
      fontFace: tokens.fonts.heading, fontSize: 54, bold: true,
      color: tokens.colors.accent.replace('#', ''), align: 'left', valign: 'top'
    });
  }
  if (c.kicker) {
    slide.addText(c.kicker, {
      x: m, y: h * 0.28 + (c.number ? 1.1 : 0), w: w - 2 * m, h: 0.4,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.small,
      color: tokens.colors.text_on_primary.replace('#', ''), align: 'left'
    });
  }
  slide.addText(spec.title, {
    x: m, y: h * 0.28 + (c.number ? 1.5 : 0.4), w: w - 2 * m, h: 1.4,
    fontFace: tokens.fonts.heading, fontSize: tokens.type_scale.title * 0.75, bold: true,
    color: tokens.colors.text_on_primary.replace('#', ''), align: 'left', valign: 'top'
  });
  qa.addBox(spec.id, { label: 'divider_title', role: 'title', x: m, y: h * 0.28 + (c.number ? 1.5 : 0.4), w: w - 2 * m, h: 1.4, text: spec.title, fontSize: tokens.type_scale.title * 0.75, fontFace: tokens.fonts.heading, bold: true });
}

module.exports = { render };
