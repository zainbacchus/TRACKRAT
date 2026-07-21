# OFFTRACK poster (24in x 36in)

Print-ready poster for OFFTRACK demo nights. Evergreen (no date), so prints
stay useful across events. `OFFTRACK-poster-24x36.pdf` is the deliverable.

## Design source

Everything derives from the site's own design system:

- Wordmark: Fugaz One per `brand.html` `.wordmark` / `offtrack.html`
  `.page-title` (normal style, letter-spacing -0.14em, line-height 0.86)
- Tape strips: matched to `og-offtrack.png` (hazard ends, opposing tilts)
- "THE DIFF" washi tape: 1:1 port of `offtrack.html` `.card-label` /
  `.label-orange` (torn-edge clip polygon, fiber pinstripes, 106deg sheen)
- Fonts: read directly from `/fonts` at build time and embedded
- Ruled notebook lines: vector SVG at exact 1.09in pitch (CSS gradients get
  rasterized unevenly by print-to-PDF; SVG stays exact)
- QR (`qr-offtrack.svg`): points to https://www.trackratsprint.club/offtrack

## Rebuild

```sh
python3 build_poster.py
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf=OFFTRACK-poster-24x36.pdf poster.html
```

To regenerate the QR for a different URL (needs `pip install segno`):

```python
import segno
qr = segno.make('https://www.trackratsprint.club/offtrack', error='q')
qr.save('qr-offtrack.svg', kind='svg', xmldecl=False, svgns=True,
        dark='#14141B', light=None, border=0, omitsize=True)
```

## Print specs (FedEx Office)

- 24in x 36in, matte, full bleed, 100% scale (no "fit to page")
- All vector, fonts embedded as subsets; no DPI concerns
- Scan the QR from the on-screen PDF before printing
