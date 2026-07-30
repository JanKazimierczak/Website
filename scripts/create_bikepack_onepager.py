from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.platypus import Frame, Paragraph


ROOT = Path("/Users/jankazimierczak/Jan/website")
FIG_DIR = ROOT / "bikepack-assets"
OUT = ROOT / "output/pdf/bikepack_buddy_report_aligned_one_pager.pdf"

PAGE_W, PAGE_H = letter

BG = colors.HexColor("#F8F0E2")
INK = colors.HexColor("#262626")
BODY = colors.HexColor("#464646")
ACCENT = colors.HexColor("#D8B78B")
ACCENT_DARK = colors.HexColor("#9A6D39")
LINE = colors.HexColor("#DBC8AD")


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="BodyCopy",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.6,
        leading=13.2,
        textColor=BODY,
        alignment=TA_LEFT,
        spaceAfter=0,
    )
)
styles.add(
    ParagraphStyle(
        name="BulletCopy",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.3,
        leading=12.8,
        leftIndent=10,
        bulletIndent=0,
        textColor=BODY,
        spaceAfter=0,
    )
)
styles.add(
    ParagraphStyle(
        name="MiniLabel",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=9,
        textColor=colors.HexColor("#7A7A7A"),
        tracking=1.2,
        spaceAfter=0,
    )
)


def fig(name: str) -> str:
    return str(FIG_DIR / name)


def draw_bg(c: canvas.Canvas) -> None:
    c.setFillColor(BG)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)


def label(c: canvas.Canvas, x: float, y: float, text: str, size: float = 8.5) -> None:
    c.setFont("Helvetica-Bold", size)
    c.setFillColor(colors.HexColor("#7A7A7A"))
    c.drawString(x, y, text.upper())


def heading(c: canvas.Canvas, x: float, y: float, text: str, size: float = 28) -> None:
    c.setFont("Times-Bold", size)
    c.setFillColor(INK)
    c.drawString(x, y, text)


def pill(c: canvas.Canvas, x: float, y: float, w: float, h: float, text: str) -> None:
    c.setFillColor(ACCENT)
    c.roundRect(x, y, w, h, h / 2, fill=1, stroke=0)
    c.setFillColor(ACCENT_DARK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x + 10, y + h / 2 - 3, text)


