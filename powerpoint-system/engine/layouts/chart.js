'use strict';
const { applyBackground, addTitle, addFooter, contentArea } = require('../lib/chrome');

/**
 * content: {
 *   chart_type: 'bar'|'bar3d'|'line'|'pie'|'doughnut'|'area'|'scatter'|'radar',
 *   categories: string[],
 *   series: [{ name: string, values: number[] }],
 *   insight: string   // REQUIRED (Section 33): what this chart means, not just what it shows
 * }
 */
function render({ pptx, slide, spec, tokens, qa, pageNumber, totalPages }) {
  applyBackground(slide, tokens);
  const topY = addTitle(slide, tokens, spec.title, qa, spec.id);
  const area = contentArea(tokens, topY);
  const c = spec.content || {};

  if (!c.insight) {
    qa.addStructuralIssue(spec.id, 'chart slide has no content.insight — a chart with no stated takeaway is incomplete (Section 33)');
  }

  const insightH = c.insight ? 0.6 : 0;
  const chartType = pptx.ChartType[c.chart_type] || pptx.ChartType.bar;
  const dataSeries = (c.series || []).map((s) => ({ name: s.name, labels: c.categories || [], values: s.values }));

  slide.addChart(chartType, dataSeries, {
    x: area.x, y: area.y, w: area.w, h: area.h - insightH,
    chartColors: tokens.colors.chart_series.map((h) => h.replace('#', '')),
    showLegend: (c.series || []).length > 1,
    legendPos: 'b',
    showTitle: false,
    catAxisLabelColor: tokens.colors.text_secondary.replace('#', ''),
    valAxisLabelColor: tokens.colors.text_secondary.replace('#', ''),
    dataLabelColor: tokens.colors.text_secondary.replace('#', ''),
    catAxisLabelFontFace: tokens.fonts.body,
    valAxisLabelFontFace: tokens.fonts.body,
    dataLabelFontFace: tokens.fonts.body
  });

  if (c.insight) {
    slide.addShape('rect', {
      x: area.x, y: area.y + area.h - insightH, w: area.w, h: insightH,
      fill: { color: tokens.colors.surface.replace('#', '') }
    });
    slide.addText(`💡 ${c.insight}`, {
      x: area.x + 0.15, y: area.y + area.h - insightH, w: area.w - 0.3, h: insightH,
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.body, bold: true,
      color: tokens.colors.text_primary.replace('#', ''), align: 'left', valign: 'middle'
    });
    qa.addBox(spec.id, { label: 'insight', role: 'body', x: area.x + 0.15, y: area.y + area.h - insightH, w: area.w - 0.3, h: insightH, text: c.insight, fontSize: tokens.type_scale.body, fontFace: tokens.fonts.body });
  }

  addFooter(slide, tokens, { pageNumber, totalPages });
}

module.exports = { render };
