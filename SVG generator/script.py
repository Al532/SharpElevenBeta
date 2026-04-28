from pathlib import Path
import json
import re

from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

FONT_PATH = "MaPolice.ttf"
OUT_DIR = Path("svg_glyphs")

CHARS = (
    list("ABCDEFG")
    + list("0123456789")
    + list("adgijlmnstub")
    + ["♭", "♯", "♮", "Δ", "△", "ø", "°", "+", "-", "−", "(", ")", "/", ","]
)

def safe_name(char: str) -> str:
    names = {
        "♭": "flat",
        "♯": "sharp",
        "♮": "natural",
        "Δ": "delta",
        "△": "triangle",
        "ø": "half_dim",
        "°": "dim",
        "+": "plus",
        "-": "hyphen",
        "−": "minus",
        "(": "paren_left",
        ")": "paren_right",
        "/": "slash",
        ",": "comma",
    }

    if char in names:
        return names[char]

    if re.match(r"[A-Za-z0-9]", char):
        return char

    return f"u{ord(char):04X}"


OUT_DIR.mkdir(exist_ok=True)

font = TTFont(FONT_PATH)
glyph_set = font.getGlyphSet()
cmap = font.getBestCmap()

units_per_em = font["head"].unitsPerEm
ascent = font["hhea"].ascent
descent = font["hhea"].descent

metrics = {
    "font": FONT_PATH,
    "unitsPerEm": units_per_em,
    "ascent": ascent,
    "descent": descent,
    "glyphs": {},
}

for char in CHARS:
    codepoint = ord(char)

    if codepoint not in cmap:
        print(f"Absent dans la police : {char}")
        continue

    glyph_name = cmap[codepoint]
    glyph = glyph_set[glyph_name]

    path_pen = SVGPathPen(glyph_set)
    glyph.draw(path_pen)
    path_data = path_pen.getCommands()

    bounds_pen = BoundsPen(glyph_set)
    glyph.draw(bounds_pen)
    bbox = bounds_pen.bounds  # xmin, ymin, xmax, ymax

    advance = glyph.width
    filename = f"{safe_name(char)}.svg"

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg"
  viewBox="0 {-ascent} {advance} {ascent - descent}">
  <path d="{path_data}" transform="scale(1,-1)" fill="currentColor"/>
</svg>
'''

    (OUT_DIR / filename).write_text(svg, encoding="utf-8")

    metrics["glyphs"][char] = {
        "file": filename,
        "unicode": f"U+{codepoint:04X}",
        "glyphName": glyph_name,
        "advance": advance,
        "bbox": bbox,
    }

    print(f"{char} → {filename}")

(OUT_DIR / "metrics.json").write_text(
    json.dumps(metrics, ensure_ascii=False, indent=2),
    encoding="utf-8",
)