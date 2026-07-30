from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image as RLImage,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from PIL import Image as PILImage


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "radom_ww2_report_pl.pdf"
ASSET_DIR = ROOT / "radom-ww2-assets"

FONT_DIR = Path("/System/Library/Fonts/Supplemental")
FONT_FILES = {
    "TimesNewRoman": FONT_DIR / "Times New Roman.ttf",
    "TimesNewRoman-Bold": FONT_DIR / "Times New Roman Bold.ttf",
    "TimesNewRoman-Italic": FONT_DIR / "Times New Roman Italic.ttf",
    "TimesNewRoman-BoldItalic": FONT_DIR / "Times New Roman Bold Italic.ttf",
}

FONT_REGULAR = "TimesNewRoman"
FONT_BOLD = "TimesNewRoman-Bold"
FONT_ITALIC = "TimesNewRoman-Italic"


def register_fonts() -> None:
    for name, path in FONT_FILES.items():
        pdfmetrics.registerFont(TTFont(name, str(path)))
    pdfmetrics.registerFontFamily(
        FONT_REGULAR,
        normal=FONT_REGULAR,
        bold=FONT_BOLD,
        italic=FONT_ITALIC,
        boldItalic="TimesNewRoman-BoldItalic",
    )


def build_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "eyebrow": ParagraphStyle(
            "Eyebrow",
            parent=base["Normal"],
            fontName=FONT_BOLD,
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#374151"),
            alignment=TA_CENTER,
            spaceAfter=14,
        ),
        "title": ParagraphStyle(
            "Title",
            parent=base["Title"],
            fontName=FONT_BOLD,
            fontSize=24,
            leading=29,
            textColor=colors.HexColor("#111827"),
            alignment=TA_CENTER,
            spaceAfter=12,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=base["Normal"],
            fontName=FONT_REGULAR,
            fontSize=11.5,
            leading=15.5,
            textColor=colors.HexColor("#374151"),
            alignment=TA_CENTER,
            spaceAfter=18,
        ),
        "h1": ParagraphStyle(
            "Heading1",
            parent=base["Heading1"],
            fontName=FONT_BOLD,
            fontSize=15.6,
            leading=19,
            textColor=colors.HexColor("#111827"),
            spaceBefore=13,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "Heading2",
            parent=base["Heading2"],
            fontName=FONT_BOLD,
            fontSize=12.2,
            leading=15,
            textColor=colors.HexColor("#1F2937"),
            spaceBefore=9,
            spaceAfter=5,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=10.4,
            leading=14.5,
            alignment=TA_LEFT,
            textColor=colors.HexColor("#111827"),
            spaceAfter=6,
        ),
        "body_bold": ParagraphStyle(
            "BodyBold",
            parent=base["BodyText"],
            fontName=FONT_BOLD,
            fontSize=10.4,
            leading=14.5,
            textColor=colors.HexColor("#111827"),
            spaceAfter=6,
        ),
        "small": ParagraphStyle(
            "Small",
            parent=base["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor("#1F2937"),
            spaceAfter=4,
        ),
        "small_url": ParagraphStyle(
            "SmallURL",
            parent=base["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=7.8,
            leading=10.2,
            textColor=colors.HexColor("#1F2937"),
            wordWrap="CJK",
            spaceAfter=3,
        ),
        "caption": ParagraphStyle(
            "Caption",
            parent=base["BodyText"],
            fontName=FONT_ITALIC,
            fontSize=8.2,
            leading=10.5,
            textColor=colors.HexColor("#4B5563"),
            alignment=TA_CENTER,
            spaceBefore=4,
            spaceAfter=6,
        ),
        "figure_caption": ParagraphStyle(
            "FigureCaption",
            parent=base["BodyText"],
            fontName=FONT_ITALIC,
            fontSize=8.2,
            leading=10.5,
            textColor=colors.HexColor("#374151"),
            alignment=TA_LEFT,
            spaceBefore=5,
            spaceAfter=2,
        ),
        "box": ParagraphStyle(
            "Box",
            parent=base["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=9.8,
            leading=13.1,
            textColor=colors.HexColor("#111827"),
            leftIndent=0,
            rightIndent=0,
            spaceAfter=5,
        ),
        "quote": ParagraphStyle(
            "Quote",
            parent=base["BodyText"],
            fontName=FONT_ITALIC,
            fontSize=9.4,
            leading=13,
            leftIndent=12,
            rightIndent=8,
            textColor=colors.HexColor("#374151"),
            spaceBefore=4,
            spaceAfter=6,
        ),
        "toc": ParagraphStyle(
            "TOC",
            parent=base["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=10.4,
            leading=14.6,
            textColor=colors.HexColor("#111827"),
            spaceAfter=3,
        ),
        "footer": ParagraphStyle(
            "Footer",
            parent=base["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=7.5,
            leading=9,
            textColor=colors.HexColor("#4B5563"),
            alignment=TA_RIGHT,
        ),
    }


def P(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(text, style)


def bullet_list(items: list[str], styles: dict[str, ParagraphStyle]) -> ListFlowable:
    return ListFlowable(
        [
            ListItem(P(item, styles["body"]), leftIndent=8, bulletColor=colors.HexColor("#4B5563"))
            for item in items
        ],
        bulletType="bullet",
        start="circle",
        leftIndent=15,
        bulletFontName=FONT_REGULAR,
        bulletFontSize=8,
        spaceBefore=2,
        spaceAfter=6,
    )


def info_box(title: str, body: list[str], styles: dict[str, ParagraphStyle], fill: str = "#F3F7FA"):
    rows = [[P(f"<b>{title}</b>", styles["body_bold"])]]
    rows += [[P(text, styles["box"])] for text in body]
    table = Table(rows, colWidths=[16.2 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(fill)),
                ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#A3A3A3")),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def source_tag(n: int) -> str:
    return f"<font color='#4B5563'>[{n}]</font>"


def scaled_image(filename: str, max_width_cm: float, max_height_cm: float) -> RLImage:
    path = ASSET_DIR / filename
    with PILImage.open(path) as im:
        width_px, height_px = im.size
    max_width = max_width_cm * cm
    max_height = max_height_cm * cm
    scale = min(max_width / width_px, max_height / height_px)
    return RLImage(str(path), width=width_px * scale, height=height_px * scale)


def figure_table(
    filename: str,
    caption: str,
    credit: str,
    styles: dict[str, ParagraphStyle],
    width_cm: float = 16.2,
    max_height_cm: float = 8.2,
):
    img = scaled_image(filename, width_cm - 0.2, max_height_cm)
    return Table(
        [[img], [P(f"<b>{caption}</b><br/>{credit}", styles["figure_caption"])]],
        colWidths=[width_cm * cm],
        hAlign="CENTER",
    )


def figure(
    filename: str,
    caption: str,
    credit: str,
    styles: dict[str, ParagraphStyle],
    width_cm: float = 16.2,
    max_height_cm: float = 8.2,
):
    table = figure_table(filename, caption, credit, styles, width_cm, max_height_cm)
    table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#B5B5B5")),
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("ALIGN", (0, 0), (0, 0), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return KeepTogether([Spacer(1, 4), table, Spacer(1, 7)])


def figure_pair(
    left: tuple[str, str, str],
    right: tuple[str, str, str],
    styles: dict[str, ParagraphStyle],
    max_height_cm: float = 6.0,
):
    left_table = figure_table(left[0], left[1], left[2], styles, width_cm=7.9, max_height_cm=max_height_cm)
    right_table = figure_table(right[0], right[1], right[2], styles, width_cm=7.9, max_height_cm=max_height_cm)
    for nested in (left_table, right_table):
        nested.setStyle(
            TableStyle(
                [
                    ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#B5B5B5")),
                    ("ALIGN", (0, 0), (0, 0), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
    table = Table([[left_table, right_table]], colWidths=[8.05 * cm, 8.05 * cm], hAlign="CENTER")
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    return table


def make_timeline(styles: dict[str, ParagraphStyle]) -> Table:
    rows = [
        ["Data", "Wydarzenie"],
        ["1 IX 1939", "Pierwsze naloty Luftwaffe na Radom; początek wojny i dezorganizacji życia miasta. [2][4][12]"],
        ["8 IX 1939", "Wejście wojsk niemieckich do Radomia. [2][4][12]"],
        ["26 X 1939", "Powstanie Generalnego Gubernatorstwa; Radom stał się stolicą dystryktu radomskiego. [3][4]"],
        ["4 IV 1940", "Pierwsza masowa egzekucja na Firleju: 145 chłopów rozstrzelanych w odwecie za pomoc oddziałowi mjr. Henryka Dobrzańskiego \"Hubala\". [9]"],
        ["24 I 1941", "Aresztowanie 268 osób przez SiPo w ramach Intelligenzaktion w Radomiu. [2]"],
        ["3-7 IV 1941", "Utworzenie i zamknięcie dwóch części getta radomskiego: śródmiejskiej i glinickiej. [6][12]"],
        ["II-IV 1942", "Egzekucje i aresztowania wśród radomskich Żydów, w tym akcje określane jako \"krwawy czwartek\" i \"krwawa środa\". [5]"],
        ["5 VIII 1942", "Likwidacja małego getta na Glinicach i deportacje do Treblinki. [5][6]"],
        ["16-19 VIII 1942", "Likwidacja dużego getta; masowe mordy na miejscu i deportacje do Treblinki. [5][6]"],
        ["12-15 X 1942", "Publiczne egzekucje odwetowe po dekonspiracji produkcji broni dla podziemia; łącznie 50 ofiar. [2][10][12]"],
        ["6 XI 1943", "Likwidacja obozu przy ul. Szwarlikowskiej i przenoszenie więźniów na ul. Szkolną. [7][8]"],
        ["14-15 VIII 1944", "Pacyfikacja pobliskiej Podsuliszki za pomoc partyzantom; zginęło 19 mężczyzn i 2 kobiety. [14]"],
        ["1 XI 1944", "Według RGO w Radomiu przebywało ok. 3,5 tys. wysiedlonych warszawiaków, a w powiecie radomskim ok. 4 tys. [13]"],
        ["15-16 I 1945", "Walki o miasto i zajęcie Radomia przez Armię Czerwoną; koniec okupacji niemieckiej. [2][4][12]"],
    ]
    table_rows = [[P(cell, styles["small"] if i else styles["body_bold"]) for cell in row] for i, row in enumerate(rows)]
    table = Table(table_rows, colWidths=[3.05 * cm, 13.15 * cm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3B4652")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D1D5DB")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#FAFAF7")),
            ]
        )
    )
    return table


def draw_page(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setStrokeColor(colors.HexColor("#B7BCC4"))
    canvas.setLineWidth(0.5)
    canvas.line(2 * cm, height - 1.35 * cm, width - 2 * cm, height - 1.35 * cm)
    canvas.line(2 * cm, 1.35 * cm, width - 2 * cm, 1.35 * cm)
    canvas.setFont(FONT_REGULAR, 7.8)
    canvas.setFillColor(colors.HexColor("#374151"))
    canvas.drawString(2 * cm, height - 1.02 * cm, "RAPORT INFORMACYJNY")
    canvas.drawCentredString(width / 2, height - 1.02 * cm, "Radom i okolice podczas II wojny światowej")
    canvas.drawRightString(width - 2 * cm, 0.95 * cm, f"strona {doc.page}")
    canvas.restoreState()


def add_source_section(story: list, styles: dict[str, ParagraphStyle]) -> None:
    sources = [
        ("[1] Instytut Pamięci Narodowej, Sebastian Piątkowski, Radom w latach wojny i okupacji niemieckiej (1939-1945), opis monografii, 2018.", "https://radom.ipn.gov.pl/rad/publikacje/ksiazki-radom/184207,Radom-w-latach-wojny-i-okupacji-niemieckiej-19391945.html"),
        ("[2] Miasto Radom, Historia Radomia: II wojna światowa.", "https://www.miasto.radom.pl/informacje,historia,ii-wojna-swiatowa"),
        ("[3] Encyklopedia PWN, Generalne Gubernatorstwo.", "https://encyklopedia.pwn.pl/haslo/Generalne-Gubernatorstwo;3904740.html"),
        ("[4] POLIN / Virtual Shtetl, Radom - local history.", "https://sztetl.org.pl/en/towns/r/601-radom/96-local-history/67672-local-history"),
        ("[5] POLIN / Virtual Shtetl, Radom - history of the Jewish community.", "https://sztetl.org.pl/en/towns/r/601-radom/99-history/137920-history-of-community"),
        ("[6] POLIN / Virtual Shtetl, Ghetto in Radom.", "https://sztetl.org.pl/en/towns/r/601-radom/116-sites-of-martyrdom/49970-ghetto-radom"),
        ("[7] Szlak Pamięci Żydów Radomskich \"Ślad\", Obóz pracy przy ul. Szwarlikowskiej.", "https://www.szlakpamieci.radom.pl/index.php/oboz-pracy-przy-ul-szwalikowskiej.html"),
        ("[8] Szlak Pamięci Żydów Radomskich \"Ślad\", Obóz pracy przy ul. Szkolnej.", "https://www.szlakpamieci.radom.pl/index.php/oboz-pracy-przy-ul-szkolnej.html"),
        ("[9] Miasto Radom, Uczczono pamięć ofiar masowych egzekucji na Firleju, 2024.", "https://www.radom.pl/aktualnosci/uczczono-pamiec-ofiar-masowych-egzekucji-na-firleju/"),
        ("[10] Miasto Radom, Uczczono pamięć pomordowanych pracowników Fabryki Broni, 2025.", "https://www.radom.pl/aktualnosci/uczczono-pamiec-pomordowanych-pracownikow-fabryki-broni/"),
        ("[11] Mazowiecki Urząd Wojewódzki, Fabryka Broni w Radomiu świętuje 95 lat istnienia.", "https://www.gov.pl/web/uw-mazowiecki/fabryka-broni-w-radomiu-swietuje-95-lat-istnienia"),
        ("[12] Ewa Kutyła, Radomskie miejsca pamięci II wojny światowej. Informator turystyczny, Gmina Miasta Radomia, 2010, rec. dr Sebastian Piątkowski.", "https://docplayer.pl/5834672-Radomskie-miejsca-pamieci-ii-wojny-swiatowej.html"),
        ("[13] Muzeum Dulag 121, Transporty z obozu Dulag 121.", "https://dulag121.pl/encyklopediaa/transporty-z-obozu-dulag-121/"),
        ("[14] Gość Radomski, Uroczyste obchody 76. rocznicy pacyfikacji wsi Podsuliszka, 2020.", "https://radom.gosc.pl/doc/6474063.Uroczyste-obchody-76-rocznicy-pacyfikacji-wsi-Podsuliszka"),
        ("[15] Portal gov.pl, Gmina Wierzbica, Sołectwo Suliszka.", "https://samorzad.gov.pl/web/maz-wierzbica/solectwo-suliszka"),
        ("[16] Miasto Radom, Obchody Dnia Pamięci Ofiar Zbrodni Katyńskiej, 2024.", "https://www.radom.pl/aktualnosci/obchody-dnia-pamieci-ofiar-zbrodni-katynskiej-2/"),
        ("[17] Wikimedia Commons, File:GeneralGovernment1940Map.png, autor XrysD, CC BY-SA 4.0.", "https://commons.wikimedia.org/wiki/File:GeneralGovernment1940Map.png"),
        ("[18] Wikimedia Commons, File:Radom 1943.png.", "https://commons.wikimedia.org/wiki/File:Radom_1943.png"),
        ("[19] Wikimedia Commons, File:Getto Radom Srodmiescie.jpg, autor Mzungu, CC BY 3.0 / GFDL.", "https://commons.wikimedia.org/wiki/File:Getto_Radom_Srodmiescie.jpg"),
        ("[20] Wikimedia Commons, File:Getto Radom Glinice.jpg, autor Mzungu, CC BY 3.0 / GFDL.", "https://commons.wikimedia.org/wiki/File:Getto_Radom_Glinice.jpg"),
        ("[21] Wikimedia Commons, File:Radom Ghetto street 2.jpg.", "https://commons.wikimedia.org/wiki/File:Radom_Ghetto_street_2.jpg"),
        ("[22] Wikimedia Commons / Bundesarchiv, File:Bundesarchiv Bild 183-2004-1209-503, Radom - Polen, vor dem Arbeitsamt.jpg, CC BY-SA 3.0 de.", "https://commons.wikimedia.org/wiki/File:Bundesarchiv_Bild_183-2004-1209-503,_Radom_-_Polen,_vor_dem_Arbeitsamt.jpg"),
        ("[23] Wikimedia Commons, File:Radom, siedziba Gestapo w czasie II wojny światowej.jpg.", "https://commons.wikimedia.org/wiki/File:Radom,_siedziba_Gestapo_w_czasie_II_wojny_%C5%9Bwiatowej.jpg"),
        ("[24] Wikimedia Commons, File:Cmentarz na Firleju w Radomiu - Mauzoleum 01.JPG.", "https://commons.wikimedia.org/wiki/File:Cmentarz_na_Firleju_w_Radomiu_-_Mauzoleum_01.JPG"),
        ("[25] OpenStreetMap contributors, kafle mapy OSM wykorzystane do mapy lokalizacyjnej Radom - Suliszka, ODbL.", "https://www.openstreetmap.org/copyright"),
    ]
    story.append(P("Źródła i uwagi o wiarygodności", styles["h1"]))
    story.append(P(
        "Raport opiera się przede wszystkim na publikacjach IPN, materiałach POLIN/Virtual Shtetl, "
        "oficjalnych stronach miasta Radomia i samorządu oraz na opracowaniu miejsc pamięci wydanym "
        "przez Gminę Miasta Radomia. Przy liczbach ofiar użyto ostrożnych sformułowań, ponieważ "
        "źródła lokalne podają czasem zakresy lub wartości przybliżone. Ilustracje pochodzą z "
        "Wikimedia Commons i z kafli OpenStreetMap, z opisaniem źródeł przy podpisach oraz w wykazie.",
        styles["body"],
    ))
    for label, url in sources:
        story.append(P(label, styles["small_url"]))
        story.append(P(url, styles["small_url"]))


def build_report() -> None:
    register_fonts()
    styles = build_styles()
    OUT.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        rightMargin=2.2 * cm,
        leftMargin=2.2 * cm,
        topMargin=2.05 * cm,
        bottomMargin=1.8 * cm,
        title="Wpływ II wojny światowej na Radom i okolice",
        author="OpenAI Codex",
    )

    story = []
    story.append(Spacer(1, 1.55 * cm))
    story.append(P("RAPORT INFORMACYJNY", styles["eyebrow"]))
    story.append(P("Wpływ II wojny światowej na Radom i okolice", styles["title"]))
    story.append(P(
        "Okupacja niemiecka, Zagłada Żydów radomskich, terror wobec ludności polskiej, praca przymusowa, "
        "konspiracja, Suliszka i zaplecze regionalne. Wersja z mapami i fotografiami źródłowymi.",
        styles["subtitle"],
    ))
    story.append(Spacer(1, 0.55 * cm))
    story.append(info_box(
        "Zakres raportu",
        [
            "Temat jest bardzo szeroki: pełna, monograficzna historia Radomia w latach 1939-1945 obejmuje setki stron. Ten raport syntetyzuje najważniejsze, źródłowo potwierdzone obszary wpływu wojny na miasto i jego okolice.",
            "Suliszka została dodana jako osobny wątek regionalny, ponieważ jest wsią w powiecie radomskim, a nie częścią miasta Radomia.",
            "Mapy i fotografie pochodzą z internetu, przede wszystkim z Wikimedia Commons oraz OpenStreetMap; każda ilustracja ma podpis z kredytem źródłowym.",
        ],
        styles,
        fill="#F7F7F2",
    ))
    story.append(Spacer(1, 0.5 * cm))
    story.append(P("Opracowano: 2 maja 2026", styles["caption"]))
    story.append(PageBreak())

    story.append(P("Spis treści", styles["h1"]))
    toc_items = [
        "1. Najkrótsza odpowiedź: co wojna zrobiła z Radomiem",
        "2. Chronologia kluczowych wydarzeń",
        "3. Miasto przed 1939 r. i znaczenie Radomia",
        "4. Wrzesień 1939 r. i ustanowienie okupacji",
        "5. Niemiecka administracja, kontrola i przemoc",
        "6. Zagłada Żydów radomskich",
        "7. Praca przymusowa, przemysł i Fabryka Broni",
        "8. Życie codzienne, edukacja, kultura i pomoc społeczna",
        "9. Konspiracja i represje odwetowe",
        "10. Suliszka, Podsuliszka i zaplecze wiejskie Radomia",
        "11. Koniec okupacji niemieckiej i skutki po 1945 r.",
        "12. Źródła",
    ]
    for item in toc_items:
        story.append(P(item, styles["toc"]))
    story.append(PageBreak())

    story.append(P("1. Najkrótsza odpowiedź", styles["h1"]))
    story.append(P(
        "II wojna światowa zmieniła Radom z dużego, wielokulturowego ośrodka przemysłowo-administracyjnego "
        "w miasto podporządkowane niemieckiemu systemowi okupacyjnemu. Radom został zbombardowany już 1 września "
        "1939 r., zajęty przez Niemców 8 września, a po utworzeniu Generalnego Gubernatorstwa stał się stolicą "
        "jednego z jego dystryktów. Oznaczało to wyjątkowo silną obecność administracji, policji, sądownictwa i "
        "aparatu represji. " + source_tag(2) + " " + source_tag(3) + " " + source_tag(4),
        styles["body"],
    ))
    story.append(P(
        "Dla ludności polskiej wojna oznaczała egzekucje, więzienie, deportacje do obozów koncentracyjnych i na "
        "roboty, likwidację wielu instytucji społecznych, zamknięcie szkół średnich, cenzurę i przymus życia w "
        "ciągłym zagrożeniu. Dla społeczności żydowskiej oznaczała najpierw upokorzenia, konfiskaty i pracę "
        "przymusową, potem getto, a w 1942 r. masową deportację do Treblinki i wymordowanie społeczności, która "
        "przed wojną współtworzyła gospodarkę, samorząd, prasę, szkoły i kulturę miasta. " + source_tag(5) + " " + source_tag(6) + " " + source_tag(12),
        styles["body"],
    ))
    story.append(P(
        "Radom nie był tylko bierną ofiarą okupacji. Miasto było ośrodkiem konspiracji cywilnej i wojskowej. "
        "Działały struktury ZWZ-AK, Szarych Szeregów, Batalionów Chłopskich, NOW, NSZ oraz GL/AL; prowadzono tajne "
        "nauczanie, pomoc społeczną, sabotaż i wykradanie lub produkcję elementów broni. Za działalność oporu "
        "Niemcy odpowiadali terrorem, czego symbolem stały się m.in. Firlej i egzekucje pracowników Fabryki Broni. "
        + source_tag(10) + " " + source_tag(12),
        styles["body"],
    ))
    story.append(info_box(
        "Teza raportu",
        [
            "Wojna dotknęła Radom równocześnie jako miasto, społeczność i węzeł gospodarczy: zniszczyła znaczną część przedwojennej struktury społecznej, unicestwiła żydowski Radom, podporządkowała przemysł wojnie III Rzeszy, a w pamięci miasta pozostawiła sieć miejsc kaźni, getta, więzienia, konspiracji i powojennej traumy.",
        ],
        styles,
        fill="#F6F1EA",
    ))

    story.append(P("2. Chronologia kluczowych wydarzeń", styles["h1"]))
    story.append(make_timeline(styles))
    story.append(PageBreak())

    story.append(P("3. Miasto przed 1939 r. i znaczenie Radomia", styles["h1"]))
    story.append(P(
        "Radom w dwudziestoleciu międzywojennym był miastem administracyjnym i przemysłowym. W mieście działały "
        "zakłady ważne dla państwa, w tym Fabryka Broni, telefoniczna, obuwnicza, tytoniowa i gazownia. "
        "Połączenie kolejowe z Warszawą i Krakowem zwiększało znaczenie miasta jako węzła komunikacyjnego. "
        + source_tag(4),
        styles["body"],
    ))
    story.append(P(
        "Przedwojenny Radom był też miastem wielokulturowym. Żydzi stanowili około 30% mieszkańców i odgrywali "
        "ważną rolę w handlu, rzemiośle, przemyśle, samorządzie, prasie, edukacji, organizacjach społecznych i "
        "życiu politycznym. W latach międzywojennych w Radomiu ukazywały się żydowskie gazety, działały szkoły, "
        "kluby sportowe, partie i instytucje dobroczynne. " + source_tag(4) + " " + source_tag(5),
        styles["body"],
    ))
    story.append(P(
        "Ta struktura ma znaczenie dla zrozumienia skutków wojny. Niemiecka okupacja nie tylko zabiła ludzi i "
        "przejęła majątek; przerwała codzienne sieci społeczne: szkoły, zakłady pracy, stowarzyszenia, prasę, "
        "instytucje pomocy, samorząd i sąsiedztwa tworzone przez Polaków i Żydów.",
        styles["body"],
    ))

    story.append(P("4. Wrzesień 1939 r. i ustanowienie okupacji", styles["h1"]))
    story.append(P(
        "Radom został zaatakowany już pierwszego dnia wojny. Źródła miejskie i POLIN wskazują, że 1 września "
        "1939 r. miasto bombardowało niemieckie lotnictwo. 6 września lokalne urzędy i instytucje opuściły "
        "miasto, a 8 września weszły do niego wojska niemieckie. " + source_tag(2) + " " + source_tag(4) + " " + source_tag(12),
        styles["body"],
    ))
    story.append(P(
        "Stacjonujący w Radomiu 72 Pułk Piechoty, część 28 Dywizji Piechoty Armii \"Łódź\", poniósł ciężkie straty "
        "w kampanii obronnej. W informatorze miejskim opisano jego późniejsze losy: ciężkie walki we wrześniu, "
        "rozbicie pułku oraz odtworzenie tradycji 72 pp w strukturach podziemnych w 1944 r. " + source_tag(2) + " " + source_tag(12),
        styles["body"],
    ))
    story.append(P(
        "Po kilku tygodniach wojskowej kontroli Wehrmachtu Radom wszedł do Generalnego Gubernatorstwa, utworzonego "
        "26 października 1939 r. na części okupowanych ziem polskich niewłączonych bezpośrednio do Rzeszy. "
        "GG miało być źródłem taniej siły roboczej, surowców, żywności i produkcji wojennej; ten model okupacji "
        "wprost określił późniejsze doświadczenie Radomia. " + source_tag(3),
        styles["body"],
    ))
    story.append(figure(
        "general_government_1940.png",
        "Mapa 1. Generalne Gubernatorstwo w 1940 r.; Radom był stolicą jednego z dystryktów.",
        "Źródło: Wikimedia Commons, autor XrysD, CC BY-SA 4.0. " + source_tag(17),
        styles,
        max_height_cm=9.1,
    ))
    story.append(figure(
        "radom_1943.png",
        "Mapa 2. Plan Radomia z 1943 r., pokazujący układ miasta w czasie okupacji.",
        "Źródło: Wikimedia Commons. " + source_tag(18),
        styles,
        max_height_cm=6.1,
    ))

    story.append(P("5. Niemiecka administracja, kontrola i przemoc", styles["h1"]))
    story.append(P(
        "Jako stolica dystryktu Radom otrzymał nadmiarową, jak na miasto tej wielkości, koncentrację urzędów "
        "i służb okupacyjnych. IPN opisuje w monografii struktury gubernatora dystryktu, starosty grodzkiego, "
        "izby gospodarczej, policji bezpieczeństwa, niemieckich jednostek wojskowych oraz podporządkowanych "
        "struktur administracji polskiej. " + source_tag(1),
        styles["body"],
    ))
    story.append(P(
        "Przemoc nie była incydentem, lecz narzędziem rządzenia. Likwidowano polskie życie kulturalne i społeczne, "
        "zamknięto szkoły średnie, w szkołach powszechnych zabroniono nauczania literatury, historii i geografii, "
        "niszczono symbole polskości i zmieniano nazwy ulic. W centrum utworzono dzielnicę przeznaczoną dla Niemców. "
        + source_tag(12),
        styles["body"],
    ))
    story.append(P(
        "Represje objęły inteligencję, duchowieństwo, lekarzy, prawników, urzędników, konspiratorów, robotników, "
        "chłopów z okolic i osoby przypadkowe. 24 stycznia 1941 r. SiPo aresztowała w Radomiu 268 osób w ramach "
        "Intelligenzaktion; wśród zatrzymanych byli m.in. księża, adwokaci, lekarze szpitala św. Kazimierza, "
        "właściciele ziemscy, wójtowie i były burmistrz. " + source_tag(2),
        styles["body"],
    ))
    story.append(figure(
        "gestapo_building.jpg",
        "Fot. 1. Budynek wskazywany jako siedziba gestapo w Radomiu w czasie II wojny światowej.",
        "Źródło: Wikimedia Commons. " + source_tag(23),
        styles,
        max_height_cm=6.5,
    ))
    story.append(P("Więzienie i Firlej", styles["h2"]))
    story.append(P(
        "Radomskie więzienie przy ul. Malczewskiego stało się jednym z głównych narzędzi terroru. Według "
        "miejskiego informatora przez więzienie przeszło ponad 18 tys. osób; większość stanowili więźniowie "
        "polityczni, członkowie podziemia albo ludzie niewinni, a nie tylko osoby skazane za przestępstwa pospolite. "
        "Więźniów wysyłano do Auschwitz, Gross-Rosen, Ravensbrück, Majdanka i innych obozów. " + source_tag(12),
        styles["body"],
    ))
    story.append(P(
        "Najbardziej symbolicznym miejscem kaźni stał się Firlej. Pierwsza masowa egzekucja odbyła się tam "
        "4 kwietnia 1940 r., gdy Niemcy rozstrzelali 145 chłopów ze wsi Gałki, Gielniów, Mechlin i Stefanków "
        "za pomoc oddziałowi mjr. Henryka Dobrzańskiego \"Hubala\". Przez prawie pięć lat przeprowadzano tam "
        "kolejne egzekucje; dokładnej liczby ofiar nie ustalono, a historycy wskazują, że mogła sięgać nawet "
        "15 tys. osób różnych narodowości i wyznań. " + source_tag(9),
        styles["body"],
    ))
    story.append(P(
        "W 1944 r. Niemcy próbowali zacierać ślady zbrodni przez niszczenie masowych grobów. Ostatnie egzekucje "
        "łączą się ze styczniem 1945 r., gdy przy końcu okupacji rozstrzelano pozostałych więźniów. " + source_tag(9) + " " + source_tag(12),
        styles["body"],
    ))
    story.append(figure(
        "firlej_mauzoleum.jpg",
        "Fot. 2. Mauzoleum na cmentarzu na Firleju, jednym z głównych miejsc pamięci ofiar okupacji w Radomiu.",
        "Źródło: Wikimedia Commons. " + source_tag(24),
        styles,
        max_height_cm=6.6,
    ))

    story.append(P("6. Zagłada Żydów radomskich", styles["h1"]))
    story.append(P(
        "Zagłada była największą i nieodwracalną zmianą społeczną, jaką wojna przyniosła Radomiowi. Przed wojną "
        "Żydzi tworzyli około jednej trzeciej mieszkańców miasta. Wiosną 1941 r., po ucieczkach, deportacjach i "
        "przesiedleniach ludności żydowskiej z innych terenów, w Radomiu znajdowało się około 32 tys. Żydów; "
        "źródła miejskie i POLIN podają dla getta około 34 tys. osób. " + source_tag(4) + " " + source_tag(5) + " " + source_tag(6),
        styles["body"],
    ))
    story.append(figure(
        "radom_ghetto_street.jpg",
        "Fot. 3. Ulica w radomskim getcie.",
        "Źródło: Wikimedia Commons. " + source_tag(21),
        styles,
        max_height_cm=6.0,
    ))
    story.append(P("Od prześladowań do getta", styles["h2"]))
    story.append(P(
        "Już przed utworzeniem getta Niemcy wprowadzali wobec Żydów przymus pracy, rabunki, konfiskaty, "
        "upokorzenia publiczne, ograniczenia przemieszczania się i obowiązek oznakowania. W grudniu 1939 r. "
        "powołano Judenrat. Na początku 1940 r. w okolicach Radomia zaczęły powstawać obozy pracy dla Żydów, "
        "a kontyngenty robotników kierowano do kolejnych miejsc pracy. " + source_tag(5) + " " + source_tag(6) + " " + source_tag(12),
        styles["body"],
    ))
    story.append(P(
        "Rozporządzenie o utworzeniu zamkniętych dzielnic mieszkaniowych wydano 3 kwietnia 1941 r.; 7 kwietnia "
        "obie części getta zostały zamknięte. Getto było \"złożone\": duże getto znajdowało się w rejonie "
        "Starego Miasta i ulicy Wałowej, a małe na Glinicach. W dużym getcie umieszczono około 25 tys. ludzi, "
        "w małym około 8 tys. " + source_tag(6) + " " + source_tag(12),
        styles["body"],
    ))
    story.append(figure_pair(
        (
            "getto_srodmiescie.jpg",
            "Mapa 3. Duże getto w rejonie śródmiejskim Radomia.",
            "Źródło: Wikimedia Commons, autor Mzungu, CC BY 3.0 / GFDL. " + source_tag(19),
        ),
        (
            "getto_glinice.jpg",
            "Mapa 4. Małe getto na Glinicach.",
            "Źródło: Wikimedia Commons, autor Mzungu, CC BY 3.0 / GFDL. " + source_tag(20),
        ),
        styles,
        max_height_cm=5.8,
    ))
    story.append(P(
        "Warunki były bardzo ciężkie: przeludnienie, głód, choroby zakaźne, sanitarna degradacja i codzienna "
        "praca przymusowa. POLIN wskazuje, że zdarzało się, iż w jednym pokoju mieszkało nawet około 15 osób; "
        "Judenrat musiał codziennie dostarczać około 1500 robotników. " + source_tag(6),
        styles["body"],
    ))
    story.append(P("Likwidacja getta", styles["h2"]))
    story.append(P(
        "W lutym i kwietniu 1942 r. Niemcy przeprowadzili akcje terroru wymierzone w działaczy i przedstawicieli "
        "instytucji żydowskich. Według POLIN 19 lutego 1942 r. podczas tzw. krwawego czwartku rozstrzelano około "
        "40 osób, a kilkadziesiąt deportowano do Auschwitz. 28 kwietnia 1942 r. podczas tzw. krwawej środy "
        "rozstrzelano około 70 osób, a kolejne deportowano. " + source_tag(5),
        styles["body"],
    ))
    story.append(P(
        "Likwidacja małego getta nastąpiła 5 sierpnia 1942 r. Niemcy i formacje pomocnicze otoczyły Glinice, "
        "wyprowadzały ludzi z mieszkań, dokonywały selekcji, biły, mordowały i ładowały ludzi do wagonów. "
        "Transport skierowano do Treblinki. " + source_tag(5) + " " + source_tag(6),
        styles["body"],
    ))
    story.append(P(
        "Duże getto likwidowano 16-19 sierpnia 1942 r. Część osób zamordowano na miejscu, w tym chorych i "
        "ukrywające się dzieci; większość wywieziono do Treblinki. Źródła podają różne szczegółowe liczby dla "
        "poszczególnych transportów, dlatego najuczciwiej mówić o dziesiątkach tysięcy ofiar i o niemal całkowitym "
        "zniszczeniu żydowskiego Radomia. " + source_tag(5) + " " + source_tag(6),
        styles["body"],
    ))
    story.append(P("Obozy pracy po likwidacji getta", styles["h2"]))
    story.append(P(
        "Po likwidacji getta w mieście pozostawiono część Żydów zdolnych do pracy. Obóz przy ul. Szwarlikowskiej "
        "działał od sierpnia 1942 r. do listopada 1943 r. i skupiał około 3,5 tys. Żydów, którzy przeżyli "
        "likwidację getta. Był zlokalizowany na fragmencie dawnego terenu getta, w zwykłej zabudowie miejskiej. "
        + source_tag(7),
        styles["body"],
    ))
    story.append(P(
        "6 listopada 1943 r. obóz przy ul. Szwarlikowskiej zlikwidowano, przenosząc część więźniów na ul. Szkolną. "
        "Od 17 stycznia 1944 r. obóz przy ul. Szkolnej przeszedł pod zarząd Deutsche Ausrüstungswerke i został "
        "określony jako oddział obozu koncentracyjnego SS w Lublinie. Więźniowie pracowali m.in. w warsztatach, "
        "w Fabryce Broni należącej do grupy Steyr-Daimler-Puch oraz przy wydobyciu torfu. " + source_tag(8),
        styles["body"],
    ))
    story.append(P(
        "W lipcu 1944 r. Niemcy likwidowali pozostałe obozy pracy. Ocalonych kierowano pieszymi konwojami na zachód; "
        "część zginęła w marszu, a ocalałych wywożono dalej, m.in. przez Tomaszów Mazowiecki do Auschwitz. " + source_tag(12),
        styles["body"],
    ))

    story.append(P("7. Praca przymusowa, przemysł i Fabryka Broni", styles["h1"]))
    story.append(P(
        "Okupacyjna gospodarka Radomia była podporządkowana wojnie III Rzeszy. PWN opisuje Generalne Gubernatorstwo "
        "jako obszar wykorzystywany do pracy przymusowej, dostaw surowców, żywności i produkcji wojennej. W Radomiu "
        "ten system był szczególnie widoczny w Fabryce Broni i w sieci warsztatów, magazynów, obozów oraz urzędów pracy. "
        + source_tag(3) + " " + source_tag(1),
        styles["body"],
    ))
    story.append(figure(
        "arbeitsamt_radom.jpg",
        "Fot. 4. Radom, ludność przed niemieckim urzędem pracy (Arbeitsamt).",
        "Źródło: Bundesarchiv / Wikimedia Commons, CC BY-SA 3.0 de. " + source_tag(22),
        styles,
        max_height_cm=5.8,
    ))
    story.append(P(
        "Fabryka Broni przed wojną zatrudniała pod koniec lat trzydziestych około 3 tys. osób i była jednym z filarów "
        "industrialnego Radomia. W czasie wojny zarząd nad nią objęła niemiecka administracja okupacyjna i przedsiębiorstwo "
        "Steyr, kontynuując produkcję militarną. " + source_tag(11),
        styles["body"],
    ))
    story.append(P(
        "Przejęcie fabryki miało kilka skutków naraz: dawało okupantowi ważną produkcję, wiązało robotników z systemem "
        "pracy pod kontrolą niemiecką, tworzyło miejsce wykorzystania więźniów i Żydów z obozu przy ul. Szkolnej, a "
        "jednocześnie stało się punktem oparcia dla konspiracji. " + source_tag(8) + " " + source_tag(10) + " " + source_tag(12),
        styles["body"],
    ))
    story.append(P(
        "Równie ważna była codzienna ekonomia przetrwania. Reglamentacja, braki żywności, przymusowe dostawy, "
        "utrata pracy, konfiskaty i kontrola niemiecka spychały mieszkańców w zależność od pomocy rodzinnej, "
        "Rady Głównej Opiekuńczej, nieformalnej wymiany oraz pracy narzuconej przez okupanta. Informator miejski "
        "wspomina m.in. kuchnię na dworcu, uruchomioną w marcu 1940 r. dla najbardziej potrzebujących. " + source_tag(12),
        styles["body"],
    ))

    story.append(P("8. Życie codzienne, edukacja, kultura i pomoc społeczna", styles["h1"]))
    story.append(P(
        "Wojna rozbiła normalne życie miejskie. Zamknięcie szkół średnich i ograniczenie programu w szkołach powszechnych "
        "uderzyło w młodzież i nauczycieli. Zakaz nauczania literatury, historii i geografii miał osłabić polską tożsamość, "
        "a nie tylko zmienić program szkolny. " + source_tag(12),
        styles["body"],
    ))
    story.append(P(
        "W odpowiedzi nauczyciele prowadzili tajne komplety, a struktury konspiracyjne i społeczne organizowały pomoc "
        "dla najuboższych. Polski Komitet Opiekuńczy działał w warunkach okupacyjnej kontroli, ale jego praca miała "
        "realne znaczenie dla rodzin pozbawionych środków, więźniów, uchodźców i osób zagrożonych głodem. " + source_tag(12),
        styles["body"],
    ))
    story.append(P(
        "Instytucje kultury przejęto albo podporządkowano Niemcom. Resursa Obywatelska stała się Deutsches Haus, czyli "
        "klubem towarzyskim dla Niemców. Stadion i obiekty sportowe przejęto wraz z majątkiem Fabryki Broni, a działalność "
        "klubów sportowych została zlikwidowana. " + source_tag(12),
        styles["body"],
    ))
    story.append(P(
        "Miasto przyjmowało też ludzi wypędzonych z innych miejsc. Po Powstaniu Warszawskim część ludności cywilnej "
        "z obozu przejściowego Dulag 121 trafiła do Radomia i powiatu. Według szacunków RGO na 1 listopada 1944 r. "
        "w Radomiu przebywało około 3,5 tys. wysiedlonych warszawiaków, a w powiecie radomskim około 4 tys. " + source_tag(13),
        styles["body"],
    ))

    story.append(P("9. Konspiracja i represje odwetowe", styles["h1"]))
    story.append(P(
        "Radom był znaczącym ośrodkiem podziemia. Działały tu m.in. Służba Zwycięstwu Polski, Polska Niepodległa, "
        "ZWZ-AK, Szare Szeregi, Bataliony Chłopskie, Narodowa Organizacja Wojskowa, Narodowe Siły Zbrojne oraz "
        "Gwardia Ludowa/Armia Ludowa. Konspiracja obejmowała wywiad, tajne nauczanie, pomoc społeczną, sabotaż, "
        "dywersję i działania zbrojne. " + source_tag(1) + " " + source_tag(12),
        styles["body"],
    ))
    story.append(P(
        "Szczególnie ważny był wątek Fabryki Broni. Pracownicy w konspiracji produkowali lub wyprowadzali elementy "
        "uzbrojenia dla Armii Krajowej. Po starciu 19 września 1942 r. na stacji w Rożkach, gdy przy żołnierzach "
        "podziemia znaleziono pistolety VIS, Niemcy przeprowadzili aresztowania i egzekucje. W dniach 12-15 października "
        "1942 r. stracono łącznie 50 osób; największa egzekucja odbyła się 14 października na terenie fabryki, gdzie "
        "powieszono 15 osób na oczach załogi i mieszkańców. " + source_tag(2) + " " + source_tag(10) + " " + source_tag(12),
        styles["body"],
    ))
    story.append(P(
        "Źródła lokalne różnią się w szczególe, czy wśród 50 ofiar było 25 czy 26 pracowników Fabryki Broni. W raporcie "
        "użyto ostrożnego sformułowania: co najmniej 25 pracowników. Sama skala represji i data egzekucji są zgodne "
        "w źródłach miejskich. " + source_tag(10) + " " + source_tag(12),
        styles["small"],
    ))
    story.append(P(
        "Inne przykłady działań zbrojnych obejmowały zamach na kino Apollo 22 listopada 1942 r. oraz atak na Deutsches "
        "Haus w Resursie Obywatelskiej 23 kwietnia 1943 r. Działania takie uderzały w niemiecką obecność w mieście, "
        "ale narażały ludność cywilną na odwet okupanta. " + source_tag(2) + " " + source_tag(12),
        styles["body"],
    ))
    story.append(P(
        "Równie ważne były mniej widowiskowe formy oporu. Harcerze z Szarych Szeregów pracujący na poczcie wykradali "
        "i niszczyli anonimy kierowane do gestapo, co mogło ratować ludzi przed aresztowaniem. Apteka Kasprzykowskich "
        "przy Rynku służyła m.in. jako punkt pomocy, składowania materiałów i kontaktu z gettem; Halina i Tadeusz "
        "Kasprzykowscy zostali aresztowani i zginęli w Auschwitz. " + source_tag(12),
        styles["body"],
    ))

    story.append(P("10. Suliszka, Podsuliszka i zaplecze wiejskie Radomia", styles["h1"]))
    story.append(info_box(
        "Dlaczego to osobny rozdział",
        [
            "Suliszka nie jest dzielnicą Radomia. To wieś w gminie Wierzbica, w powiecie radomskim. Dlatego raport ujmuje ją jako część najbliższego zaplecza regionalnego Radomia, a nie jako wydarzenie miejskie. [15]",
            "W dostępnych źródłach internetowych łatwiej potwierdzić konkretne wydarzenia dla sąsiedniej Podsuliszki niż dla samej Suliszki. Nie należy tych nazw mieszać.",
        ],
        styles,
    ))
    story.append(figure(
        "radom_suliszka_osm_locator.png",
        "Mapa 5. Położenie Suliszki względem Radomia.",
        "Źródło: opracowanie własne na podstawie kafli OpenStreetMap; dane mapy (C) OpenStreetMap contributors, ODbL. " + source_tag(25),
        styles,
        max_height_cm=7.1,
    ))
    story.append(P(
        "Wieś i okolice Radomia doświadczały okupacji inaczej niż centrum miasta, ale nie łagodniej. Na wsi szczególnie "
        "dotkliwe były rekwizycje, kontyngenty, przymus pracy, obławy, odpowiedzialność zbiorowa i ryzyko kar za pomoc "
        "partyzantom. Ten model represji był częścią polityki całego Generalnego Gubernatorstwa. " + source_tag(3) + " " + source_tag(1),
        styles["body"],
    ))
    story.append(P(
        "Suliszka leży w gminie Wierzbica, w powiecie radomskim; współczesny portal gov.pl gminy potwierdza status "
        "sołectwa i przynależność administracyjną. W raporcie nie przypisuję Suliszce konkretnej pacyfikacji bez "
        "potwierdzenia źródłowego. " + source_tag(15),
        styles["body"],
    ))
    story.append(P(
        "Źródłowo potwierdzony jest natomiast dramat pobliskiej Podsuliszki. 14 sierpnia 1944 r. Niemcy otoczyli wieś "
        "za pomoc udzielaną partyzantom, aresztowali młodych mężczyzn i cztery kobiety, przetrzymywali ich w koszarach "
        "w Modrzejowicach, a 15 sierpnia rozstrzelali część zatrzymanych w lesie. Zginęło 19 mężczyzn i 2 kobiety. "
        + source_tag(14),
        styles["body"],
    ))
    story.append(P(
        "Ten epizod pokazuje, że historia Radomia podczas wojny nie kończyła się na granicach miasta. Niemiecka kontrola "
        "miała charakter sieciowy: miasto było siedzibą dystryktu, urzędów, więzień i zakładów, a pobliskie wsie były "
        "zapleczem żywnościowym, miejscem działań partyzanckich, obław i pacyfikacji. Suliszka i Podsuliszka należą do "
        "tego samego regionalnego krajobrazu okupacji, choć trzeba zachować precyzję nazw i faktów.",
        styles["body"],
    ))

    story.append(P("11. Koniec okupacji niemieckiej i skutki po 1945 r.", styles["h1"]))
    story.append(P(
        "W drugiej połowie 1944 r. Niemcy stopniowo ewakuowali część władz dystryktu i wywozili wyposażenie instytucji "
        "oraz zakładów, w tym aparaturę medyczną ze szpitala św. Kazimierza. W styczniu 1945 r. wysłano ostatni transport "
        "więźniów z radomskiego więzienia; według informatora miejskiego transport do Auschwitz-Birkenau dotarł tylko do "
        "Częstochowy, a pozostałych więźniów rozstrzelano na Firleju. " + source_tag(12),
        styles["body"],
    ))
    story.append(P(
        "Radom został zajęty przez Armię Czerwoną 16 stycznia 1945 r. Źródła miejskie wskazują oddziały I Frontu "
        "Białoruskiego. To zakończyło okupację niemiecką, ale nie oznaczało pełnej suwerenności politycznej: w dawnych "
        "miejscach niemieckiego terroru pojawiły się po wojnie struktury NKWD i komunistycznego aparatu bezpieczeństwa, "
        "a w więzieniu przetrzymywano członków organizacji niepodległościowych. " + source_tag(2) + " " + source_tag(12),
        styles["body"],
    ))
    story.append(P("Skutki długofalowe", styles["h2"]))
    story.append(bullet_list(
        [
            "Demograficzne: unicestwienie społeczności żydowskiej Radomia i śmierć tysięcy Polaków z miasta oraz regionu.",
            "Społeczne: rozpad przedwojennych środowisk, rodzin, instytucji dobroczynnych, edukacyjnych i kulturalnych.",
            "Gospodarcze: podporządkowanie przemysłu produkcji wojennej, grabież i wywóz majątku, powojenna konieczność odbudowy zakładów i służb miejskich.",
            "Psychologiczne i pamięciowe: Firlej, getto, więzienie, siedziba gestapo, Fabryka Broni i miejsca egzekucji stały się trwałymi punktami pamięci.",
            "Polityczne: koniec okupacji niemieckiej został zastąpiony narzuconym systemem komunistycznym, który represjonował część dawnego podziemia.",
        ],
        styles,
    ))
    story.append(P(
        "Do strat radomskich należy dodać także ofiary sowieckie. W miejskich obchodach zbrodni katyńskiej wskazywano, "
        "że wśród blisko 22 tys. zamordowanych przez NKWD było około stu osób pochodzących z Radomia i co najmniej drugie "
        "tyle z regionu radomskiego. " + source_tag(16),
        styles["body"],
    ))
    story.append(P(
        "Najważniejszy wniosek jest prosty: Radom został dotknięty wojną wielowarstwowo. Nie został sprowadzony tylko "
        "do pola walki ani tylko do zaplecza przemysłowego. Był jednocześnie centrum administracji okupacyjnej, miejscem "
        "pracy przymusowej, miastem getta i deportacji, sceną terroru wobec Polaków, ośrodkiem oporu oraz punktem, przez "
        "który przechodziły losy ludzi z całego regionu.",
        styles["body"],
    ))

    story.append(PageBreak())
    add_source_section(story, styles)

    doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page)


if __name__ == "__main__":
    build_report()
    print(OUT)
