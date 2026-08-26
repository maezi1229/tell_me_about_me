'use strict';
const { applyBackground, addTitle, addFooter, contentArea } = require('../lib/chrome');

/** content: { recap: string[], action: string } — closing recap + the one thing the audience should do next. */
function render({ slide, spec, tokens, qa, pageNumber, totalPages }) {
  applyBackground(slide, tokens);
  const topY = addTitle(slide, tokens, spec.title, qa, spec.id);
  const area = contentArea(tokens, topY);
  const c = spec.content || {};
  const actionH = c.action ? 1.3 : 0;
  const recapH = area.h - actionH - (c.action ? tokens.spacing.unit : 0);

  const recap = c.recap || [];
  slide.addText(recap.map((t) => ({ text: t, options: { bullet: true, breakLine: true } })), {
    x: area.x, y: area.y, w: area.w, h: recapH,
    fontFace: tokens.fonts.body, fontSize: tokens.type_scale.body,
    color: tokens.colors.text_primary.replace('#', ''), valign: 'top', align: 'left',
    paraSpaceAfter: 10, lineSpacingMultiple: 1.3
  });
  qa.addBox(spec.id, { label: 'recap', role: 'body', x: area.x, y: area.y, w: area.w, h: recapH, text: recap.join('\n'), fontSize: tokens.type_scale.body, fontFace: tokens.fonts.body });

  if (c.action) {
    const y = area.y + recapH + tokens.spacing.unit;
    slide.addShape('roundRect', {
      x: area.x, y, w: area.w, h: actionH,
      fill: { color: tokens.colors.primary.replace('#', '') },
      rectRadius: 0.06
    });
    slide.addText(c.action, {
      x: area.x + 0.3, y, w: area.w - 0.6, h: actionH,
      fontFace: tokens.fonts.heading, fontSize: tokens.type_scale.h2, bold: true,
      color: tokens.colors.text_on_primary.replace('#', ''), align: 'left', valign: 'middle'
    });
    qa.addBox(spec.id, { label: 'action', role: 'body', x: area.x + 0.3, y, w: area.w - 0.6, h: actionH, text: c.action, fontSize: tokens.type_scale.h2, fontFace: tokens.fonts.heading });
  }

  addFooter(slide, tokens, { pageNumber, totalPages });
}

module.exports = { render };
