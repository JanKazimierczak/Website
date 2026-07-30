from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path("/Users/jankazimierczak/Jan/website")
OUT = ROOT / "bikepack-assets/bikepack-stakeholder-analysis.png"

W = 1800
H = 1100
BG = "#FAF6EE"
INK = "#243243"
MUTED = "#64748B"
LINE = "#44515F"

PRIMARY = "#DCE8FA"
SECONDARY = "#FCEBC8"
TERTIARY = "#DBF0E2"
NEED = "#F5EADA"


FONT_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def f(path: str, size: int):
    return ImageFont.truetype(path, size)


label_font = f(FONT_BOLD, 28)
title_font = f(FONT_BOLD, 54)
node_title = f(FONT_BOLD, 24)
node_text_large = f(FONT_BOLD, 32)
node_text_medium = f(FONT_BOLD, 27)
node_sub = f(FONT_REG, 18)


def center_text(draw, box, text, font, fill, spacing=8):
    x1, y1, x2, y2 = box
    bbox = draw.multiline_textbbox((0, 0), text, font=font, spacing=spacing, align="center")
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = x1 + (x2 - x1 - tw) / 2
    ty = y1 + (y2 - y1 - th) / 2
    draw.multiline_text((tx, ty), text, font=font, fill=fill, spacing=spacing, align="center")


def node(draw, box, fill, eyebrow, text, subtext=None, radius=40, text_font=None):
    text_font = text_font or node_text_large
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=LINE, width=6)
    x1, y1, x2, y2 = box
    draw.text((x1 + 28, y1 + 24), eyebrow.upper(), font=node_title, fill=MUTED)
    text_bottom = y2 - 62 if subtext else y2 - 24
    center_text(draw, (x1 + 28, y1 + 62, x2 - 28, text_bottom), text, text_font, INK, spacing=6)
    if subtext:
        center_text(draw, (x1 + 28, y2 - 56, x2 - 28, y2 - 14), subtext, node_sub, MUTED, spacing=4)


def connect(draw, points):
    draw.line(points, fill=LINE, width=7, joint="curve")


def main():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    primary_box = (470, 110, 1330, 280)
    need_box = (470, 365, 1330, 595)
    sec_left = (60, 415, 420, 575)
    sec_right = (1380, 415, 1740, 575)
    ter_left = (170, 730, 620, 895)
    ter_right = (1180, 730, 1630, 895)

    connect(draw, [(900, 280), (900, 365)])
    connect(draw, [(470, 520), (446, 520), (420, 495)])
    connect(draw, [(1330, 520), (1356, 520), (1380, 495)])
    connect(draw, [(720, 595), (660, 665), (520, 730)])
    connect(draw, [(1080, 595), (1140, 665), (1280, 730)])

    node(
        draw,
        primary_box,
        PRIMARY,
        "Primary",
        "Praxis I and\nEngineering Science students",
        radius=80,
        text_font=node_text_large,
    )
    node(
        draw,
        need_box,
        NEED,
        "Core design need",
        "Move the backpack load from the rider\nto the bicycle without making the ride worse",
        radius=92,
        text_font=node_text_large,
    )
    node(
        draw,
        sec_left,
        SECONDARY,
        "Secondary",
        "Toronto drivers",
        radius=48,
        text_font=node_text_medium,
    )
    node(
        draw,
        sec_right,
        SECONDARY,
        "Secondary",
        "Other Toronto\nBike Share users",
        radius=48,
        text_font=node_text_medium,
    )
    node(
        draw,
        ter_left,
        TERTIARY,
        "Tertiary",
        "Government of Ontario",
        radius=48,
        text_font=node_text_medium,
    )
    node(
        draw,
        ter_right,
        TERTIARY,
        "Tertiary",
        "Toronto Bike Share",
        radius=48,
        text_font=node_text_medium,
    )

    img.save(OUT, format="PNG")
    print(OUT)


if __name__ == "__main__":
    main()