def paragraph(c: canvas.Canvas, x: float, y: float, w: float, h: float, text: str, style="BodyCopy") -> None:
    frame = Frame(x, y, w, h, showBoundary=0, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    story = [Paragraph(text, styles[style])]
    frame.addFromList(story, c)


def image_fit(c: canvas.Canvas, path: str, x: float, y: float, w: float, h: float, mode: str = "contain") -> None:
    img = ImageReader(path)
    iw, ih = img.getSize()
    scale = min(w / iw, h / ih) if mode == "contain" else max(w / iw, h / ih)
    dw = iw * scale
    dh = ih * scale
    dx = x + (w - dw) / 2
    dy = y + (h - dh) / 2
    c.drawImage(img, dx, dy, width=dw, height=dh, mask="auto")


def rule(c: canvas.Canvas, x1: float, x2: float, y: float) -> None:
    c.setStrokeColor(LINE)
    c.setLineWidth(1)
    c.line(x1, y, x2, y)


def page_one(c: canvas.Canvas) -> None:
    draw_bg(c)

    left_x = 34
    left_w = 212
    gap = 18
    right_x = left_x + left_w + gap
    right_w = PAGE_W - right_x - 34

    c.setFont("Times-Bold", 34)
    c.setFillColor(INK)
    c.drawString(left_x, PAGE_H - 70, "BIKEPACK")
    c.drawString(left_x, PAGE_H - 108, "BUDDY")
    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(BODY)
    c.drawString(left_x, PAGE_H - 138, "Toronto Bike Share backpack support")

    c.roundRect(left_x, 466, left_w, 146, 18, stroke=0, fill=0)
    image_fit(c, fig("page03_img1.jpg"), left_x + 4, 470, left_w - 8, 138, "cover")
    c.roundRect(left_x, 334, left_w, 108, 18, stroke=0, fill=0)
    image_fit(c, fig("page04_img1.png"), left_x + 4, 338, left_w - 8, 100, "cover")
    c.roundRect(left_x, 216, left_w, 96, 18, stroke=0, fill=0)
    image_fit(c, fig("page10_img1.png"), left_x + 4, 220, left_w - 8, 88, "contain")

    label(c, left_x, 194, "ESC 102")
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(INK)
    c.drawString(left_x, 168, "Praxis I showcase")
    c.setFont("Helvetica", 12)
    c.setFillColor(BODY)
    c.drawString(left_x, 146, "2026 / 04 / 08")
    c.drawString(left_x, 128, "Group 20 design report")
    paragraph(
        c,
        left_x,
        76,
        left_w,
        42,
        "Katherine Chen, Jan Kazimierczak, Danni Song",
    )

    heading(c, right_x, PAGE_H - 72, "THE OPPORTUNITY", 17)
    paragraph(
        c,
        right_x,
        PAGE_H - 170,
        right_w,
        76,
        "Toronto Bike Share riders often carry large backpacks because the standard front basket is too small. "
        "When that load stays on the rider during a forward-leaning cycling posture, the lower back takes higher stress. "
        "The project therefore focused on moving the backpack load from the rider to the bicycle.",
    )

    heading(c, right_x, PAGE_H - 174, "THE STAKEHOLDERS", 17)
    paragraph(
        c,
        right_x,
        PAGE_H - 258,
        right_w,
        70,
        "<b>Primary:</b> Praxis I and Engineering Science students.<br/>"
        "<b>Secondary:</b> Toronto drivers and other Bike Share users.<br/>"
        "<b>Tertiary:</b> Ontario road authorities and Toronto Bike Share.",
    )

    heading(c, right_x, PAGE_H - 264, "THE FINAL DESIGN", 17)
    paragraph(
        c,
        right_x,
        PAGE_H - 350,
        right_w,
        72,
        "<b>Front basket extension</b><br/>"
        "A foldable support that mounts to the existing basket, secures the backpack with straps and the bike's elastic, and stores close to laptop dimensions.",
    )
    c.roundRect(right_x, 250, right_w, 86, 18, stroke=1, fill=0)
    image_fit(c, fig("page10_img1.png"), right_x + 4, 254, right_w - 8, 78, "contain")

    heading(c, right_x, 238, "THE REQUIREMENTS", 17)
    paragraph(
        c,
        right_x,
        92,
        right_w,
        142,
        "<b>Key criteria:</b><br/>"
        "- Fit in a standard backpack<br/>"
        "- Avoid permanent deformation<br/>"
        "- Hold the bag securely<br/>"
        "- Fewer than 20 steps to use<br/>"
        "- Fewer than 30 different parts<br/>"
        "- Follow road and safety rules<br/>"
        "- Cause no visible bike damage<br/>"
        "- Keep the center of mass low",
    )
    heading(c, right_x, 92, "WHY IT WON", 17)
    paragraph(
        c,
        right_x,
        22,
        right_w,
        66,
        "The report recommends this concept because it offers the best balance of compactness, stability, and ease of use. "
        "It also uses the existing bike basket and elastics instead of demanding unrealistic power, permanent modification, or high setup effort.",
    )


def page_two(c: canvas.Canvas) -> None:
    draw_bg(c)
    left_x = 34
    left_w = 214
    gap = 18
    right_x = left_x + left_w + gap
    right_w = PAGE_W - right_x - 34

    heading(c, left_x, PAGE_H - 72, "ALTERNATIVE", 22)
    heading(c, left_x + 10, PAGE_H - 96, "DESIGNS", 22)
    pill(c, left_x, PAGE_H - 136, 118, 22, "1. Front basket")
    c.roundRect(left_x, 540, left_w, 104, 18, stroke=0, fill=0)
    image_fit(c, fig("page10_img1.png"), left_x + 2, 542, left_w - 4, 100, "contain")
    paragraph(c, left_x, 490, left_w, 40, "Attaches to the existing basket and uses buckle straps plus the bike's elastic band.", "BodyCopy")

    pill(c, left_x, 454, 172, 22, "2. Electromagnetic")
    c.roundRect(left_x, 334, left_w, 102, 18, stroke=0, fill=0)
    image_fit(c, fig("page10_img2.png"), left_x + 2, 336, left_w - 4, 98, "contain")
    paragraph(c, left_x, 284, left_w, 40, "Rejected after energy calculations showed the required battery would be impractically heavy.", "BodyCopy")

    pill(c, left_x, 250, 128, 22, "3. Rear trailer")
    c.roundRect(left_x, 132, left_w, 102, 18, stroke=0, fill=0)
    image_fit(c, fig("page11_img1.png"), left_x + 2, 134, left_w - 4, 98, "contain")
    paragraph(c, left_x, 88, left_w, 36, "Transported the bag separately from the bike, but at the cost of convenience and complexity.", "BodyCopy")

    heading(c, right_x, PAGE_H - 72, "EVALUATION CRITERIA", 20)
    paragraph(
        c,
        right_x,
        PAGE_H - 178,
        right_w,
        96,
        "The report weighted size, acceleration, angular speed, portability, steps, part count, safety compliance, bike protection, and center of mass. "
        "The critical metrics in final convergence were the ones most connected to actual commuter utility: compactness, stability, and secure load carrying.",
    )

    heading(c, right_x, PAGE_H - 192, "CONVERGENT TESTING", 20)
    paragraph(
        c,
        right_x,
        PAGE_H - 302,
        right_w,
        92,
        "<b>Calculations:</b> Maxwell-based feasibility checks ruled out the electromagnetic concept because about 1.6 kWh would be needed for 10 minutes of use.<br/>"
        "<b>Proxy tests:</b> Gyroscope and accelerometer data were gathered at about 5 +/- 1 km/h to compare stability and deformation behaviour.",
    )
    c.roundRect(right_x, 304, right_w, 82, 16, stroke=1, fill=0)
    image_fit(c, fig("page13_img1.png"), right_x + 6, 310, (right_w - 18) / 2, 70, "contain")
    image_fit(c, fig("page14_img1.png"), right_x + 12 + (right_w - 18) / 2, 310, (right_w - 18) / 2, 70, "contain")
    c.roundRect(right_x, 164, right_w, 124, 16, stroke=1, fill=0)
    image_fit(c, fig("page15_img1.png"), right_x + 6, 170, (right_w - 18) / 2, 112, "contain")
    image_fit(c, fig("page15_img2.png"), right_x + 12 + (right_w - 18) / 2, 170, (right_w - 18) / 2, 112, "contain")
    paragraph(
        c,
        right_x,
        112,
        right_w,
        70,
        "The measurement matrix and four Pugh charts made the final tradeoffs visible. The front basket extension was not best on every metric, but it provided the greatest utility on size, angular speed, and acceleration.",
    )

    c.setFillColor(colors.HexColor("#E6D1B2"))
    c.roundRect(right_x, 84, right_w, 40, 18, stroke=0, fill=1)
    paragraph(
        c,
        right_x + 12,
        94,
        right_w - 24,
        24,
        "<b>Validation:</b> Portable, bike-compatible, legally safer, and less disruptive to commuter use than the rejected alternatives.",
    )
    c.roundRect(right_x, 34, right_w, 40, 18, stroke=0, fill=1)
    paragraph(
        c,
        right_x + 12,
        44,
        right_w - 24,
        24,
        "<b>Next steps:</b> stronger prototype materials, more bag types, more road conditions, and durability testing.",
    )

    rule(c, 38, PAGE_W - 38, 24)
    c.setFont("Helvetica", 9)
    c.setFillColor(BODY)
    c.drawString(38, 10, "BikePack Buddy - report-aligned one-pager")
    c.drawRightString(PAGE_W - 38, 10, "Prepared from Group 20 - The BikePack Buddy report")


def main() -> None:
    c = canvas.Canvas(str(OUT), pagesize=letter)
    c.setTitle("BikePack Buddy - Report Aligned One-Pager")
    page_one(c)
    c.showPage()
    page_two(c)
    c.save()
    print(OUT)


if __name__ == "__main__":
    main()
