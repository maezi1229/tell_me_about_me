'use strict';
const { applyBackground } = require('../lib/chrome');

/** content: { subtitle?, author?, date? } */
function render({ slide, spec, tokens, qa }) {
  applyBackground(slide, tokens);
  const { width_in: w, height_in: h, margin_in: m } = tokens.slide;
  const c = spec.content || {};

  slide.addShape('rect', {
    x: 0, y: 0, w, h: h * 0.62,
    fill: { color: tokens.colors.primary.replace('#', '') }
  });
  slide.addShape('rect', {
    x: 0, y: h * 0.6, w: w * 0.35, h: 0.06,
    fill: { color: tokens.colors.accent.replace('#', '') }
  });

  slide.addText(spec.title, {
    x: m, y: h * 0.28, w: w - 2 * m, h: 1.6,
    fontFace: tokens.fonts.heading, fontSize: tokens.type_scale.title, bold: true,
    color: tokens.colors.text_on_primary.replace('#', ''), align: 'left', valign: 'bottom'
  });
  qa.addBox(spec.id, { label: 'cover_title', role: 'title', x: m, y: h * 0.28, w: w - 2 * m, h: 1.6, text: spec.title, fontSize: tokens.type_scale.title, fontFace: tokens.fonts.heading, bold: true });

  if (c.subtitle) {
    slide.addText(c.subtitle, {
      x: m, y: h * 0.28 + 1.55, w: w - 2 * m, h: 0.6,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.h2,
      color: tokens.colors.text_on_primary.replace('#', ''), align: 'left', valign: 'top'
    });
  }

  const metaParts = [c.author, c.date].filter(Boolean);
  if (metaParts.length) {
    slide.addText(metaParts.join('　|　'), {
      x: m, y: h - 0.7, w: w - 2 * m, h: 0.4,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.small,
      color: tokens.colors.text_secondary.replace('#', ''), align: 'left', valign: 'middle'
    });
  }
}

module.exports = { render };
