'use strict';
/**
 * Section 11/20: render every slide to PNG so QA can actually look at the
 * deck instead of trusting the generation code. LibreOffice does pptx->pdf
 * headlessly; poppler's pdftoppm rasterizes each page to PNG.
 */
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

function which(bin) {
  try {
    require('child_process').execSync(`command -v ${bin}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function checkRenderEnv() {
  return {
    soffice: which('soffice') || which('libreoffice'),
    pdftoppm: which('pdftoppm')
  };
}

async function render(projectDir, version) {
  const env = checkRenderEnv();
  if (!env.soffice) throw new Error('LibreOffice (soffice) not found on PATH — cannot render PPTX to PDF. Install LibreOffice or render manually.');
  if (!env.pdftoppm) throw new Error('poppler-utils (pdftoppm) not found on PATH — cannot rasterize PDF to PNG. Install poppler-utils.');

  const outputDir = path.join(projectDir, 'output');
  const versionTag = `v${String(version).padStart(2, '0')}`;
  const pptxPath = path.join(outputDir, `presentation_${versionTag}.pptx`);
  if (!fs.existsSync(pptxPath)) throw new Error(`${pptxPath} does not exist — run build first.`);

  const renderDir = path.join(projectDir, 'render', versionTag);
  fs.mkdirSync(renderDir, { recursive: true });

  const sofficeBin = which('soffice') ? 'soffice' : 'libreoffice';
  await execFileAsync(sofficeBin, [
    '--headless', '--norestore', '--convert-to', 'pdf', '--outdir', renderDir, pptxPath
  ], { timeout: 120000 });

  const pdfPath = path.join(renderDir, 'presentation_' + versionTag + '.pdf');
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`LibreOffice did not produce the expected PDF at ${pdfPath}. Check LibreOffice output for errors.`);
  }

  const pngPrefix = path.join(renderDir, 'slide');
  await execFileAsync('pdftoppm', ['-png', '-r', '110', pdfPath, pngPrefix], { timeout: 120000 });

  const pngFiles = fs.readdirSync(renderDir)
    .filter((f) => /^slide-\d+\.png$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

  // Normalize to zero-padded, predictable names: slide_01.png, slide_02.png, ...
  const normalized = [];
  pngFiles.forEach((f, i) => {
    const newName = `slide_${String(i + 1).padStart(2, '0')}.png`;
    const from = path.join(renderDir, f);
    const to = path.join(renderDir, newName);
    if (from !== to) fs.renameSync(from, to);
    normalized.push(newName);
  });

  return { renderDir, pdfPath, pngFiles: normalized };
}

module.exports = { render, checkRenderEnv };
