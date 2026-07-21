#!/usr/bin/env python3
"""Assemble the OFFTRACK 24x36 poster HTML with base64-embedded fonts + QR."""
import base64, pathlib

d = pathlib.Path(__file__).parent
repo = d.parent.parent  # repo root: fonts live in /fonts

def b64(name):
    return base64.b64encode((repo / "fonts" / name).read_bytes()).decode()

fugaz = b64("fugaz-one-latin.woff2")
mono4 = b64("ibm-plex-mono-400-latin.woff2")
mono6 = b64("ibm-plex-mono-600-latin.woff2")
mono7 = b64("ibm-plex-mono-700-latin.woff2")
qr_svg = (d / "qr-offtrack.svg").read_text()

# ruled notebook lines: exact 1.09in pitch, vector so print spacing is uniform
ruling_lines = "".join(
    f'    <line x1="0" y1="{i * 1.09:.2f}" x2="24" y2="{i * 1.09:.2f}" stroke="#DFDBD0" stroke-width="0.03"/>\n'
    for i in range(1, 33)
)

html = f"""<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>OFFTRACK poster 24x36</title>
<style>
  @font-face {{ font-family:'Fugaz One'; src:url(data:font/woff2;base64,{fugaz}) format('woff2'); font-weight:400; }}
  @font-face {{ font-family:'IBM Plex Mono'; src:url(data:font/woff2;base64,{mono4}) format('woff2'); font-weight:400; }}
  @font-face {{ font-family:'IBM Plex Mono'; src:url(data:font/woff2;base64,{mono6}) format('woff2'); font-weight:600; }}
  @font-face {{ font-family:'IBM Plex Mono'; src:url(data:font/woff2;base64,{mono7}) format('woff2'); font-weight:700; }}

  @page {{ size: 24in 36in; margin: 0; }}
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  html,body {{ width:24in; height:36in; }}

  :root {{
    --paper:#FBFAF7; --ink:#14141B; --orange:#FF4D1F;
    --muted:#6B6A66; --line:#DFDBD0; --margin-red:#EBA396;
  }}

  body {{
    font-family:'IBM Plex Mono', monospace;
    color:var(--ink);
    background:var(--paper);
    position:relative; overflow:hidden;
  }}
  /* ruled lines + margin line drawn as vector SVG so spacing stays exact in the
     printed PDF (CSS gradient backgrounds get rasterized unevenly by print) */
  .ruling {{ position:absolute; top:0; left:0; width:24in; height:36in; }}

  /* ---------- tape strips (top right), matched to og-offtrack.png:
     hazard-striped BOTH ends; cream stripes on orange, grey on black;
     orange tilts down-right, black tilts up-right and sits in front ---------- */
  .tapes {{ position:absolute; top:1.6in; right:1.1in; display:flex; flex-direction:column; align-items:flex-end; }}
  .tape {{
    display:flex; align-items:stretch;
    font-weight:700; letter-spacing:.3em;
    filter:drop-shadow(.03in .08in .06in rgba(20,20,27,.28));
  }}
  .tape .txt {{ padding:.55in .62in .55in .62in; font-size:.98in; line-height:1; white-space:nowrap; }}
  .tape .end {{ width:.6in; flex:0 0 auto; }}
  .tape.orange {{ background:var(--orange); color:var(--ink); transform:rotate(2.5deg); }}
  .tape.orange .end {{ background:repeating-linear-gradient(45deg, rgba(251,250,247,.85) 0, rgba(251,250,247,.85) .09in, transparent .09in, transparent .24in); }}
  .tape.black {{ background:var(--ink); color:#fff; transform:rotate(-2deg); margin-top:-.32in; margin-right:1.3in; position:relative; z-index:2; }}
  .tape.black .end {{ background:repeating-linear-gradient(45deg, rgba(255,255,255,.28) 0, rgba(255,255,255,.28) .09in, transparent .09in, transparent .24in); }}

  /* ---------- headline (brand.html .wordmark / offtrack.html .page-title spec:
     Fugaz One, normal style, letter-spacing -0.14em, line-height 0.86) ---------- */
  .hero {{ position:absolute; left:2.2in; right:0.9in; top:11.6in; }}
  .wordmark {{
    font-family:'Fugaz One','Arial Black',sans-serif; font-weight:normal;
    font-size:4.85in; line-height:.86; letter-spacing:-0.14em;
    color:var(--ink); white-space:nowrap;
  }}
  .tagline {{ margin-top:1.0in; font-weight:700; font-size:1.12in; letter-spacing:.01em; }}

  /* ---------- blurb card (site's card + tape style) ---------- */
  .blurb-wrap {{ position:absolute; left:2.2in; right:1.6in; top:19.7in; }}
  .blurb-card {{
    background:var(--white); padding:1.35in 1.3in 1.25in 1.3in;
    border:.02in solid rgba(20,20,27,.08);
    box-shadow:.08in .12in 0 rgba(20,20,27,.12);
  }}
  .blurb-card p {{
    font-weight:500; font-size:.69in; line-height:1.7;
    letter-spacing:.01em; color:var(--ink);
  }}
  /* washi tape, ported 1:1 from offtrack.html .card-label/.label-orange:
     torn ends (same percent polygon), fiber pinstripes, 106deg sheen,
     0.94-alpha orange, 0.12em tracking, drop-shadow (not box-shadow,
     which clip-path would cut off) */
  .blurb-tape {{
    position:absolute; top:-.58in; left:.3in; transform:rotate(-5deg);
    background-color:rgba(255,77,31,0.94); color:#1a0700;
    font-weight:700; font-size:.62in; line-height:1; letter-spacing:.12em;
    text-transform:uppercase; padding:.41in .93in .47in; white-space:nowrap;
    clip-path:polygon(
      3% 0%, 0.5% 24%, 2.5% 48%, 0% 72%, 2.5% 100%,
      97.5% 100%, 100% 73%, 97% 49%, 99.5% 25%, 96.5% 0%);
    background-image:
      repeating-linear-gradient(90deg,
        rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) .05in, transparent .05in, transparent .155in),
      linear-gradient(106deg,
        rgba(255,255,255,0.18), rgba(255,255,255,0) 44%, rgba(0,0,0,0.08));
    filter:drop-shadow(0 .04in .04in rgba(20,20,27,0.26));
  }}

  /* ---------- footer ---------- */
  .footer {{
    position:absolute; left:0; right:0; bottom:0; height:6.4in;
    background:var(--ink); color:#fff;
    display:flex; align-items:center; padding:0 2.2in 0 2.2in; gap:1.4in;
  }}
  .footer::before {{
    content:''; position:absolute; left:0; right:0; top:-.55in; height:.55in;
    background:repeating-linear-gradient(45deg, var(--ink) 0, var(--ink) .28in, var(--orange) .28in, var(--orange) .62in);
  }}
  .qr {{ background:#fff; padding:.48in; width:4.5in; height:4.5in; flex:0 0 auto; }}
  .qr svg {{ width:100%; height:100%; display:block; }}
  .foot-text {{ flex:1; }}
  .foot-text .cta {{ font-weight:700; font-size:1.12in; letter-spacing:.12em; color:var(--orange); }}
  .foot-text .url {{ margin-top:.45in; font-weight:600; font-size:.8in; letter-spacing:.02em; color:#fff; }}
  .foot-text .host {{ margin-top:.45in; font-weight:400; font-size:.62in; letter-spacing:.14em; color:#9a99a3; }}
</style>
</head>
<body>

  <svg class="ruling" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
{ruling_lines}    <line x1="1.57" y1="0" x2="1.57" y2="36" stroke="#EBA396" stroke-width="0.04"/>
  </svg>

  <div class="tapes">
    <div class="tape orange"><div class="end"></div><div class="txt">DEMO&nbsp;NIGHT</div><div class="end"></div></div>
    <div class="tape black"><div class="end"></div><div class="txt">AUSTIN,&nbsp;TX</div><div class="end"></div></div>
  </div>

  <div class="hero">
    <div class="wordmark">OFFTRACK</div>
    <div class="tagline">Show &amp; tell for builders</div>
  </div>

  <div class="blurb-wrap">
    <div class="blurb-tape">THE&nbsp;DIFF</div>
    <div class="blurb-card">
      <p>Unlike your typical networking event, OFFTRACK is a small demo night for people doing creative things with technology to show off the cool stuff they've built.</p>
    </div>
  </div>

  <div class="footer">
    <div class="qr">{qr_svg}</div>
    <div class="foot-text">
      <div class="cta">LEARN MORE AT</div>
      <div class="url">trackratsprint.club/offtrack</div>
      <div class="host">HOSTED BY TRACKRAT SPRINT CLUB</div>
    </div>
  </div>

</body>
</html>"""

(d / "poster.html").write_text(html)
print("poster.html written:", len(html), "bytes")
