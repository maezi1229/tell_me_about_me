'use strict';
const { applyBackground, addTitle, addFooter, contentArea } = require('../lib/chrome');

/** content: { steps: [{ label: string, description?: string }] } */
function render({ slide, spec, tokens, qa, pageNumber, totalPages }) {
  applyBackground(slide, tokens);
  const topY = addTitle(slide, tokens, spec.title, qa, spec.id);
  const area = contentArea(tokens, topY);
  const c = spec.content || {};
  const steps = c.steps || [];
  const gap = 0.35;
  const boxW = (area.w - gap * (steps.length - 1)) / steps.length;
  const boxH = Math.min(area.h, 2.2);
  const y = area.y + (area.h - boxH) / 2;

  steps.forEach((step, i) => {
    const x = area.x + i * (boxW + gap);
    slide.addShape('roundRect', {
      x, y, w: boxW, h: boxH,
      fill: { color: i === steps.length - 1 ? tokens.colors.primary.replace('#', '') : tokens.colors.surface.replace('#', '') },
      line: { color: tokens.colors.border.replace('#', ''), width: 1 },
      rectRadius: 0.08
    });
    const textColor = i === steps.length - 1 ? tokens.colors.text_on_primary : tokens.colors.text_primary;
    slide.addText(String(i + 1), {
      x: x + 0.1, y: y + 0.08, w: 0.5, h: 0.4,
      fontFace: tokens.fonts.heading, fontSize: tokens.type_scale.h2, bold: true,
      color: tokens.colors.accent.replace('#', ''), align: 'left'
    });
    slide.addText(step.label, {
      x: x + 0.12, y: y + 0.5, w: boxW - 0.24, h: 0.6,
      fontFace: tokens.fonts.heading, fontSize: tokens.type_scale.body, bold: true,
      color: textColor.replace('#', ''), align: 'left', valign: 'top'
    });
    if (step.description) {
      slide.addText(step.description, {
        x: x + 0.12, y: y + 1.1, w: boxW - 0.24, h: boxH - 1.2,
        fontFace: tokens.fonts.body, fontSize: tokens.type_scale.small,
        color: textColor.replace('#', ''), align: 'left', valign: 'top'
      });
    }
    qa.addBox(spec.id, { label: `step_${i}`, role: 'body', x: x + 0.12, y: y + 0.5, w: boxW - 0.24, h: boxH - 0.6, text: `${step.label} ${step.description || ''}`, fontSize: tokens.type_scale.body, fontFace: tokens.fonts.body });

    if (i < steps.length - 1) {
      slide.addText('▶', {
        x: x + boxW, y: y + boxH / 2 - 0.2, w: gap, h: 0.4,
        fontFace: tokens.fonts.body, fontSize: 16,
        color: tokens.colors.text_secondary.replace('#', ''), align: 'center', valign: 'middle'
      });
    }
  });

  addFooter(slide, tokens, { pageNumber, totalPages });
}

module.exports = { render };
