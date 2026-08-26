# powerpoint-system

A universal PowerPoint-creation system for Claude Code: hearing → research →
story → design → PPTX → render → QA → revision, reproducing a five-person
production team (Researcher, Story Architect, Slide Designer, PPTX Builder,
QA Reviewer) instead of just pasting text into slides.

See **`CLAUDE.md`** for the full system spec (this is the file Claude Code
reads to drive the workflow). The five agent definitions live at the repo
root under `.claude/agents/`. This README is the human/developer-facing quick
reference for the engine itself.

## Requirements

- Node.js 18+ (tested on Node 22)
- LibreOffice **with the Impress component** — `soffice` alone (the
  `libreoffice-core` package) is not enough; you specifically need
  `libreoffice-impress` installed, or rendering will fail with a generic
  "source file could not be loaded" error that has nothing to do with your
  deck's content.
- `poppler-utils` (for `pdftoppm`)

```
node cli.js check-env
```

verifies all of the above and tells you what's missing.

## Quick start

```
cd powerpoint-system
npm install
node cli.js check-env
node cli.js all sample-demo        # build + render + contact-sheet + qa on the bundled demo deck
open projects/sample-demo/output/presentation_latest.pptx
open projects/sample-demo/render/v01/contact_sheet.html
```

## Starting a new deck

```
node cli.js new my-deck                                  # scaffold projects/my-deck/ from _template
node cli.js analyze-template client_template.pptx my-deck  # optional, only if a template was supplied
# ... fill in brief.md, research.md/facts.json/sources.json, outline.md, slides.yaml ...
node cli.js all my-deck "initial draft"
```

Resuming later: `node cli.js resume my-deck` shows which files already exist
so you know how far the project got.

## How a deck is generated

```
slides.yaml  +  design_system.json  (+ template_analysis.json)
        │
        ▼
   engine/build.js  --dispatches each slide's visual_type to--> engine/layouts/*.js
        │
        ▼
projects/<name>/output/presentation_vNN.pptx  (+ presentation_latest.pptx, CHANGELOG.md entry)
        │
        ▼ engine/render.js (LibreOffice -> PDF -> poppler -> PNG)
projects/<name>/render/vNN/slide_*.png
        │
        ▼ engine/contactSheet.js
projects/<name>/render/vNN/contact_sheet.html
        │
        ▼ engine/qaMechanical.js  (reads projects/<name>/.qa_boxes.json written during build)
projects/<name>/qa_report.md
```

`slides.yaml` never contains a color or a coordinate; `design_system.json`
never contains wording; `engine/layouts/*.js` never contains deck-specific
text or colors. See `CLAUDE.md` Section 4 for why that separation is load-bearing.

## Adding a new Visual Type / layout component

1. Add the type to the enum in `schemas/slides.schema.json`.
2. Create `engine/layouts/<name>.js` exporting `render({ pptx, slide, spec, tokens, qa, pageNumber, totalPages })`.
   Use `engine/lib/chrome.js` for the title/footer treatment so it matches
   every other slide, and register every text box you place with
   `qa.addBox(...)` so mechanical QA can check it for overflow/overlap.
3. Register it in the `LAYOUTS` map in `engine/build.js`.
4. Document its `content` shape in the layout file's header comment and in
   `.claude/agents/slide-designer.md`'s selection table.

## Mechanical QA notes

`engine/qaMechanical.js` estimates text overflow from character counts (CJK
glyphs treated as full-width, Latin as ~0.52em) — it is a heuristic safety
net, not a pixel-exact PowerPoint text-layout simulation. Overlap detection
uses a small epsilon (0.01in) so adjacent, touching boxes from floating-point
rounding aren't reported as false positives. This mechanical pass only
catches objective, scriptable problems (Section 49 in CLAUDE.md) — always
also look at `render/<version>/contact_sheet.html` yourself (or have the
qa-reviewer agent do it) before calling a deck final.

## Known environment gotcha

If `render` fails with `Error: source file could not be loaded` for *every*
file (even a plain .txt), LibreOffice's application components aren't
installed — only `libreoffice-core`/`libreoffice-common`. Fix:
`apt-get install -y libreoffice-impress`.

## Known rendering-fidelity caveat (bold reversed-color text)

Found while QA-reviewing a real deck: bold white-on-dark-navy text (e.g. a
`comparison` column's `emphasize: true` header, or a `cover`/`section_divider`
title) can render with fine glyph details lost in this LibreOffice + fallback
Japanese font pipeline — specifically, a capital "J" lost its hook and became
indistinguishable from "I", turning "JOGMEC" into "IOGMEC" on screen. The same
text in regular (non-bold) weight or on a light background rendered correctly.
This is a rendering-environment artifact (missing the real "Yu Gothic" font,
LibreOffice's bold-synthesis on its substitute), not a `slides.yaml` content
bug — but since this pipeline's rendered PNGs are the only QA evidence
available before a human opens the real .pptx, treat it as real:
- Avoid placing acronyms/proper nouns with easily-confused glyph pairs (I/J,
  O/0, l/1) inside bold, reversed-color (white-on-dark) text if there's a
  lighter-weight or non-reversed place to put the same information instead.
- Always do a final visual proof of the actual `.pptx` in real PowerPoint
  (with the real fonts named in `design_system.json` installed) before
  distributing — this render pipeline is a safety net, not a substitute for
  that.
