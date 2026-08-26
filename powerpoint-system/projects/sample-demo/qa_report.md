# QA Report — sample-demo (v02)

Generated: 2026-08-26T07:53:53.424Z
Slides: 15
Verdict: **pass**

## Mechanical QA

No mechanical issues found.

## Visual / Editorial QA

v02 changed only `S15_ACTION`'s closing line (added a concrete follow-up
timeline) to demonstrate the single-slide revision workflow (CLAUDE.md
Section 3 / 7) — the rest of the deck is byte-identical in content to v01,
already reviewed below.

Re-checked `render/v02/slide_15.png` specifically: the longer action text
wraps to two lines and still sits fully inside its highlighted box with
comfortable padding top and bottom — no overflow, confirming the mechanical
overflow estimate (which also reported no issue) was correct here. Re-checked
`render/v02/contact_sheet.html` for the rest of the deck: unchanged from v01.

- **Layout**: no overlap, bleed, or misalignment observed on any slide.
- **Typography**: consistent heading/body font across every slide; Japanese
  text renders correctly, no tofu/substitution; title line-wrapping looks
  natural on the two-line titles (S04, S05, S07).
- **Design**: palette and title treatment consistent slide-to-slide; the
  contact sheet shows healthy rhythm — no more than two consecutive slides
  share a visual type (cover, agenda, section_divider, chart, comparison,
  two_column, matrix, process, full_image, kpi_cards, quote, timeline, table,
  big_number, summary — all 15 layouts exercised, none repeated back-to-back).
- **Content**: no typos spotted; the +43% volume figure (S04) and -23%
  idle-dock figure (S10) do not contradict each other or any other slide;
  every external-style claim carries a `(demo値)` qualifier since this is a
  fictional demo dataset with no real `sources.json` backing beyond the two
  placeholder entries.
- **Presentation**: each slide states one conclusion in its title; reading
  S01→S15 titles in order reproduces the whole Problem→Insight→Solution→
  Evidence→Action arc; S15 still ends on a single, unambiguous ask, now with
  a concrete next step attached.
- **Minor, non-blocking**: S09 full-image caption sits close beneath the
  overlay title band — acceptable but worth tightening if this layout is
  reused with a longer caption. S12 (timeline) leaves a large unused lower
  area — consistent with "generous whitespace" but could host a short summary
  callout in a real deck.

Verdict: **pass** — meets the Section 9 completion checklist (opens cleanly,
no overflow/overlap, correct Japanese rendering, story reads end-to-end from
titles, one message per slide, consistent design, no numeric contradictions,
sources tracked, matches the illustrative brief). Being a system demo with
fictional data, it is not intended for actual client use.
