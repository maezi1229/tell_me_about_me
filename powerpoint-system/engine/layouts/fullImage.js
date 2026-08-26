'use strict';
const { addImageOrPlaceholder } = require('../lib/placeholder');

/** content: { image: {path, alt}, caption?: string } — full-bleed, title overlays the image as a caption bar. */
function render({ slide, spec, tokens, qa }) {
  const { width_in: w, height_in: h } = tokens.slide;
  const c = spec.content || {};

  addImageOrPlaceholder(slide, { path: c.image && c.image.path, x: 0, y: 0, w, h, altText: (c.image && c.image.alt) || spec.title }, tokens, qa, spec.id);

  const barH = 1.3;
  slide.addShape('rect', {
    x: 0, y: h - barH, w, h: barH,
    fill: { color: tokens.colors.primary.replace('#', ''), transparency: 15 }
  });
  slide.addText(spec.title, {
    x: tokens.slide.margin_in, y: h - barH, w: w - 2 * tokens.slide.margin_in, h: barH * 0.65,
    fontFace: tokens.fonts.heading, fontSize: tokens.type_scale.h1, bold: true,
    color: tokens.colors.text_on_primary.replace('#', ''), align: 'left', valign: 'bottom'
  });
  qa.addBox(spec.id, { label: 'overlay_title', role: 'title', x: tokens.slide.margin_in, y: h - barH, w: w - 2 * tokens.slide.margin_in, h: barH * 0.65, text: spec.title, fontSize: tokens.type_scale.h1, fontFace: tokens.fonts.heading });
  if (c.caption) {
    slide.addText(c.caption, {
      x: tokens.slide.margin_in, y: h - barH * 0.4, w: w - 2 * tokens.slide.margin_in, h: barH * 0.35,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.small,
      color: tokens.colors.text_on_primary.replace('#', ''), align: 'left', valign: 'top'
    });
  }
}

module.exports = { render };
