'use strict';
/**
 * Section 5: parse a user-supplied .pptx template into template_analysis.json.
 * A .pptx is a zip of OOXML parts; we read the parts we need directly instead
 * of depending on PowerPoint itself.
 */
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const { XMLParser } = require('fast-xml-parser');

const EMU_PER_INCH = 914400;

async function analyzeTemplate(pptxPath) {
  const buf = fs.readFileSync(pptxPath);
  const zip = await JSZip.loadAsync(buf);
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const notes = [];

  const result = {
    source_file: path.basename(pptxPath),
    analyzed_at: new Date().toISOString(),
    slide_size: null,
    theme: { name: null, colors: {}, fonts: {} },
    layouts: [],
    masters: [],
    notes
  };

  // --- presentation.xml: slide size ---
  const presFile = zip.file('ppt/presentation.xml');
  if (presFile) {
    const xml = parser.parse(await presFile.async('string'));
    const sldSz = xml?.['p:presentation']?.['p:sldSz'];
    if (sldSz) {
      result.slide_size = {
        width_in: Number(sldSz['@_cx']) / EMU_PER_INCH,
        height_in: Number(sldSz['@_cy']) / EMU_PER_INCH
      };
    } else {
      notes.push('Could not find p:sldSz in presentation.xml; using default slide size.');
    }
  } else {
    notes.push('presentation.xml not found in archive — is this a valid .pptx?');
  }

  // --- theme (first one found under ppt/theme/) ---
  const themeFiles = Object.keys(zip.files).filter((f) => /^ppt\/theme\/theme\d+\.xml$/.test(f));
  if (themeFiles.length) {
    const xml = parser.parse(await zip.file(themeFiles[0]).async('string'));
    const themeElements = xml?.['a:theme']?.['a:themeElements'];
    result.theme.name = xml?.['a:theme']?.['@_name'] || null;

    const clrScheme = themeElements?.['a:clrScheme'];
    if (clrScheme) {
      const colorKeys = ['a:dk1', 'a:lt1', 'a:dk2', 'a:lt2', 'a:accent1', 'a:accent2', 'a:accent3', 'a:accent4', 'a:accent5', 'a:accent6', 'a:hlink', 'a:folHlink'];
      for (const key of colorKeys) {
        const node = clrScheme[key];
        if (!node) continue;
        const shortKey = key.replace('a:', '');
        const srgb = node['a:srgbClr'];
        const sys = node['a:sysClr'];
        if (srgb) result.theme.colors[shortKey] = srgb['@_val'];
        else if (sys) result.theme.colors[shortKey] = sys['@_lastClr'] || sys['@_val'];
      }
    } else {
      notes.push('No a:clrScheme found in theme XML.');
    }

    const fontScheme = themeElements?.['a:fontScheme'];
    if (fontScheme) {
      const majorFont = fontScheme['a:majorFont']?.['a:latin']?.['@_typeface'];
      const minorFont = fontScheme['a:minorFont']?.['a:latin']?.['@_typeface'];
      if (majorFont && majorFont !== '+mn-lt') result.theme.fonts.heading = majorFont;
      if (minorFont && minorFont !== '+mj-lt') result.theme.fonts.body = minorFont;
    }
  } else {
    notes.push('No theme XML found under ppt/theme/ — falling back to engine defaults for colors/fonts.');
  }

  // --- slide masters ---
  const masterFiles = Object.keys(zip.files).filter((f) => /^ppt\/slideMasters\/slideMaster\d+\.xml$/.test(f));
  for (const f of masterFiles) {
    result.masters.push({ file: f });
  }

  // --- slide layouts (name + placeholder types, so Slide Designer knows what's available) ---
  const layoutFiles = Object.keys(zip.files).filter((f) => /^ppt\/slideLayouts\/slideLayout\d+\.xml$/.test(f));
  for (const f of layoutFiles) {
    const xml = parser.parse(await zip.file(f).async('string'));
    const cSld = xml?.['p:sldLayout']?.['p:cSld'];
    const name = cSld?.['@_name'] || null;
    const shapes = cSld?.['p:spTree']?.['p:sp'];
    const shapeList = Array.isArray(shapes) ? shapes : shapes ? [shapes] : [];
    const placeholders = shapeList
      .map((sp) => sp?.['p:nvSpPr']?.['p:nvPr']?.['p:ph'])
      .filter(Boolean)
      .map((ph) => ({ type: ph['@_type'] || 'body', idx: ph['@_idx'] || null }));
    result.layouts.push({ name, file: f, placeholders });
  }

  if (!layoutFiles.length) notes.push('No slide layouts found; PPTX Builder will use engine default layout components only.');

  return result;
}

module.exports = { analyzeTemplate };
