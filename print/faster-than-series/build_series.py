#!/usr/bin/env python3
"""FASTER THAN: a series of 11x17 coffee-shop posters for the 2026 Invitational.

One template, one punchline per poster. Fixed on every poster, so the set
reads as a series:
  - FASTER THAN across the top, stopping short of the runner's head
  - the runner, big, in the background on the right
  - the date block and the taped QR at the same height
  - the credits (presenters, partners, live music)

The punchline is the only thing that changes. It is set at one size, as big
as the measure (9.9in wide) and the zone (2.0in to 10.9in down) allow, and
sits on the zone's floor so it grows upward. Line breaks are chosen per
punchline in SERIES, because a long single word (RESPONDING, TRANSPLANT) caps
the size: a line can only be as big as its widest word lets it.

Headline type is always white. Backgrounds are Sprint Orange or black.

Self-contained: fonts come from the repo's /fonts, the wordmark from the repo
root, everything else from this folder. See README.md for what is still a
placeholder (the Kollective logo, the runner artwork).

  python3 build_series.py            series-<slug>.html for every entry
  python3 build_series.py --render   also PNG proofs and print PDFs (needs Chrome)
"""
import base64, os, pathlib, subprocess, sys

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent.parent
b64 = lambda p: base64.b64encode(pathlib.Path(p).read_bytes()).decode()
OR, BK, WH, PAPER = '#FF4D1F', '#000', '#fff', '#F3EEE5'

# slug, punchline lines (you choose the breaks), background
SERIES = [
    ('ex-new-bf',     ['YOUR', 'EX&#39;S', 'NEW BF'],        OR),
    ('claude',        ['CLAUDE', 'RESPONDING'],              BK),
    ('i-35',          ['I-35'],                              BK),
    ('waymo',         ['A', 'WAYMO'],                        BK),
    ('hinge-guy',     ['YOUR', 'NEW', 'HINGE', 'GUY'],       OR),
    ('sf-transplant', ['A SF', 'TRANSPLANT'],                OR),
    ('excuses',       ['YOUR', 'EXCUSES'],                   BK),
    ('ex-rebound',    ['YOUR', 'EX&#39;S', 'REBOUND'],       OR),
]

# ---------------------------------------------------------------- page shell

CSS = f"""
@font-face {{ font-family:'IBM Plex Mono'; font-weight:600; src:url(data:font/woff2;base64,{b64(REPO / 'fonts/ibm-plex-mono-600-latin.woff2')}) format('woff2'); }}
@font-face {{ font-family:'IBM Plex Mono'; font-weight:700; src:url(data:font/woff2;base64,{b64(REPO / 'fonts/ibm-plex-mono-700-latin.woff2')}) format('woff2'); }}
@page {{ size:11in 17in; margin:0; }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
html,body {{ width:11in; height:17in; overflow:hidden; }}
body {{ font-family:'IBM Plex Mono',monospace; font-weight:700; -webkit-font-smoothing:antialiased; position:relative;
        -webkit-print-color-adjust:exact; print-color-adjust:exact; }}
.abs {{ position:absolute; }}
.hl {{ font-weight:700; letter-spacing:-.02em; line-height:1.0; }}   /* the site's headline face: Plex Mono Bold, tight */
.lab {{ font-weight:600; letter-spacing:.2em; }}                      /* UI-chrome labels */
.fit {{ display:block; white-space:nowrap; width:max-content; }}
"""

# Sizes text to fill its box once the fonts have loaded:
#   [data-fit] .fit  widest size whose width fits the box   (FASTER THAN)
#   #zone            widest size that fits width AND height (the punchline)
FIT_JS = """<script>document.fonts.ready.then(()=>{
document.querySelectorAll('[data-fit]').forEach(box=>{const W=box.offsetWidth;box.querySelectorAll('.fit').forEach(l=>{
  let lo=10,hi=3000;for(let i=0;i<32;i++){const m=(lo+hi)/2;l.style.fontSize=m+'px';(l.offsetWidth>W?hi=m:lo=m);}l.style.fontSize=lo+'px';});});
const b=document.getElementById('zone');if(b){const s=b.firstElementChild,W=b.clientWidth,H=b.clientHeight;
  let lo=10,hi=1200;for(let i=0;i<32;i++){const m=(lo+hi)/2;s.style.fontSize=m+'px';(s.offsetWidth<=W&&s.offsetHeight<=H)?lo=m:hi=m;}
  s.style.fontSize=lo+'px';}
document.title='fitted';});</script>"""

