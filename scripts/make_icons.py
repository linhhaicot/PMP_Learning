"""Generate PWA icons for PMLingo.

Draws a diagonal blue→indigo gradient tile with a bold "PM" wordmark and a
small book accent. Full-bleed so it renders correctly as a maskable icon
(launchers apply their own mask). Run: python3 scripts/make_icons.py
"""
from PIL import Image, ImageDraw, ImageFont

TOP = (59, 130, 246)      # --primary  #3b82f6
BOTTOM = (30, 58, 138)    # deep indigo #1e3a8a
WHITE = (241, 245, 249)


def font(size):
    for path in (
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/SFNS.ttf",
    ):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def gradient(size):
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            # Diagonal blend factor.
            t = (x + y) / (2 * (size - 1))
            px[x, y] = tuple(
                round(TOP[i] + (BOTTOM[i] - TOP[i]) * t) for i in range(3)
            )
    return img


def draw_icon(size):
    img = gradient(size)
    d = ImageDraw.Draw(img)

    # "PM" wordmark, centered in the upper-middle.
    pm = font(int(size * 0.42))
    text = "PM"
    box = d.textbbox((0, 0), text, font=pm)
    tw, th = box[2] - box[0], box[3] - box[1]
    tx = (size - tw) / 2 - box[0]
    ty = size * 0.26 - box[1]
    d.text((tx, ty), text, font=pm, fill=WHITE)

    # Simple open-book accent beneath the wordmark.
    cx, by = size / 2, size * 0.74
    w, h = size * 0.34, size * 0.15
    lw = max(2, round(size * 0.012))
    # Spine.
    d.line([(cx, by - h * 0.5), (cx, by + h * 0.4)], fill=WHITE, width=lw)
    # Two page curves.
    d.line([(cx, by - h * 0.5), (cx - w * 0.5, by - h * 0.2)], fill=WHITE, width=lw)
    d.line([(cx - w * 0.5, by - h * 0.2), (cx - w * 0.5, by + h * 0.55)], fill=WHITE, width=lw)
    d.line([(cx - w * 0.5, by + h * 0.55), (cx, by + h * 0.4)], fill=WHITE, width=lw)
    d.line([(cx, by - h * 0.5), (cx + w * 0.5, by - h * 0.2)], fill=WHITE, width=lw)
    d.line([(cx + w * 0.5, by - h * 0.2), (cx + w * 0.5, by + h * 0.55)], fill=WHITE, width=lw)
    d.line([(cx + w * 0.5, by + h * 0.55), (cx, by + h * 0.4)], fill=WHITE, width=lw)

    return img


OUT = "public"
for size, name in [(192, "pwa-192x192.png"), (512, "pwa-512x512.png"), (180, "apple-touch-icon.png")]:
    draw_icon(size).save(f"{OUT}/{name}")
    print(f"wrote {OUT}/{name}")
