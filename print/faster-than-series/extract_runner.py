#!/usr/bin/env python3
"""The dot-dissolve runner from the ATHLOS x TRACKRAT shirt, rebuilt as vector dots.

The source is a compressed product photo (athlos-shirt.webp), so the artwork's own
dot grid is gone. This re-samples the runner onto a clean grid instead: a cell's
orange coverage decides whether it gets a dot. The output is an SVG of squares in
one color, so it prints sharp at any size and takes any brand color.

  python3 extract_runner.py [pitch] [threshold]   -> runner-dots.svg (fill: currentColor)
"""
import pathlib, sys
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
PITCH = float(sys.argv[1]) if len(sys.argv) > 1 else 3.0
THRESH = float(sys.argv[2]) if len(sys.argv) > 2 else 0.18
X0, Y0, X1, Y1 = 528, 260, 1058, 884          # runner bbox (533,266)-(1052,878) plus a margin

im = Image.open(HERE / 'athlos-shirt.webp').convert('RGB'); px = im.load()
def alpha(x, y):
    # how orange a pixel is: 0 on the grey shirt and the grey type, 1 on solid ink
    # (the shirt sits at r-g ~ 0; faint ink starts ~20, solid ink reaches ~160)
    r, g, b = px[x, y]
    return max(0.0, min(1.0, (r - g - 12) / 90))

rects, n = [], 0
cols, rows = int((X1 - X0) / PITCH), int((Y1 - Y0) / PITCH)
for j in range(rows):
    for i in range(cols):
        xa, ya = X0 + i * PITCH, Y0 + j * PITCH
        cell = [alpha(int(xa + u), int(ya + v)) for v in range(int(PITCH)) for u in range(int(PITCH))]
        if sum(cell) / len(cell) >= THRESH:
            s = PITCH * .82
            rects.append(f'<rect x="{i * PITCH:.1f}" y="{j * PITCH:.1f}" width="{s:.2f}" height="{s:.2f}"/>'); n += 1

W, H = X1 - X0, Y1 - Y0
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" fill="currentColor">{"".join(rects)}</svg>'
(HERE / 'runner-dots.svg').write_text(svg)
print(f'{n} dots, pitch {PITCH}, {W}x{H}')
