'use strict';
/**
 * PPTX Builder (Section 14/16). Reads slides.yaml + design_system.json (+
 * optional template_analysis.json) for one project and writes a versioned
 * .pptx. Content/design/rendering stay separated: this file never contains
 * deck-specific wording, and layouts/*.js never contain deck-specific colors.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const pptxgen = require('pptxgenjs');
const Ajv = require('ajv');

const { resolveTokens } = require('./lib/tokens');
const { QaCollector } = require('./lib/qaCollector');

const LAYOUTS = {
  cover: require('./layouts/cover'),
  section_divider: require('./layouts/sectionDivider'),
  agenda: require('./layouts/agenda'),
  two_column: require('./layouts/twoColumn'),
  big_number: require('./layouts/bigNumber'),
  kpi_cards: require('./layouts/kpiCards'),
  comparison: require('./layouts/comparison'),
  chart: require('./layouts/chart'),
  timeline: require('./layouts/timeline'),
  process: require('./layouts/process'),
  matrix: require('./layouts/matrix'),
  full_image: require('./layouts/fullImage'),
  quote: require('./layouts/quote'),
  table: require('./layouts/table'),
  summary: require('./layouts/summary')
};

function loadSchema(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'schemas', name), 'utf8'));
}

function validateSlides(deck) {
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(loadSchema('slides.schema.json'));
  const valid = validate(deck);
  if (!valid) {
    const msg = validate.errors.map((e) => `${e.instancePath || '(root)'} ${e.message}`).join('; ');
    throw new Error(`slides.yaml failed schema validation: ${msg}`);
  }
}

function nextVersion(outputDir) {
  if (!fs.existsSync(outputDir)) return 1;
  const existing = fs.readdirSync(outputDir).filter((f) => /^presentation_v(\d+)\.pptx$/.test(f));
  if (!existing.length) return 1;
  const nums = existing.map((f) => Number(f.match(/^presentation_v(\d+)\.pptx$/)[1]));
  return Math.max(...nums) + 1;
}

function appendChangelog(projectDir, version, deck, changeSummary) {
  const changelogPath = path.join(projectDir, 'CHANGELOG.md');
  const header = fs.existsSync(changelogPath) ? '' : '# Changelog\n\n';
  const entry = `## v${String(version).padStart(2, '0')} — ${new Date().toISOString()}\n- Slides: ${deck.slides.length}\n- ${changeSummary || 'Build'}\n\n`;
  fs.appendFileSync(changelogPath, header + entry);
}

async function build(projectDir, { changeSummary } = {}) {
  const slidesPath = path.join(projectDir, 'slides.yaml');
  if (!fs.existsSync(slidesPath)) {
    throw new Error(`No slides.yaml found in ${projectDir}. Run the Slide Designer step first.`);
  }
  const deck = yaml.load(fs.readFileSync(slidesPath, 'utf8'));
  validateSlides(deck);

  const tokens = resolveTokens(projectDir);
  const qa = new QaCollector();

  const pptx = new pptxgen();
  pptx.defineLayout({ name: 'CUSTOM', width: tokens.slide.width_in, height: tokens.slide.height_in });
  pptx.layout = 'CUSTOM';
  pptx.title = deck.deck_title;
  pptx.author = deck.author || undefined;

  const total = deck.slides.length;
  const seenIds = new Set();

  deck.slides.forEach((spec, i) => {
    if (seenIds.has(spec.id)) {
      qa.addStructuralIssue(spec.id, `duplicate slide id: ${spec.id}`);
    }
    seenIds.add(spec.id);

    const layout = LAYOUTS[spec.visual_type];
    if (!layout) {
      throw new Error(`Slide ${spec.id} uses unknown visual_type "${spec.visual_type}". Add engine/layouts/${spec.visual_type}.js and register it in build.js.`);
    }

    const slide = pptx.addSlide();
    const isCoverLike = spec.visual_type === 'cover' || spec.visual_type === 'section_divider' || spec.visual_type === 'full_image' || spec.visual_type === 'quote';

    layout.render({
      pptx,
      slide,
      spec,
      tokens,
      qa,
      pageNumber: i + 1,
      totalPages: total
    });

    if (spec.speaker_notes) {
      const notes = spec.speaker_notes;
      const parts = [];
      if (notes.purpose) parts.push(`【目的】${notes.purpose}`);
      if (notes.talking_points && notes.talking_points.length) parts.push(`【トーク】\n- ${notes.talking_points.join('\n- ')}`);
      if (notes.emphasis) parts.push(`【強調】${notes.emphasis}`);
      if (notes.anticipated_questions && notes.anticipated_questions.length) parts.push(`【想定質問】\n- ${notes.anticipated_questions.join('\n- ')}`);
      if (notes.transition) parts.push(`【次ページへ】${notes.transition}`);
      if (notes.sources && notes.sources.length) parts.push(`【出典】${notes.sources.join(', ')}`);
      if (parts.length) slide.addNotes(parts.join('\n\n'));
    } else if (!isCoverLike) {
      qa.addStructuralIssue(spec.id, 'no speaker_notes provided (Section 24)');
    }
  });

  const outputDir = path.join(projectDir, 'output');
  fs.mkdirSync(outputDir, { recursive: true });
  const version = nextVersion(outputDir);
  const versionedName = `presentation_v${String(version).padStart(2, '0')}.pptx`;
  const versionedPath = path.join(outputDir, versionedName);

  await pptx.writeFile({ fileName: versionedPath });
  fs.copyFileSync(versionedPath, path.join(outputDir, 'presentation_latest.pptx'));

  appendChangelog(projectDir, version, deck, changeSummary);

  const qaDataPath = path.join(projectDir, '.qa_boxes.json');
  fs.writeFileSync(qaDataPath, JSON.stringify({ version, boxes: qa.boxes, structural: qa.structural }, null, 2));

  return { version, versionedPath, slideCount: deck.slides.length, qa };
}

module.exports = { build };
