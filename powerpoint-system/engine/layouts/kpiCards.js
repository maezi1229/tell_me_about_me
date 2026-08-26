'use strict';
const { applyBackground, addTitle, addFooter, contentArea } = require('../lib/chrome');

/** content: { cards: [{ label, value, delta?, deltaDirection?: 'up'|'down'|'flat' }], insight? } */
function render({ slide, spec, tokens, qa, pageNumber, totalPages }) {
  applyBackground(slide, tokens);
  const topY = addTitle(slide, tokens, spec.title, qa, spec.id);
  const area = contentArea(tokens, topY);
  const c = spec.content || {};
  const cards = c.cards || [];
  const gap = tokens.spacing.unit;
  const cardW = (area.w - gap * (cards.length - 1)) / cards.length;
  const cardH = c.insight ? area.h * 0.72 : area.h;

  cards.forEach((card, i) => {
    const x = area.x + i * (cardW + gap);
    slide.addShape('roundRect', {
      x, y: area.y, w: cardW, h: cardH,
      fill: { color: tokens.colors.surface.replace('#', '') },
      line: { color: tokens.colors.border.replace('#', ''), width: 1 },
      rectRadius: 0.06
    });
    const deltaColor = card.deltaDirection === 'down' ? tokens.colors.danger : card.deltaDirection === 'up' ? tokens.colors.success : tokens.colors.text_secondary;
    slide.addText(String(card.value), {
      x: x + 0.15, y: area.y + cardH * 0.18, w: cardW - 0.3, h: cardH * 0.4,
      fontFace: tokens.fonts.heading, fontSize: tokens.type_scale.h1, bold: true,
      color: tokens.colors.primary.replace('#', ''), align: 'center', valign: 'middle'
    });
    slide.addText(card.label, {
      x: x + 0.1, y: area.y + cardH * 0.58, w: cardW - 0.2, h: cardH * 0.25,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.small,
      color: tokens.colors.text_secondary.replace('#', ''), align: 'center', valign: 'top'
    });
    qa.addBox(spec.id, { label: `kpi_${i}_label`, role: 'body', x: x + 0.1, y: area.y + cardH * 0.58, w: cardW - 0.2, h: cardH * 0.25, text: card.label, fontSize: tokens.type_scale.small, fontFace: tokens.fonts.body });
    if (card.delta) {
      slide.addText(card.delta, {
        x: x + 0.1, y: area.y + cardH * 0.82, w: cardW - 0.2, h: cardH * 0.15,
        fontFace: tokens.fonts.body, fontSize: tokens.type_scale.small, bold: true,
        color: deltaColor.replace('#', ''), align: 'center', valign: 'top'
      });
    }
  });

  if (c.insight) {
    slide.addText(c.insight, {
      x: area.x, y: area.y + cardH + gap, w: area.w, h: area.h - cardH - gap,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.body, italic: true,
      color: tokens.colors.text_primary.replace('#', ''), align: 'left', valign: 'top'
    });
  }

  addFooter(slide, tokens, { pageNumber, totalPages });
}

module.exports = { render };
