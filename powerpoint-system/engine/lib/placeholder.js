'use strict';
const fs = require('fs');

/**
 * Places an image if the given path exists, otherwise a neutral placeholder
 * box (never a broken/blank slide, never a silent failure — a specified but
 * missing path is reported to QA as a missing_asset finding).
 */
function addImageOrPlaceholder(slide, { path: imgPath, x, y, w, h, altText }, tokens, qa, slideId) {
  if (imgPath) {
    if (fs.existsSync(imgPath)) {
      slide.addImage({ path: imgPath, x, y, w, h, sizing: { type: 'cover', w, h } });
      return;
    }
    qa.addMissingAsset(slideId, imgPath);
  }
  slide.addShape('rect', {
    x, y, w, h,
    fill: { color: tokens.colors.surface.replace('#', '') },
    line: { color: tokens.colors.border.replace('#', ''), width: 1 }
  });
  if (altText) {
    slide.addText(altText, {
      x, y, w, h,
      align: 'center', valign: 'middle',
      fontFace: tokens.fonts.body, fontSize: tokens.type_scale.small,
      color: tokens.colors.text_secondary.replace('#', ''), italic: true
    });
  }
}

module.exports = { addImageOrPlaceholder };
