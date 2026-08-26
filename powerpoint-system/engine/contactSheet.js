'use strict';
/**
 * Section 50: a single-page overview of every slide, so the QA Reviewer (and
 * the user) can judge cross-slide rhythm, palette consistency, and repeated
 * layouts at a glance — not just each slide in isolation.
 *
 * Implemented as a self-contained HTML file (no ImageMagick/Cairo dependency
 * required) that embeds every rendered PNG as base64.
 */
const fs = require('fs');
const path = require('path');

function buildContactSheet(projectDir, version, deckTitle) {
  const versionTag = `v${String(version).padStart(2, '0')}`;
  const renderDir = path.join(projectDir, 'render', versionTag);
  const pngFiles = fs.readdirSync(renderDir)
    .filter((f) => /^slide_\d+\.png$/.test(f))
    .sort();

  if (!pngFiles.length) throw new Error(`No rendered PNGs found in ${renderDir}. Run render first.`);

  const cards = pngFiles.map((f, i) => {
    const b64 = fs.readFileSync(path.join(renderDir, f)).toString('base64');
    return `<figure>
      <img src="data:image/png;base64,${b64}" alt="slide ${i + 1}" />
      <figcaption>${String(i + 1).padStart(2, '0')}</figcaption>
    </figure>`;
  }).join('\n');

  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<title>Contact Sheet — ${escapeHtml(deckTitle || '')} (${versionTag})</title>
<style>
  body { font-family: -apple-system, "Yu Gothic", "Meiryo", sans-serif; background: #1c1f24; color: #eee; margin: 0; padding: 24px; }
  h1 { font-size: 18px; font-weight: 600; margin: 0 0 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
  figure { margin: 0; background: #2a2e35; border-radius: 8px; overflow: hidden; }
  figure img { width: 100%; display: block; border-bottom: 1px solid #3a3f47; }
  figcaption { padding: 6px 10px; font-size: 12px; color: #aaa; }
</style>
</head>
<body>
  <h1>${escapeHtml(deckTitle || '')} — Contact Sheet (${versionTag}, ${pngFiles.length} slides)</h1>
  <div class="grid">
    ${cards}
  </div>
</body>
</html>`;

  const outPath = path.join(renderDir, 'contact_sheet.html');
  fs.writeFileSync(outPath, html);
  return outPath;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

module.exports = { buildContactSheet };
