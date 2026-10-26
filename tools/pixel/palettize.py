"""Rewrites RGBA pixel-art PNGs as palette PNGs when they use 256 colours or fewer, checking every pixel survives unchanged.
usage: python tools/pixel/palettize.py assets/pixel/du-*.png"""
import sys
from PIL import Image
before = after = 0
for f in sys.argv[1:]:
    im = Image.open(f).convert('RGBA'); px = im.getdata()
    cols = {}
    for p in px:
        p = p if p[3] else (0, 0, 0, 0)
        if p not in cols:
            cols[p] = len(cols)
            if len(cols) > 256: break
    size0 = len(open(f, 'rb').read()); before += size0
    if len(cols) > 256: after += size0; print('kept', f, '(more than 256 colours)'); continue
    pal = list(cols)
    out = Image.new('P', im.size); out.putpalette([c for p in pal for c in p[:3]] + [0] * (768 - 3 * len(pal)))
    out.putdata([cols[p if p[3] else (0, 0, 0, 0)] for p in px])
    out.info['transparency'] = bytes(p[3] for p in pal)
    out.save(f, optimize=True, transparency=bytes(p[3] for p in pal))
    back = Image.open(f).convert('RGBA').getdata()
    assert all((a if a[3] else (0, 0, 0, 0)) == (b if b[3] else (0, 0, 0, 0)) for a, b in zip(px, back)), f
    after += len(open(f, 'rb').read())
print(f'{before // 1024} KB -> {after // 1024} KB')
