#!/usr/bin/env node
'use strict';
/**
 * Orchestrator CLI for the powerpoint-system engine (Section 41).
 * Usage: node cli.js <command> [project] [...args]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECTS_DIR = path.join(__dirname, 'projects');
const TEMPLATE_DIR = path.join(PROJECTS_DIR, '_template');

function which(bin) {
  try {
    execSync(`command -v ${bin}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function projectDir(name) {
  if (!name) throw new Error('Project name required, e.g. `node cli.js build sample-demo`');
  return path.join(PROJECTS_DIR, name);
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirSync(s, d);
    else fs.copyFileSync(s, d);
  }
}

async function cmdCheckEnv() {
  const checks = {
    node: process.version,
    npm_deps_installed: fs.existsSync(path.join(__dirname, 'node_modules', 'pptxgenjs')),
    soffice_or_libreoffice: which('soffice') || which('libreoffice'),
    pdftoppm: which('pdftoppm')
  };
  console.log(JSON.stringify(checks, null, 2));
  if (!checks.npm_deps_installed) console.log('\n-> run `npm install` in powerpoint-system/ first.');
  if (!checks.soffice_or_libreoffice) console.log('\n-> LibreOffice not found: `render`/`contact-sheet` will not work until it is installed.');
  if (!checks.pdftoppm) console.log('-> poppler-utils (pdftoppm) not found: `render` will not work until it is installed.');
}

function cmdNew(name) {
  const dest = projectDir(name);
  if (fs.existsSync(dest)) throw new Error(`projects/${name} already exists.`);
  copyDirSync(TEMPLATE_DIR, dest);
  console.log(`Created ${dest} from _template. Start by filling in brief.md.`);
}

async function cmdAnalyzeTemplate(pptxPath, name) {
  const { analyzeTemplate } = require('./engine/lib/templateAnalyzer');
  const dest = projectDir(name);
  fs.mkdirSync(dest, { recursive: true });
  const analysis = await analyzeTemplate(pptxPath);
  fs.writeFileSync(path.join(dest, 'template_analysis.json'), JSON.stringify(analysis, null, 2));
  console.log(`Wrote ${path.join(dest, 'template_analysis.json')}`);
  if (analysis.notes.length) console.log('Notes:\n- ' + analysis.notes.join('\n- '));
}

async function cmdBuild(name, changeSummary) {
  const { build } = require('./engine/build');
  const result = await build(projectDir(name), { changeSummary });
  console.log(`Built ${result.versionedPath} (${result.slideCount} slides).`);
  if (result.qa.structural.length) {
    console.log(`Build-time notes (${result.qa.structural.length}):`);
    for (const s of result.qa.structural) console.log(`  [${s.slideId}] ${s.message}`);
  }
  return result.version;
}

async function cmdRender(name, version) {
  const { render } = require('./engine/render');
  const v = version || latestVersion(projectDir(name));
  const result = await render(projectDir(name), v);
  console.log(`Rendered ${result.pngFiles.length} slides to ${result.renderDir}`);
}

function cmdContactSheet(name, version) {
  const { buildContactSheet } = require('./engine/contactSheet');
  const yaml = require('js-yaml');
  const v = version || latestVersion(projectDir(name));
  const deck = yaml.load(fs.readFileSync(path.join(projectDir(name), 'slides.yaml'), 'utf8'));
  const out = buildContactSheet(projectDir(name), v, deck.deck_title);
  console.log(`Contact sheet: ${out}`);
}

function cmdQa(name) {
  const { writeQaReport } = require('./engine/qaMechanical');
  const report = writeQaReport(projectDir(name));
  console.log(`qa_report.md written. Verdict: ${report.verdict}. Findings: ${report.findings.length}`);
}

function latestVersion(dir) {
  const outputDir = path.join(dir, 'output');
  const files = fs.existsSync(outputDir) ? fs.readdirSync(outputDir).filter((f) => /^presentation_v(\d+)\.pptx$/.test(f)) : [];
  if (!files.length) throw new Error(`No built version found in ${outputDir} — run build first.`);
  return Math.max(...files.map((f) => Number(f.match(/^presentation_v(\d+)\.pptx$/)[1])));
}

async function cmdAll(name, changeSummary) {
  const version = await cmdBuild(name, changeSummary);
  await cmdRender(name, version);
  cmdContactSheet(name, version);
  cmdQa(name);
}

function cmdResume(name) {
  const dir = projectDir(name);
  if (!fs.existsSync(dir)) {
    console.log(`No project at projects/${name}. Run \`node cli.js new ${name}\` to start.`);
    return;
  }
  const files = ['brief.md', 'template_analysis.json', 'research.md', 'facts.json', 'sources.json', 'outline.md', 'design_system.json', 'slides.yaml', 'CHANGELOG.md', 'qa_report.md'];
  console.log(`Status of projects/${name}:`);
  for (const f of files) {
    const exists = fs.existsSync(path.join(dir, f));
    console.log(`  [${exists ? 'x' : ' '}] ${f}`);
  }
  const outputDir = path.join(dir, 'output');
  const built = fs.existsSync(outputDir) && fs.readdirSync(outputDir).some((f) => /\.pptx$/.test(f));
  console.log(`  [${built ? 'x' : ' '}] output/*.pptx built`);
}

async function main() {
  const [, , command, ...args] = process.argv;
  switch (command) {
    case 'check-env':
      return cmdCheckEnv();
    case 'new':
      return cmdNew(args[0]);
    case 'analyze-template':
      return cmdAnalyzeTemplate(args[0], args[1]);
    case 'build':
      return cmdBuild(args[0], args[1]);
    case 'render':
      return cmdRender(args[0], args[1]);
    case 'contact-sheet':
      return cmdContactSheet(args[0], args[1]);
    case 'qa':
      return cmdQa(args[0]);
    case 'all':
      return cmdAll(args[0], args[1]);
    case 'resume':
      return cmdResume(args[0]);
    default:
      console.log(`Usage: node cli.js <command> [project]
Commands:
  check-env                          verify Node/LibreOffice/poppler availability
  new <project>                      scaffold projects/<project>/ from _template
  analyze-template <pptx> <project>  parse a template .pptx into template_analysis.json
  build <project> ["change note"]    slides.yaml -> output/presentation_vNN.pptx
  render <project> [version]         pptx -> render/vNN/slide_*.png
  contact-sheet <project> [version]  render/vNN/contact_sheet.html
  qa <project>                       mechanical QA -> qa_report.md
  all <project> ["change note"]      build + render + contact-sheet + qa
  resume <project>                   show which files exist / how far along the project is`);
      process.exitCode = command ? 1 : 0;
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exitCode = 1;
});
