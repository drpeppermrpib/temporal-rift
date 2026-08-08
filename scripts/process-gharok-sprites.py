"""Remove light backgrounds, trim, and pack Gharok sprites for the game."""
from PIL import Image
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, 'assets', 'gharok')
# Keep originals from generation under _raw if not already
RAW_DIR = os.path.join(SRC_DIR, '_raw')


def process(src, dst, size=512):
    im = Image.open(src).convert('RGBA')
    px = im.load()
    w, h = im.size
    samples = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3],
               px[10, 10], px[w - 11, 10]]
    br = sum(s[0] for s in samples) // len(samples)
    bg = sum(s[1] for s in samples) // len(samples)
    bb = sum(s[2] for s in samples) // len(samples)
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            dr, dg, db = abs(r - br), abs(g - bg), abs(b - bb)
            dist = (dr * dr + dg * dg + db * db) ** 0.5
            mx = max(r, g, b)
            mn = min(r, g, b)
            is_light_neutral = mx >= 230 and (mx - mn) <= 18
            is_soft_bg = mx >= 210 and (mx - mn) <= 12 and dist < 40
            if dist < 22 or is_light_neutral or is_soft_bg:
                opx[x, y] = (0, 0, 0, 0)
            elif dist < 45:
                alpha = int(255 * (dist - 22) / 23)
                opx[x, y] = (r, g, b, alpha)
            else:
                opx[x, y] = (r, g, b, 255)
    bbox = out.getbbox()
    if not bbox:
        raise SystemExit('empty after key: ' + src)
    pad = 8
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(w, r + pad)
    b = min(h, b + pad)
    cropped = out.crop((l, t, r, b))
    cw, ch = cropped.size
    scale = min(size / cw, size / ch)
    nw, nh = max(1, int(cw * scale)), max(1, int(ch * scale))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    # Bias feet toward bottom of frame for consistent ground anchor
    canvas.paste(resized, ((size - nw) // 2, size - nh - 4), resized)
    canvas.save(dst, 'PNG', optimize=True)
    c = canvas.getpixel((0, 0))
    mid = canvas.getpixel((size // 2, int(size * 0.55)))
    print(f'{os.path.basename(dst)}: {canvas.size} corner={c} midA={mid[3]} '
          f'bytes={os.path.getsize(dst)}')


def main():
    os.makedirs(RAW_DIR, exist_ok=True)
    for name in ['idle', 'windup', 'walk']:
        src = os.path.join(SRC_DIR, f'{name}.png')
        raw = os.path.join(RAW_DIR, f'{name}.png')
        if not os.path.exists(raw):
            shutil.copy2(src, raw)
        process(raw, src, 512)
    # sync into www for Capacitor
    www = os.path.join(ROOT, 'www', 'assets', 'gharok')
    os.makedirs(www, exist_ok=True)
    for name in ['idle', 'windup', 'walk']:
        shutil.copy2(os.path.join(SRC_DIR, f'{name}.png'),
                     os.path.join(www, f'{name}.png'))
    print('synced to www/assets/gharok')


if __name__ == '__main__':
    main()