def page(bg, fg, body):
    return (f'<!doctype html><meta charset="utf-8"><title>FASTER THAN</title>'
            f'<style>{CSS}body {{ background:{bg}; color:{fg}; }}</style><body>{body}{FIT_JS}</body>')

def tight(text):
    """A monospace space is a full character wide; close word gaps to about
    half. The apostrophe too: in a monospace face it takes a full cell, so
    EX'S reads EX ' S unless it is pulled in on both sides."""
    first, *rest = text.split(' ')      # split first: the spans below contain spaces
    out = first + ''.join(f'<span style="margin-left:.28em">{w}</span>' for w in rest)
    return out.replace('&#39;', '<span style="margin:0 -.17em">&#39;</span>')

# ---------------------------------------------------------------- the runner

# PLACEHOLDER ARTWORK, see README. runner-dots.svg is re-traced from a
# compressed product photo of the ATHLOS x TRACKRAT shirt by extract_runner.py
# (pitch 3, threshold 0.18). Any single-colour SVG drawn with fill="currentColor"
# can replace it; keep the 530x624 viewBox ratio or change RUN_RATIO.
#
# At this size and position her head sits at roughly 7.7-9.0in across and
# 0.4-1.6in down, which is why FASTER THAN is fitted to end at 7.1in
# (TITLE_W below). Move or resize her and re-check that it still clears.
RUNNER = (HERE / 'runner-dots.svg').read_text()
RUN_H, RUN_RATIO = 10.0, 530 / 624
TONE = {OR: '#8A2408', BK: '#7A2208'}    # a deep Sprint Orange, so she reads as the backdrop
TITLE_W = 6.6                             # inches, from the .5in margin

def runner(bg):
    return (f'<div class="abs" style="right:.3in;top:.3in;height:{RUN_H}in;width:{RUN_H * RUN_RATIO:.2f}in;'
            f'color:{TONE[bg]}">{RUNNER}</div>')

# ---------------------------------------------------------------- the QR

# On the same paper as a taped card, tilted, so it reads as pinned up rather
# than a white sticker. The artwork's own quiet zone is 4 modules; it is cropped
# to 2 and the paper's padding makes up the rest, so the light margin still
# clears 4 modules. Points at https://www.trackratsprint.club/invitational.
# Test a scan of the PNG proof (and a phone at arm's length) after any change.
_q = (HERE / 'qr-invitational.svg').read_text()
QR = (_q.replace('viewBox="0 0 41 41"', 'viewBox="2 2 37 37"').replace(' width="41" height="41"', '')
        .replace('fill="#fff"', f'fill="{PAPER}"').replace('<svg ', '<svg style="display:block;width:100%;height:100%" ', 1))

def qr_tile(size, css):
    return (f'<div class="abs" style="{css};width:{size}in;height:{size}in;padding:.13in;background:{PAPER};border-radius:.08in;'
            # A hard shadow, not a blurred one: Chrome's print-to-PDF rasterises a
            # blurred shadow into a tinted box behind the whole tile.
            f'transform:rotate(2.5deg);box-shadow:.03in .07in 0 rgba(0,0,0,.22)">{QR}'
            f'<div class="abs" style="left:50%;top:-.2in;width:1.1in;height:.38in;margin-left:-.55in;'
            f'background:rgba(240,235,220,.85);transform:rotate(-5deg)"></div></div>')

# ---------------------------------------------------------------- credits

# The wordmark: outlined paths from the repo root, the exported box's padding
# cropped so it sits on the same cap line as the Kollective logo.
_wm = (REPO / 'trackrat-wordmark.svg').read_text()
WORDMARK = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -147 884 150"' + _wm[_wm.index(' role='):]).replace('width="899.4" height="196.2" ', '')

# PLACEHOLDER, see README: cut from an Instagram carousel, white on transparent.
KOL = b64(HERE / 'logos/kollective-placeholder.png')

