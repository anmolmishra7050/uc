"""
Generates assets/og-cover.png — the 1200x630 image used for link previews
(WhatsApp, Instagram, Google, X).

It is 100% original artwork drawn with code: no third-party game art.
Run:  python tools/make-og-cover.py     (needs Pillow)
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
OUT = Path(__file__).resolve().parent.parent / "assets" / "og-cover.png"

BG_TOP = (10, 12, 18)
BG_BOTTOM = (18, 21, 30)
AMBER = (255, 176, 32)
AMBER_DARK = (201, 118, 0)
WHITE = (243, 246, 252)
MUTED = (150, 160, 178)


def font(bold: bool, size: int):
    name = "arialbd.ttf" if bold else "arial.ttf"
    for base in (r"C:\Windows\Fonts", "/usr/share/fonts/truetype/dejavu", ""):
        try:
            return ImageFont.truetype(str(Path(base) / name), size)
        except OSError:
            continue
    return ImageFont.load_default(size)


def gradient(size):
    img = Image.new("RGB", size)
    d = ImageDraw.Draw(img)
    for y in range(size[1]):
        t = y / max(size[1] - 1, 1)
        d.line(
            [(0, y), (size[0], y)],
            fill=tuple(round(a + (b - a) * t) for a, b in zip(BG_TOP, BG_BOTTOM)),
        )
    return img


def glow(layer, center, radius, colour):
    halo = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    ImageDraw.Draw(halo).ellipse(
        [center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius],
        fill=colour + (120,),
    )
    layer.alpha_composite(halo.filter(ImageFilter.GaussianBlur(radius // 2)))


def coin(layer, center, radius):
    x, y = center
    d = ImageDraw.Draw(layer)
    d.ellipse([x - radius, y - radius, x + radius, y + radius],
              fill=(255, 190, 70, 255), outline=(255, 255, 255, 90), width=3)
    d.ellipse([x - radius * .72, y - radius * .72, x + radius * .72, y + radius * .72],
              outline=(170, 100, 0, 90), width=3)
    d.text((x, y), "UC", font=font(True, int(radius * .78)), fill=(42, 27, 0), anchor="mm")


def chip(d, xy, label, f):
    x, y = xy
    w = d.textlength(label, font=f) + 44
    d.rounded_rectangle([x, y, x + w, y + 56], radius=28,
                        fill=(255, 176, 32, 22), outline=(255, 176, 32, 130), width=2)
    d.text((x + 22, y + 28), label, font=f, fill=AMBER, anchor="lm")
    return w


def main():
    base = gradient((W, H)).convert("RGBA")

    # subtle grid
    grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    for x in range(0, W, 60):
        gd.line([(x, 0), (x, H)], fill=(255, 176, 32, 12))
    for y in range(0, H, 60):
        gd.line([(0, y), (W, y)], fill=(255, 176, 32, 12))
    base.alpha_composite(grid)

    glow(base, (980, 150), 260, AMBER_DARK)
    glow(base, (120, 560), 220, (255, 106, 0))

    # coins on the right
    coins = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    coin(coins, (950, 320), 132)
    coin(coins, (1120, 190), 54)
    coin(coins, (1090, 470), 40)
    base.alpha_composite(coins)

    # Draw everything translucent on a transparent layer and composite it in.
    # (ImageDraw overwrites pixels instead of blending when drawing straight
    # onto the base, which turned the chip pills solid and hid their labels.)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.text((80, 150), "UC BAZAAR", font=font(True, 86), fill=WHITE)
    d.text((80, 258), "BGMI UC Top-Up Store", font=font(True, 42), fill=AMBER)
    d.text((80, 322), "Buy UC online with UPI — delivered in 2–10 minutes.",
           font=font(False, 30), fill=MUTED)

    f = font(True, 25)
    x = 80
    for label in ("720 UC – 8100 UC", "UPI Payments", "No ID Ban"):
        x += chip(d, (x, 430), label, f) + 16

    d.text((80, 540), "ucbazzar.com", font=font(True, 28), fill=MUTED)
    base.alpha_composite(overlay)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    base.convert("RGB").save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
