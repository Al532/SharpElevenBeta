from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Iterable

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parent
MANIFEST_PATH = ROOT / "font-manifest.json"
DEFAULT_OUT_DIR = ROOT / "atlases"

DEFAULT_CHARS = (
    "ABCDEFG"
    "0123456789"
    "abcdefghijklmnopqrstuvwxyz"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "♭♯♮#bΔ△∆ø°+-−()/,. "
    "\U0001D10B\U0001D10C\U0001D10E\U0001D10F\U0001D110\U0001D1A9"
    "\uE870\uE871\uE872\uE873\uE874\uE875\uE876\uE877\uE878\uE879\uE87A\uE87B\uE87C"
    "\uF4D7\uF4D8\uF4D9\uF4DA\uF4DB\uF4DC\uF4DD\uF4DE\uF4DF\uF4E0\uF4E1\uF4E2"
)


def read_text_file(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def unique_chars(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        for char in value:
            if char not in seen:
                seen.add(char)
                result.append(char)
    return result


def safe_id(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def get_name(font: TTFont, name_id: int) -> str:
    names = font["name"].names if "name" in font else []
    for record in names:
        if record.nameID != name_id:
            continue
        try:
            value = record.toUnicode().strip()
        except UnicodeDecodeError:
            continue
        if value:
            return value
    return ""


def glyph_to_path(font: TTFont, glyph_set, glyph_name: str) -> tuple[str, list[float] | None]:
    glyph = glyph_set[glyph_name]

    path_pen = SVGPathPen(glyph_set)
    glyph.draw(path_pen)
    path_data = path_pen.getCommands()

    bounds_pen = BoundsPen(glyph_set)
    glyph.draw(bounds_pen)
    bounds = bounds_pen.bounds
    bbox = [float(value) for value in bounds] if bounds else None

    return path_data, bbox


def build_atlas(font_path: Path, font_id: str, label: str, chars: list[str]) -> dict:
    font = TTFont(font_path)
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap() or {}
    units_per_em = int(font["head"].unitsPerEm)
    ascent = int(font["hhea"].ascent)
    descent = int(font["hhea"].descent)

    atlas = {
        "id": font_id,
        "label": label,
        "source": str(font_path.relative_to(ROOT)).replace("\\", "/"),
        "fontFamily": get_name(font, 1),
        "fullName": get_name(font, 4),
        "unitsPerEm": units_per_em,
        "ascent": ascent,
        "descent": descent,
        "glyphs": {},
        "missing": [],
    }

    for char in chars:
        codepoint = ord(char)
        glyph_name = cmap.get(codepoint)
        if not glyph_name:
            atlas["missing"].append({"char": char, "unicode": f"U+{codepoint:04X}"})
            continue

        path_data, bbox = glyph_to_path(font, glyph_set, glyph_name)
        atlas["glyphs"][char] = {
            "unicode": f"U+{codepoint:04X}",
            "glyphName": glyph_name,
            "advance": float(glyph_set[glyph_name].width),
            "bbox": bbox,
            "path": path_data,
        }

    return atlas


def write_atlas(atlas: dict, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / f"{atlas['id']}.json"
    js_path = output_dir / f"{atlas['id']}.js"
    payload = json.dumps(atlas, ensure_ascii=False, indent=2)
    json_path.write_text(payload + "\n", encoding="utf-8")

    compact_payload = json.dumps(atlas, ensure_ascii=False, separators=(",", ":"))
    js = (
        "window.__sharpElevenSvgFontAtlases = window.__sharpElevenSvgFontAtlases || {};\n"
        f"window.__sharpElevenSvgFontAtlases[{json.dumps(atlas['id'])}] = {compact_payload};\n"
    )
    js_path.write_text(js, encoding="utf-8")


def load_manifest(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_font_entries(manifest: dict, requested_ids: list[str]) -> list[dict]:
    fonts = manifest.get("fonts", [])
    if not requested_ids:
        return fonts

    requested = set(requested_ids)
    selected = [font for font in fonts if font.get("id") in requested]
    missing = sorted(requested - {font.get("id") for font in selected})
    if missing:
        raise SystemExit(f"Unknown font id(s): {', '.join(missing)}")
    return selected


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate SVG glyph atlases for the Sharp Eleven chart renderer experiments."
    )
    parser.add_argument("--manifest", type=Path, default=MANIFEST_PATH)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--font-id", action="append", default=[], help="Generate only this manifest font id.")
    parser.add_argument("--chars", default="", help="Extra characters to include.")
    parser.add_argument("--chars-file", type=Path, default=ROOT / "accords test.txt")
    args = parser.parse_args()

    manifest_path = args.manifest.resolve()
    manifest = load_manifest(manifest_path)
    test_chars = read_text_file(args.chars_file.resolve() if args.chars_file else Path())
    chars = unique_chars([DEFAULT_CHARS, test_chars, args.chars])
    output_dir = args.out.resolve()

    for entry in resolve_font_entries(manifest, args.font_id):
        font_id = entry.get("id") or safe_id(entry.get("label") or Path(entry.get("path", "")).stem)
        font_path = (ROOT / entry["path"]).resolve()
        if not font_path.exists():
            print(f"Skip missing font: {font_id} -> {font_path}")
            continue

        atlas = build_atlas(font_path, font_id, entry.get("label") or font_id, chars)
        write_atlas(atlas, output_dir)
        print(
            f"{font_id}: {len(atlas['glyphs'])} glyphs, "
            f"{len(atlas['missing'])} missing -> {output_dir / (font_id + '.json')}"
        )


if __name__ == "__main__":
    main()