# Supporting partners: one-colour black, sized by eye so they weigh about the
# same (Nirvanix's thin serif needs more height than C4's slab).
PARTNERS = [('nirvanix-black.png', .31), ('newbalance-black.png', .42), ('c4-black.png', .26), ('dripdrop-black.png', .26)]

def credits(dark):
    """Presenters biggest, partners smaller beneath; live music right-justified.
    On black every mark goes white."""
    fg = WH if dark else BK
    wm = WORDMARK.replace('fill="#000000"', f'fill="{fg}"').replace('<svg ', '<svg style="height:.32in;width:auto" ', 1)
    inv = 'filter:invert(1);' if dark else ''
    partners = ''.join(f'<img src="data:image/png;base64,{b64(HERE / "logos" / f)}" style="display:block;{inv}height:{h}in">'
                       for f, h in PARTNERS)
    kol = '' if dark else 'filter:invert(1)'
    return f"""<div class="abs" style="left:.55in;right:.55in;bottom:.6in;display:flex;justify-content:space-between;align-items:flex-start;color:{fg}">
  <div>
    <div class="lab" style="font-size:.14in;margin-bottom:.16in">PRESENTED BY:</div>
    <div style="display:flex;align-items:center;gap:.3in">
      <span style="display:block;height:.32in;line-height:0">{wm}</span>
      <span style="display:block;width:.025in;height:.4in;background:{fg}"></span>
      <img src="data:image/png;base64,{KOL}" style="display:block;height:.34in;{kol}">
    </div>
    <div style="display:flex;align-items:center;gap:.5in;margin-top:.3in">{partners}</div>
  </div>
  <div style="text-align:right">
    <div class="lab" style="font-size:.14in;margin-bottom:.16in;margin-right:-.2em">LIVE MUSIC BY:</div>
    <div class="hl" style="font-size:.38in;height:.4in;display:flex;align-items:center;justify-content:flex-end;letter-spacing:0">DJ THANI</div>
  </div>
</div>"""

# ---------------------------------------------------------------- the poster

def poster(lines, bg):
    dark = bg == BK
    fg = WH if dark else BK          # small type: black on orange, white on black
    accent = OR if dark else WH      # FREE TO ATTEND
    punch = '<br>'.join(tight(l) for l in lines)
    return page(bg, fg, f"""
{runner(bg)}
<div class="abs hl" data-fit style="left:.5in;width:{TITLE_W}in;top:.5in;color:{WH}"><span class="fit">{tight('FASTER THAN')}</span></div>
<div id="zone" class="abs hl" style="left:.5in;right:.5in;top:2.0in;bottom:{17 - 10.9}in;display:flex;flex-direction:column;justify-content:flex-end;color:{WH}">
  <span style="display:block;width:max-content;line-height:.92">{punch}</span></div>
<div class="abs lab" style="left:.55in;top:11.4in;font-size:.2in">TRACKRAT INVITATIONAL 2026</div>
<div class="abs hl" style="left:.55in;top:11.75in;font-size:.66in;line-height:1.0">{tight('SUNDAY OCTOBER 18')}<br>{tight('9 - 11AM')}</div>
<div class="abs lab" style="left:.55in;top:13.25in;font-size:.3in;color:{accent}">FREE TO ATTEND</div>
{qr_tile(2.6, 'right:.6in;top:11.4in')}
{credits(dark)}""")

CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')

def render(html):
    """PNG proof at 96dpi (1056x1632) and a print PDF, both from the same HTML."""
    stem = html.with_suffix('')
    common = [CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--virtual-time-budget=6000']
    subprocess.run(common + ['--window-size=1056,1632', f'--screenshot={stem}.png', html.as_uri()],
                   check=True, capture_output=True)
    subprocess.run(common + ['--no-pdf-header-footer', f'--print-to-pdf={stem}.pdf', html.as_uri()],
                   check=True, capture_output=True)

if __name__ == '__main__':
    for slug, lines, bg in SERIES:
        out = HERE / f'series-{slug}.html'
        out.write_text(poster(lines, bg))
        if '--render' in sys.argv:
            render(out)
        print(out.name)
