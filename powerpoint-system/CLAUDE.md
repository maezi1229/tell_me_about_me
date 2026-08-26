# powerpoint-system — CLAUDE.md

This directory is a self-contained **Universal PowerPoint Creation System** for
Claude Code. It is not "a script that pastes text into slides." It reproduces
the workflow of a five-person team — Researcher, Story Architect, Slide
Designer, PPTX Builder, QA Reviewer — building a client-ready deck together.

The only acceptable finish line: **a .pptx that could be handed to a client or
a board meeting today**, that opens correctly in Microsoft PowerPoint, and
that a presenter could actually stand up and deliver from.

## 0. Never do this

- Never generate a .pptx before the outline (Section 8 table) has been shown
  to the user and approved — unless the user explicitly said "no questions /
  just do it / your call," in which case make reasonable assumptions, state
  them, and proceed.
- Never invent numbers, sources, or facts. If a number is unknown, say so in
  `research.md` / `facts.json` and flag it — don't fabricate one to fill a
  slide.
- Never dump a paragraph of body text onto a slide. One slide = one message.
  Overflow goes to Appendix or Speaker Notes.
- Never silently skip the render + QA step. A `.pptx` that has not been
  rendered to PNG and reviewed is not "done."
- Never rewrite the whole deck to satisfy a one-slide edit request. Find the
  slide ID, edit `slides.yaml`, rebuild only what changed.
- Never claim a deck is final if `qa_report.md` has open Critical/Major
  issues.

## 1. Directory map

```
powerpoint-system/
  CLAUDE.md                  <- this file
  package.json                <- Node deps (pptxgenjs, js-yaml, jszip, fast-xml-parser, ajv)
  cli.js                       <- orchestrator: node cli.js <command> <project>
  schemas/                     <- JSON Schemas for every intermediate file
  design/design_system.default.json   <- fallback design tokens when no template supplied
  engine/
    lib/tokens.js               <- merges template_analysis + design_system + hard fallback -> resolved tokens
    lib/templateAnalyzer.js     <- parses an uploaded .pptx into template_analysis.json
    lib/qaCollector.js          <- layouts report placed element boxes here during build, for mechanical QA
    layouts/*.js                <- one file per Visual Type (cover, bigNumber, comparison, chart, ...)
    build.js                    <- PPTX Builder: slides.yaml + design_system.json + template_analysis.json -> .pptx
    render.js                   <- pptx -> pdf -> png per slide (LibreOffice + poppler)
    contactSheet.js              <- builds an HTML contact sheet of every rendered slide
    qaMechanical.js               <- overflow / overlap / missing-asset / font checks -> qa_report.md
  projects/
    _template/                  <- empty skeleton copied for every new deck
    <project-name>/             <- one folder per real deck (see Section 3)
```

Everything Claude Code writes for a specific deck lives under
`projects/<project-name>/`, never mixed into the engine folders above.

## 2. The five agents

Real subagent definitions live at the repo root: `.claude/agents/researcher.md`,
`story-architect.md`, `slide-designer.md`, `pptx-builder.md`, `qa-reviewer.md`.
Each is scoped to one responsibility and hands its output to the next agent
**through files**, never through conversation memory alone.

| Agent | Reads | Writes | Never does |
|---|---|---|---|
| Researcher | user materials, web/company sources | `research.md`, `facts.json`, `sources.json` | invent numbers, choose the story, design slides |
| Story Architect | `brief.md`, `research.md`, `facts.json` | `outline.md` (approval table) | pick colors/fonts, write PPTX code |
| Slide Designer | `outline.md`, `facts.json`, `design_system.json` | `slides.yaml` (visual_type + content per slide) | write raw XML/PptxGenJS calls |
| PPTX Builder | `slides.yaml`, `design_system.json`, `template_analysis.json` | `output/presentation_vNN.pptx`, `CHANGELOG.md` | change the story or wording |
| QA Reviewer | rendered PNGs, `slides.yaml`, `qa_report.md` history | `qa_report.md`, fix instructions back to Slide Designer / PPTX Builder | rubber-stamp a deck with unresolved Critical/Major issues |

## 3. Project folder (one per deck)

```
projects/<project-name>/
  brief.md              <- Step 1-4 hearing answers (purpose, audience, goal, format)
  template_analysis.json <- only if the user supplied a template (Section 5)
  research.md           <- Researcher's narrative findings + open questions
  facts.json            <- structured facts/numbers, each tagged with a source
  sources.json          <- citation registry (source, url, title, accessed_date, slide_id, claim)
  outline.md            <- Story Architect's slide-by-slide table, presented for approval
  design_system.json    <- resolved design tokens for this deck (from template or from Section 6 defaults)
  slides.yaml           <- content layer: one entry per slide, keyed by Slide ID
  output/
    presentation_v01.pptx, presentation_v02.pptx, ...
    presentation_latest.pptx
  render/v01/slide_01.png ... contact_sheet.html
  qa_report.md
  CHANGELOG.md
```

