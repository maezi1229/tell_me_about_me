'use strict';
const { applyBackground, addTitle, addFooter, contentArea } = require('../lib/chrome');
const { addImageOrPlaceholder } = require('../lib/placeholder');

/** content: { body: string | string[] (bullets), image?: {path, alt}, image_side?: 'left'|'right' } */
function render({ slide, spec, tokens, qa, pageNumber, totalPages }) {
  applyBackground(slide, tokens);
  const topY = addTitle(slide, tokens, spec.title, qa, spec.id);
  const area = contentArea(tokens, topY);
  const c = spec.content || {};
  const gap = tokens.spacing.unit * 2;
  const colW = (area.w - gap) / 2;
  const imageSide = c.image_side === 'left' ? 'left' : 'right';

  const textX = imageSide === 'right' ? area.x : area.x + colW + gap;
  const imgX = imageSide === 'right' ? area.x + colW + gap : area.x;

  const bullets = Array.isArray(c.body) ? c.body : [c.body];
  slide.addText(
    bullets.filter(Boolean).map((t) => ({ text: t, options: { bullet: bullets.length > 1, breakLine: true } })),
    {
      x: textX, y: area.y, w: colW, h: area.h,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.body,
      color: tokens.colors.text_primary.replace('#', ''), valign: 'top', align: 'left',
      paraSpaceAfter: 8, lineSpacingMultiple: 1.25
    }
  );
  qa.addBox(spec.id, { label: 'body_text', role: 'body', x: textX, y: area.y, w: colW, h: area.h, text: bullets.filter(Boolean).join('\n'), fontSize: tokens.type_scale.body, fontFace: tokens.fonts.body });

  addImageOrPlaceholder(slide, { path: c.image && c.image.path, x: imgX, y: area.y, w: colW, h: area.h, altText: c.image && c.image.alt }, tokens, qa, spec.id);

  addFooter(slide, tokens, { pageNumber, totalPages });
}

module.exports = { render };
