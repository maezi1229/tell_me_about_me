'use strict';
/**
 * Layout components report every box they place here during build().
 * qaMechanical.js then evaluates the collected boxes for overflow/overlap
 * without needing to parse the compiled .pptx XML back out.
 */

class QaCollector {
  constructor() {
    /** @type {Array<object>} */
    this.boxes = [];
    /** @type {Array<{slideId:string, message:string}>} */
    this.structural = [];
  }

  /**
   * @param {string} slideId
   * @param {object} box {label, x,y,w,h (inches), text, fontSize, fontFace, role, allowOverlapWith?: string[]}
   */
  addBox(slideId, box) {
    this.boxes.push({ slideId, ...box });
  }

  addStructuralIssue(slideId, message) {
    this.structural.push({ slideId, message });
  }

  addMissingAsset(slideId, assetPath) {
    this.structural.push({ slideId, message: `missing_asset:${assetPath}` });
  }
}

module.exports = { QaCollector };