Resuming a project ("前回の続き"): read `brief.md` -> `outline.md` ->
`slides.yaml` -> `design_system.json` -> `CHANGELOG.md` in that order and infer
the current stage from what already exists. Do not re-ask questions already
answered in `brief.md`.

## 4. Content / Design / Rendering separation (Section 45)

- **Content layer** = `slides.yaml`. What to say. No colors, no coordinates.
- **Design layer** = `design_system.json` (+ `template_analysis.json`). How it
  looks: palette, type scale, spacing unit, logo/footer rules.
- **Rendering layer** = `engine/layouts/*.js` + `engine/build.js`. How it
  becomes PPTX shapes via PptxGenJS.

Changing wording touches only `slides.yaml`. Changing the palette touches only
`design_system.json`. Changing the generation engine touches only `engine/`.
None of the three should require touching the other two.

## 5. Slide IDs

Every slide in `slides.yaml` has a stable `id` like `S01_COVER`,
`S04_PROBLEM`, `S06_CASE`. When a user says "5ページ" / "the Solution page" /
"the one with the roadmap," resolve it to a slide ID by position, by title
keyword, or by `visual_type` before editing anything.

## 6. Visual types (Slide Designer picks one per slide)

`cover`, `section_divider`, `agenda`, `two_column`, `big_number`, `kpi_cards`,
`comparison`, `chart`, `timeline`, `process`, `matrix`, `full_image`, `quote`,
`table`, `summary`. Each maps 1:1 to a file in `engine/layouts/`. Do not
invent a new visual type without adding the matching layout component — never
hand-place raw text boxes for something a layout already covers, and never
force the same one or two layouts onto every slide (Section 51) — vary
according to content, not for novelty's sake.

## 7. Build / render / QA loop

```
node cli.js check-env                       # verify Node/LibreOffice/poppler availability
node cli.js new <project>                   # scaffold projects/<project>/ from _template
node cli.js analyze-template <pptx> <project>  # Section 5, only if user gave a template
node cli.js build <project>                 # slides.yaml -> output/presentation_vNN.pptx
node cli.js render <project>                # pptx -> render/vNN/slide_*.png (+ pdf)
node cli.js contact-sheet <project>         # render/vNN/contact_sheet.html
node cli.js qa <project>                    # mechanical QA -> qa_report.md
node cli.js all <project>                   # build + render + contact-sheet + qa in one pass
```

`qaMechanical.js` is the **Mechanical QA** half of Section 49 (overflow,
overlap, missing assets, font count, broken image, slide count). The
**Visual/Editorial QA** half (clarity, persuasiveness, story, title quality,
one-message-per-slide) is done by the QA Reviewer agent actually looking at
the rendered PNGs / contact sheet and reasoning about them — that half cannot
be scripted and must not be skipped.

When QA finds Critical/Major issues: fix `slides.yaml` (content) or the
relevant `engine/layouts/*.js` (systemic design issue), rebuild **only if
needed** (prefer editing the one affected slide's data), re-render, re-QA.
Stop when there are no unresolved Critical/Major issues, or after a
reasonable number of iterations (do not loop forever — surface remaining Minor
issues to the user instead of iterating indefinitely).

## 8. Design rules (non-negotiable defaults, overridable via design_system.json)

Simple, professional, generous whitespace. No gratuitous gradients, 3D, drop
shadows, or icon clutter. One message per slide; detail goes to Appendix or
Speaker Notes. Titles are the slide's *conclusion*, not a topic label — reading
every title in order should tell the whole story. Default font stack must
render correctly in a plain Japanese PowerPoint environment (see
`design/design_system.default.json` for the exact fallback stack) unless a
template overrides it.

## 9. Completion checklist (Section 37) — all required before calling a deck final

- [ ] `.pptx` opens without repair prompts
- [ ] `node cli.js qa` reports no Critical/Major issues
- [ ] No text overflow / no overlapping elements
- [ ] Japanese text renders correctly (no font substitution / tofu)
- [ ] Story reads end-to-end from titles alone
- [ ] One message per slide
- [ ] Design is consistent slide-to-slide
- [ ] No numeric contradictions between slides
- [ ] Every external claim has a `sources.json` entry
- [ ] Matches the goal stated in `brief.md`
- [ ] Could actually be presented from, as-is

## 10. What Claude Code should do when the user says "PowerPointを作りたい"

Do not explain the system. Behave like the assistant described in Section 39:
acknowledge, then start the Step 1-4 hearing (purpose / audience / desired
outcome / format & length / template / source materials / title), a handful
of questions at a time, never re-asking what's already been answered, and
respecting "お任せ" / "すぐ作って" as permission to assume and proceed.
