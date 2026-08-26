'use strict';
const { applyBackground, addTitle, addFooter, contentArea } = require('../lib/chrome');

/** content: { milestones: [{ date: string, label: string, done?: boolean }] } */
function render({ slide, spec, tokens, qa, pageNumber, totalPages }) {
  applyBackground(slide, tokens);
  const topY = addTitle(slide, tokens, spec.title, qa, spec.id);
  const area = contentArea(tokens, topY);
  const c = spec.content || {};
  const milestones = c.milestones || [];
  const lineY = area.y + area.h * 0.45;
  const stepW = area.w / milestones.length;

  slide.addShape('line', {
    x: area.x, y: lineY, w: area.w, h: 0,
    line: { color: tokens.colors.border.replace('#', ''), width: 2 }
  });

  milestones.forEach((ms, i) => {
    const cx = area.x + stepW * (i + 0.5);
    const dotColor = ms.done ? tokens.colors.primary : tokens.colors.accent;
    slide.addShape('ellipse', {
      x: cx - 0.09, y: lineY - 0.09, w: 0.18, h: 0.18,
      fill: { color: dotColor.replace('#', '') }, line: { color: dotColor.replace('#', ''), width: 0 }
    });
    slide.addText(ms.date || '', {
      x: cx - stepW / 2 + 0.05, y: lineY - 0.55, w: stepW - 0.1, h: 0.4,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.small, bold: true,
      color: tokens.colors.text_secondary.replace('#', ''), align: 'center', valign: 'bottom'
    });
    slide.addText(ms.label || '', {
      x: cx - stepW / 2 + 0.05, y: lineY + 0.2, w: stepW - 0.1, h: area.h * 0.45,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.body,
      color: tokens.colors.text_primary.replace('#', ''), align: 'center', valign: 'top'
    });
    qa.addBox(spec.id, { label: `milestone_${i}`, role: 'body', x: cx - stepW / 2 + 0.05, y: lineY + 0.2, w: stepW - 0.1, h: area.h * 0.45, text: ms.label || '', fontSize: tokens.type_scale.body, fontFace: tokens.fonts.body });
  });

  addFooter(slide, tokens, { pageNumber, totalPages });
}

module.exports = { render };
