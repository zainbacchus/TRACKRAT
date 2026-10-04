# FASTER THAN poster series (11in x 17in)

Coffee-shop posters for the TRACKRAT Invitational (Sunday October 18, 2026,
9 to 11 AM). One template, one punchline per poster: FASTER THAN... YOUR
"HYBRID" NEIGHBOR, FASTER THAN... I-35, FASTER THAN... TESLA ROBO TAXI, and so on.

## Still placeholder: needed before print

1. **Kollective's real logo.** `logos/kollective-placeholder.png` was cut out
   of an Instagram carousel, so it is low resolution. We need the real logo
   from Kollective: SVG or PDF, or at least a large transparent PNG. Save it
   in `logos/` and point `KOL` at it in `build_series.py`. The placeholder is
   white on transparent, which is why `credits()` inverts it on orange; adjust
   that `filter:invert(1)` if the real file is a different colour.
2. **A better-quality runner.** `runner-dots.svg` is re-traced from a
   compressed product photo of the ATHLOS x TRACKRAT shirt
   (`athlos-shirt.webp`) by `extract_runner.py`. The dot grid is reconstructed
   rather than the original art, so it goes blocky up close. Get the original
   artwork, ideally vector, and replace `runner-dots.svg` with a single-colour
   SVG drawn in `fill="currentColor"`. Keep the 530x624 proportions or change
   `RUN_RATIO`, then re-check that FASTER THAN still clears her head (below).

Also worth confirming: the partner logos in `logos/` are one-colour black
versions made from web downloads (Nirvanix and DripDrop are normally in
colour). Check each partner is fine with a one-colour mark, and ask for
vector files.

## Build

```sh
python3 build_series.py            # series-<slug>.html
python3 build_series.py --render   # also series-<slug>.png (proof) and series-<slug>.pdf (print)
```

Python 3, standard library only. `--render` needs Google Chrome; off a Mac,
run it as `CHROME=/path/to/chrome python3 build_series.py --render`.
`extract_runner.py` (only for re-tracing the runner) needs Pillow. Generated
files are gitignored.

## Adding or changing a punchline

Edit `SERIES` at the top of `build_series.py`: a slug, the lines (you choose
the breaks), and the background (`BK`; every poster is on black).

- Headline type is always white.
- The punchline always fills most of the zone between FASTER THAN... and the
  date block (2.0in to 10.9in down), however many words it has. It is set as
  wide as the 9.9in measure, then stretched vertically to fill the height, up
  to `STRETCH_MAX` (2.2x; Plex Mono Bold reads as a condensed face to about
  2x and distorts past that). It sits on the bottom of the zone, so any
  shortfall shows the runner above it, and the date block never moves.
- Choose breaks that need the least stretch: lines of similar length that,
  stacked, come out roughly as tall as they are wide. A single short word
  (I-35) or a long one (RESPONDING) hits the cap and fills about 60% of the
  zone; stacks like YOUR / EX'S / REBOUND need much less.
- Word gaps, apostrophes and quote marks are tightened automatically by
  `tight()`, because a monospace face gives each one a full letter-width
  (EX'S would otherwise read EX ' S). Write them as `&#39;` and `&quot;`.

## Fixed on purpose

- **FASTER THAN... never covers her head.** The whole line, ellipsis
  included, is fitted to end by 7.1in across (`TITLE_W`); her head sits at
  about 7.7 to 9.0in across and 0.4 to 1.6in down. Moving or resizing the
  runner means re-checking this. The ellipsis is three bold periods pulled
  together (`ELLIPSIS`), because the font's one-cell ellipsis glyph is tiny.
- **Runner tone.** She is a deep orange (`TONE`) rather than black, so she
  reads as the backdrop and her stray dots never look like punctuation next
  to the type.
- **QR.** `qr-invitational.svg` points to
  https://www.trackratsprint.club/invitational. It sits on a taped paper tile;
  its quiet zone is cropped to 2 modules and the tile's padding makes up the
  rest. Scan the PNG proof with a phone after any change to it.
- **QR shadow** is a hard shadow, because Chrome's PDF output turns a blurred
  shadow into a tinted box behind the tile.
- **Credits.** TRACKRAT is the biggest mark, on its own row; Kollective,
  Nirvanix, New Balance, C4 and DripDrop sit smaller beneath it; DJ Thani's logo is
  right-justified, with LIVE MUSIC BY: centred over it. Keep these sizes. The DJ Thani logo is
  lifted from a 500px JPG; a larger or vector file would print sharper.
- **Event name.** TRACKRAT INVITATIONAL 2026 sits above the date. It is the
  only place the poster names the event, so do not drop it.

## Print

11in x 17in (tabloid) at 100% scale. No bleed is built in: if the printer
needs bleed for the full-colour background, ask them to extend it, or add
0.125in to each side of the page size and background. Type, the runner and
the QR are vector in the PDF; the logos are raster.
