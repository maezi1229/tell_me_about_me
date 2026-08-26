'use strict';
/**
 * Mechanical QA half of Section 49: objective, scriptable checks over the
 * boxes each layout reported during build() (engine/lib/qaCollector.js).
 * The Visual/Editorial half is a human/AI judgment call over the rendered
 * PNGs and is deliberately NOT attempted here.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { estimateTextHeightIn } = require('./lib/textMetrics');
const { resolveTokens } = require('./lib/tokens');

const OVERLAP_EPSILON_IN = 0.01; // ignore floating-point-adjacent boxes (e.g. i*rowH rounding); not a real visual overlap

function boxesOverlap(a, b) {
  const xOverlap = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const yOverlap = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return xOverlap > OVERLAP_EPSILON_IN && yOverlap > OVERLAP_EPSILON_IN;
}

function runMechanicalQa(projectDir) {
  const slidesPath = path.join(projectDir, 'slides.yaml');
  const qaDataPath = path.join(projectDir, '.qa_boxes.json');
  if (!fs.existsSync(qaDataPath)) {
    throw new Error('No .qa_boxes.json found — run `node cli.js build <project>` before `qa`.');
  }
  const deck = yaml.load(fs.readFileSync(slidesPath, 'utf8'));
  const { version, boxes, structural } = JSON.parse(fs.readFileSync(qaDataPath, 'utf8'));
  const tokens = resolveTokens(projectDir);

  const findings = [];

  // --- overflow: does the estimated text block exceed its own box? ---
  // Width is shrunk 5% to approximate PptxGenJS/PowerPoint's internal text
  // insets, which the box's own recorded w/h don't account for.
  for (const box of boxes) {
    if (!box.text) continue;
    const estimatedH = estimateTextHeightIn(box.text, box.fontSize, box.w * 0.95, 1.25, !!box.bold);
    if (estimatedH > box.h * 1.08) {
      findings.push({
        slide_id: box.slideId,
        type: 'overflow',
        severity: estimatedH > box.h * 1.4 ? 'major' : 'minor',
        message: `"${box.label}" text likely overflows its box (est. ${estimatedH.toFixed(2)}in needed vs ${box.h.toFixed(2)}in available).`,
        detail: { label: box.label, estimatedHeightIn: Number(estimatedH.toFixed(2)), boxHeightIn: Number(box.h.toFixed(2)) }
      });
    }
  }

  // --- overlap: any two boxes on the same slide (excluding same label family) that intersect ---
  const bySlide = {};
  for (const box of boxes) {
    (bySlide[box.slideId] = bySlide[box.slideId] || []).push(box);
  }
  for (const [slideId, slideBoxes] of Object.entries(bySlide)) {
    for (let i = 0; i < slideBoxes.length; i++) {
      for (let j = i + 1; j < slideBoxes.length; j++) {
        const a = slideBoxes[i];
        const b = slideBoxes[j];
        if (boxesOverlap(a, b)) {
          findings.push({
            slide_id: slideId,
            type: 'overlap',
            severity: 'major',
            message: `"${a.label}" overlaps "${b.label}".`,
            detail: { a: a.label, b: b.label }
          });
        }
      }
    }
  }

  // --- structural issues collected during build (missing assets, no insight, no speaker notes, dup ids) ---
  for (const s of structural) {
    if (s.message.startsWith('missing_asset:')) {
      findings.push({ slide_id: s.slideId, type: 'missing_asset', severity: 'major', message: `Referenced image not found: ${s.message.replace('missing_asset:', '')}` });
    } else if (s.message.startsWith('duplicate slide id')) {
      findings.push({ slide_id: s.slideId, type: 'structural', severity: 'critical', message: s.message });
    } else if (s.message.includes('no content.insight')) {
      findings.push({ slide_id: s.slideId, type: 'empty_content', severity: 'minor', message: s.message });
    } else if (s.message.includes('no speaker_notes')) {
      findings.push({ slide_id: s.slideId, type: 'empty_content', severity: 'minor', message: s.message });
    } else {
      findings.push({ slide_id: s.slideId, type: 'structural', severity: 'minor', message: s.message });
    }
  }

  // --- font violation: any box using a font not in the design system ---
  const allowedFonts = new Set([tokens.fonts.heading, tokens.fonts.body, tokens.fonts.mono].filter(Boolean));
  for (const box of boxes) {
    if (box.fontFace && !allowedFonts.has(box.fontFace)) {
      findings.push({
        slide_id: box.slideId,
        type: 'font_violation',
        severity: 'minor',
        message: `"${box.label}" uses font "${box.fontFace}" outside the design system (${[...allowedFonts].join(', ')}).`
      });
    }
  }

  const hasCritical = findings.some((f) => f.severity === 'critical');
  const hasMajor = findings.some((f) => f.severity === 'major');
  const verdict = hasCritical || hasMajor ? 'not_ready' : findings.length ? 'pass_with_minor_issues' : 'pass';

  const report = {
    project: path.basename(projectDir),
    version: `v${String(version).padStart(2, '0')}`,
    generated_at: new Date().toISOString(),
    slide_count: deck.slides.length,
    findings,
    verdict
  };

  return report;
}

function renderReportMarkdown(report) {
  const severityOrder = { critical: 0, major: 1, minor: 2 };
  const sorted = [...report.findings].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  const lines = [];
  lines.push(`# QA Report — ${report.project} (${report.version})`);
  lines.push('');
  lines.push(`Generated: ${report.generated_at}`);
  lines.push(`Slides: ${report.slide_count}`);
  lines.push(`Verdict: **${report.verdict}**`);
  lines.push('');
  lines.push('## Mechanical QA');
  lines.push('');
  if (!sorted.length) {
    lines.push('No mechanical issues found.');
  } else {
    lines.push('| Severity | Slide | Type | Message |');
    lines.push('|---|---|---|---|');
    for (const f of sorted) {
      lines.push(`| ${f.severity} | ${f.slide_id} | ${f.type} | ${f.message.replace(/\|/g, '\\|')} |`);
    }
  }
  lines.push('');
  lines.push('## Visual / Editorial QA');
  lines.push('');
  lines.push('_Not scripted — the qa-reviewer agent must review render/<version>/contact_sheet.html');
  lines.push('and individual slide PNGs, then append findings here per powerpoint-system/CLAUDE.md Section 7._');
  lines.push('');
  return lines.join('\n');
}

function writeQaReport(projectDir) {
  const report = runMechanicalQa(projectDir);
  const md = renderReportMarkdown(report);
  fs.writeFileSync(path.join(projectDir, 'qa_report.md'), md);
  fs.writeFileSync(path.join(projectDir, '.qa_report.json'), JSON.stringify(report, null, 2));
  return report;
}

module.exports = { runMechanicalQa, renderReportMarkdown, writeQaReport };
