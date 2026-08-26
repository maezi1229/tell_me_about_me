'use strict';
/**
 * Design token resolver (Section 13/44).
 * Priority, lowest to highest: hard-coded engine default -> template_analysis.json
 * derived overrides -> project's own design_system.json. The result is what
 * every layout component receives; nothing in engine/layouts/*.js should read
 * a color/font/size from anywhere else.
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_PATH = path.join(__dirname, '..', '..', 'design', 'design_system.default.json');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function deepMerge(base, override) {
  if (override === null || override === undefined) return base;
  if (Array.isArray(base) || Array.isArray(override)) return override;
  if (typeof base === 'object' && typeof override === 'object') {
    const out = { ...base };
    for (const key of Object.keys(override)) {
      out[key] = deepMerge(base[key], override[key]);
    }
    return out;
  }
  return override;
}

/** Turn a raw template_analysis.json into a design_system-shaped partial override. */
function templateToDesignOverrides(templateAnalysis) {
  const overrides = {};
  overrides.source = 'template_derived';
  if (templateAnalysis.slide_size) {
    overrides.slide = {
      width_in: templateAnalysis.slide_size.width_in,
      height_in: templateAnalysis.slide_size.height_in
    };
  }
  const theme = templateAnalysis.theme || {};
  if (theme.colors) {
    const c = theme.colors;
    const colors = {};
    if (c.dk1) colors.text_primary = normalizeHex(c.dk1);
    if (c.lt1) colors.background = normalizeHex(c.lt1);
    if (c.accent1) colors.primary = normalizeHex(c.accent1);
    if (c.accent2) colors.secondary = normalizeHex(c.accent2);
    if (c.accent3) colors.accent = normalizeHex(c.accent3);
    const series = ['accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6']
      .filter((k) => c[k])
      .map((k) => normalizeHex(c[k]));
    if (series.length) colors.chart_series = series;
    if (Object.keys(colors).length) overrides.colors = colors;
  }
  if (theme.fonts && (theme.fonts.heading || theme.fonts.body)) {
    overrides.fonts = {};
    if (theme.fonts.heading) overrides.fonts.heading = theme.fonts.heading;
    if (theme.fonts.body) overrides.fonts.body = theme.fonts.body;
  }
  return overrides;
}

function normalizeHex(v) {
  if (!v) return v;
  const s = String(v).replace('#', '').toUpperCase();
  return `#${s}`;
}

/**
 * @param {string} projectDir absolute path to projects/<project>
 * @returns {object} resolved design tokens
 */
function resolveTokens(projectDir) {
  let tokens = loadJson(DEFAULT_PATH);

  const templatePath = path.join(projectDir, 'template_analysis.json');
  if (fs.existsSync(templatePath)) {
    const templateAnalysis = loadJson(templatePath);
    tokens = deepMerge(tokens, templateToDesignOverrides(templateAnalysis));
  }

  const designPath = path.join(projectDir, 'design_system.json');
  if (fs.existsSync(designPath)) {
    tokens = deepMerge(tokens, loadJson(designPath));
  } else {
    fs.writeFileSync(designPath, JSON.stringify(tokens, null, 2) + '\n');
  }

  return tokens;
}

module.exports = { resolveTokens, deepMerge, templateToDesignOverrides, normalizeHex };
