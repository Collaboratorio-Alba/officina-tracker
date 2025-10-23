import json
import math
import textwrap

# --------------- CONFIGURATION -----------------
HEX_SIZE = 150  # Outer radius (center to corner) of hex
MAX_HEX_PER_ROW = 4
HEX_FONT_SIZE = 26
SVG_MARGIN_X = 90
SVG_MARGIN_Y = 90
SVG_FONT = "Arial"
SVG_WIDTH = 2100
SVG_HEIGHT = 3200

HEX_BACKGROUND = "#FFFFFF"
HEX_BORDER = "#222222"
HEX_TEXT = "#111111"
DEPENDENCY_LINE = "#777"
LEVEL_CIRCLE_R = 30
LEVEL_CIRCLE_COLOR = "#FFFFFF"
LEVEL_CIRCLE_STROKE = "#222222"
LEVEL_FONT_SIZE = 30
LEVEL_FONT_COLOR = "#222"

HEX_HEIGHT_RATIO = 2/3  # Height/Width ratio for hex; classic hex is sqrt(3)/2, here 2/3 as requested

# ------------------ GEOMETRY ------------------
def get_hex_points(x, y, size):
    # Generate flat-topped hex, 2/3 as tall as wide
    hex_w = math.sqrt(3) * size
    hex_h = HEX_HEIGHT_RATIO * hex_w
    points = []
    for i in range(6):
        angle = math.pi / 3 * i
        px = x + (hex_w / 2) * math.cos(angle)
        py = y + (hex_h / 2) * math.sin(angle)
        points.append((px, py))
    return points

def hex_position(row, col):
    hex_w = math.sqrt(3) * HEX_SIZE
    hex_h = HEX_HEIGHT_RATIO * hex_w
    horiz = 1.75 * hex_w
    vert = hex_h * 0.5  # Vertical spacing between rows
    x = SVG_MARGIN_X + col * horiz
    if row % 2 == 1:
        x += (horiz / 2)
    y = SVG_HEIGHT - SVG_MARGIN_Y - row * vert
    return x, y

def svg_text_lines(title, x, y, font_size, font_family, color):
    lines = textwrap.wrap(title, width=17)
    block = ""
    for idx, line in enumerate(lines):
        dy = (idx - (len(lines)-1)/2) * (font_size + 3)
        block += f'<text x="{x}" y="{y+dy}" text-anchor="middle" font-size="{font_size}" font-family="{font_family}" fill="{color}">{line}</text>\n'
    return block

def draw_hex(x, y, size, title, bg_color, border_color, txt_color, level):
    points = get_hex_points(x, y, size)
    points_str = " ".join(f"{px:.2f},{py:.2f}" for px, py in points)
    polygon = f'<polygon points="{points_str}" fill="{bg_color}" stroke="{border_color}" stroke-width="1.5"/>\n'
    # Level indicator circle: new formula
    top_left_x, top_left_y = points[0]
    dx = (top_left_x - x)
    # place as you described:
    circle_cx = top_left_x - dx
    circle_cy = top_left_y + dx * 0.5
    circle_svg = (
        f'<circle cx="{circle_cx}" cy="{circle_cy}" r="{LEVEL_CIRCLE_R}" fill="{LEVEL_CIRCLE_COLOR}" stroke="{LEVEL_CIRCLE_STROKE}" stroke-width="2"/>\n'
        f'<text x="{circle_cx}" y="{circle_cy+LEVEL_FONT_SIZE*0.34}" text-anchor="middle" font-size="{LEVEL_FONT_SIZE}" font-family="{SVG_FONT}" fill="{LEVEL_FONT_COLOR}">{level}</text>\n'
    )
    text = svg_text_lines(title, x, y, HEX_FONT_SIZE, SVG_FONT, txt_color)
    return polygon + circle_svg + text

# ----------- LOAD AND SORT DATA -----------------------
with open("ciclofficina_all_levels_combined.json", "r", encoding="utf-8") as f:
    data = json.load(f)

modules = []
for level in data["levels"]:
    for mod in level["modules"]:
        modules.append({
            "id": mod["id"],
            "title": mod["title"],
            "level": level["level"],
            "dependencies": [d["moduleId"] for d in mod.get("dependencies",[])]
        })

modules.sort(key=lambda m: (m["level"]))

levels = sorted(set(m["level"] for m in modules))
level_to_modules = {lvl: [] for lvl in levels}
for m in modules:
    level_to_modules[m["level"]].append(m)

xy_by_id = {}
row_of_level = {}
current_row = 0

for level in levels:
    mods = level_to_modules[level]
    row_of_level[level] = current_row
    for idx, mod in enumerate(mods):
        col = idx % MAX_HEX_PER_ROW
        row_offset = idx // MAX_HEX_PER_ROW
        row = current_row + row_offset
        x, y = hex_position(row, col)
        xy_by_id[mod["id"]] = (x, y)
    current_row += (len(mods) + MAX_HEX_PER_ROW - 1) // MAX_HEX_PER_ROW

total_rows = current_row

# ----------- GENERATE SVG --------------------
svg = [
    f'<svg xmlns="http://www.w3.org/2000/svg" width="{SVG_WIDTH}" height="{SVG_HEIGHT}" style="background:white">'
]
for mod in modules:
    x, y = xy_by_id[mod["id"]]
    svg.append(draw_hex(x, y, HEX_SIZE, mod["title"], HEX_BACKGROUND, HEX_BORDER, HEX_TEXT, mod["level"]))

svg.append("""<defs>
<marker id="arrow" markerWidth="7" markerHeight="7" refX="4" refY="3.5" orient="auto" markerUnits="strokeWidth">
  <path d="M0,0 L7,3.5 L0,7" fill="#666" />
</marker>
</defs>
""")
# for mod in modules:
    # x1, y1 = xy_by_id[mod["id"]]
    # for dep in mod["dependencies"]:
        # if dep in xy_by_id:
            # x0, y0 = xy_by_id[dep]
            # svg.append(
                # f'<line x1="{x0}" y1="{y0}" x2="{x1}" y2="{y1}" stroke="{DEPENDENCY_LINE}" stroke-width="1.2" marker-end="url(#arrow)"/>'
            # )

svg.append('</svg>')
with open("skilltree.svg", "w", encoding="utf-8") as f:
    f.write("\n".join(svg))
print("SVG skill tree written to skilltree.svg")
