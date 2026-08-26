# QA Report — ccus-hanwa (v05)

Generated: 2026-08-26T09:19:20.772Z
Slides: 15
Verdict: **pass**

## Mechanical QA

No mechanical issues found.

## Visual / Editorial QA

Reviewed all 15 rendered slides individually plus `render/v05/contact_sheet.html`.
Two real defects were found and fixed during this review (not caught by the
mechanical pass, which is why the visual pass exists):

1. **Title overflow / overlap (S06)**: the title's line-wrap estimate
   under-counted for a long, bold, mixed CJK+ASCII title, so the accent rule
   and KPI cards started one line too high and visually collided with the
   wrapped second line of the title. Root cause: the overflow estimator
   didn't account for bold text rendering wider than regular weight. Fixed in
   `engine/lib/textMetrics.js` (bold width factor) and `engine/lib/chrome.js`
   (larger safety margin); verified visually resolved after rebuild.
2. **Ambiguous glyph in bold reversed-color text (S04)**: "JOGMEC" in a bold
   white-on-navy comparison column header rendered as "IOGMEC" in this
   LibreOffice + fallback-Japanese-font pipeline — the capital "J" lost its
   hook when the header text was squeezed into a fixed-height band. Root
   cause: `comparison.js` used a fixed 0.55in header band regardless of
   wrapped line count. Fixed by making the header band size itself to its
   text (`engine/layouts/comparison.js`), and additionally moved "JOGMEC"
   out of the bold header into regular-weight body text as a content-level
   safeguard for this specific proper noun. See `README.md`'s "Known
   rendering-fidelity caveat" for the general pattern — **recommend a final
   visual proof of the actual .pptx in real PowerPoint (with real Yu Gothic)
   before distributing**, since this render pipeline substitutes fonts.

Beyond those two (now fixed) issues:

- **Layout**: no remaining overlap, bleed, or misalignment across all 15 slides.
- **Typography**: consistent heading/body font; Japanese renders correctly
  elsewhere; no other awkward line breaks found after the KPI-card value
  wording was tightened (S06, S14) to avoid mid-word wraps.
- **Design**: palette and title treatment consistent slide-to-slide; visual
  types vary appropriately (cover, agenda, process, comparison×2, big_number,
  kpi_cards×2, table, two_column×2, chart, matrix, timeline, summary) with no
  awkward back-to-back repeats.
- **Content / integrity (the main point of this deck)**: Fact vs. Inference
  vs. "要確認" placeholder is visibly distinguished everywhere it matters
  (S07's re-verification note, S12's Fact/Inference/要確認 bullets, S13's
  timeline note, S14's intentionally-empty third KPI card). No fabricated
  Hanwa-specific numbers appear anywhere in the deck. No numeric
  contradictions found between slides (2,000万トン appears consistently in
  S06/S10/S14; the 129〜178億ドル range is presented consistently in S09).
- **Presentation**: each title states a conclusion; reading S01→S15 titles in
  sequence reproduces the user's original 6-point structure and ends on a
  concrete 3-item request. One message per slide throughout.

Verdict: **pass**. This is a research-and-outline-approved *draft* per
`brief.md`'s own framing (not a finished client deck) — its remaining open
items are the ones already surfaced to the user in `outline.md` and on-slide
(S15), not rendering defects.
