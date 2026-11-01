import os
from PIL import Image

BASE_USER = r'C:/Users/nilot/.gemini/antigravity/brain/e5d2ad6b-97f0-4fc7-bf0f-35d92e781e7d/.user_uploaded/'
OUT_DIR = r'public/assets/organisms'
os.makedirs(OUT_DIR, exist_ok=True)

# Helper to check if pixel is part of the checkerboard background
def is_checkerboard(r, g, b):
    # Dark tile or slate tile or transition between them
    if r <= 56 and g <= 66 and b <= 82:
        if abs(r - g) <= 16 and (b >= r - 6) and (b >= g - 16):
            return True
    return False

def extract_and_clean(im, x0, x1, y0, y1, pad=6):
    # 1. Find non-checkerboard pixels within the region
    pts = []
    for y in range(y0, y1):
        for x in range(x0, x1):
            pix = im.getpixel((x, y))[:3]
            if not is_checkerboard(*pix):
                pts.append((x, y))
    
    if not pts:
        print(f"Warning: No foreground pixels found in ({x0},{y0})-({x1},{y1})")
        return None

    min_x, max_x = min(p[0] for p in pts), max(p[0] for p in pts)
    min_y, max_y = min(p[1] for p in pts), max(p[1] for p in pts)

    # 2. Add padding and crop
    cx0 = max(0, min_x - pad)
    cy0 = max(0, min_y - pad)
    cx1 = min(im.size[0], max_x + 1 + pad)
    cy1 = min(im.size[1], max_y + 1 + pad)

    crop = im.crop((cx0, cy0, cx1, cy1)).convert('RGBA')
    w, h = crop.size
    pixels = crop.load()

    # 3. Flood fill background from all 4 borders of the crop
    visited = set()
    queue = []
    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h - 1))
    for y in range(h):
        queue.append((0, y))
        queue.append((w - 1, y))

    while queue:
        x, y = queue.pop()
        if (x, y) in visited:
            continue
        visited.add((x, y))
        r, g, b, a = pixels[x, y]
        if is_checkerboard(r, g, b):
            pixels[x, y] = (0, 0, 0, 0)
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                    queue.append((nx, ny))

    # 4. Clean any residual background pixels near outer edges
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a > 0 and is_checkerboard(r, g, b):
                # if adjacent to transparent, clear it
                has_transparent_neighbor = False
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nx, ny = x + dx, y + dy
                    if nx < 0 or nx >= w or ny < 0 or ny >= h or pixels[nx, ny][3] == 0:
                        has_transparent_neighbor = True
                        break
                if has_transparent_neighbor:
                    pixels[x, y] = (0, 0, 0, 0)

    # 5. Tight crop to actual visible pixels
    bbox = crop.getbbox()
    if bbox:
        crop = crop.crop(bbox)

    # 6. Fit into a clean 256x256 square canvas with comfortable margin
    TARGET_SIZE = 256
    MARGIN = 16
    MAX_INNER = TARGET_SIZE - (MARGIN * 2)

    cw, ch = crop.size
    scale = min(MAX_INNER / cw, MAX_INNER / ch)
    new_w = max(1, int(round(cw * scale)))
    new_h = max(1, int(round(ch * scale)))

    resized = crop.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new('RGBA', (TARGET_SIZE, TARGET_SIZE), (0, 0, 0, 0))
    paste_x = (TARGET_SIZE - new_w) // 2
    paste_y = (TARGET_SIZE - new_h) // 2
    canvas.paste(resized, (paste_x, paste_y), resized)

    return canvas

# Specifications of all species and their locations
SPECIES_SPECS = []

# --- Batch 1 (media_1793549560851_11813bc7.png) ---
im_b1 = 'media_1793549560851_11813bc7.png'
# Row 0: algae, phytoplankton, aquatic-plant, seaweed, grass (y: 10..155)
b1_r0 = ['algae', 'phytoplankton', 'aquatic-plant', 'seaweed', 'grass']
for c, name in enumerate(b1_r0):
    SPECIES_SPECS.append((im_b1, name, int(c * 1024/5), int((c+1) * 1024/5), 10, 155))

# Row 1: oak, hazel, bracken, fungus (y: 170..285)
b1_r1 = ['oak', 'hazel', 'bracken', 'fungus']
for c, name in enumerate(b1_r1):
    SPECIES_SPECS.append((im_b1, name, int(c * 1024/5), int((c+1) * 1024/5), 170, 285))

# Row 2: zooplankton, krill, amphipod, insect-larva, snail (y: 300..415)
b1_r2 = ['zooplankton', 'krill', 'amphipod', 'insect-larva', 'snail']
for c, name in enumerate(b1_r2):
    SPECIES_SPECS.append((im_b1, name, int(c * 1024/5), int((c+1) * 1024/5), 300, 415))

# Row 3: shrimp, crab, grasshopper, caterpillar, beetle, aphid (y: 430..540)
b1_r3 = ['shrimp', 'crab', 'grasshopper', 'caterpillar', 'beetle', 'aphid']
for c, name in enumerate(b1_r3):
    SPECIES_SPECS.append((im_b1, name, int(c * 1024/6), int((c+1) * 1024/6), 430, 540))

# --- Missing from Batch 1: clover & mussel from media_1793549094002_aa291a2e.png ---
im_b0 = 'media_1793549094002_aa291a2e.png'
# clover is Row 1, Col 0 (5 cols, y: 170..285)
SPECIES_SPECS.append((im_b0, 'clover', int(0 * 1024/5), int(1 * 1024/5), 170, 285))
# mussel is Row 3, Col 2 (6 cols, y: 430..540)
SPECIES_SPECS.append((im_b0, 'mussel', int(2 * 1024/6), int(3 * 1024/6), 430, 540))

# --- Batch 2: Fish (media_1793549566349_afe549db.png) ---
im_b2 = 'media_1793549566349_afe549db.png'
b2_grid = [
    (['minnow', 'anchovy', 'herring', 'perch'], 10, 155),
    (['cod', 'pike', 'tuna', 'lanternfish'], 175, 305),
    (['shark', 'whale', 'squid', 'carp'], 330, 535)
]
for row_names, y0, y1 in b2_grid:
    for c, name in enumerate(row_names):
        SPECIES_SPECS.append((im_b2, name, c * 256, (c + 1) * 256, y0, y1))

# --- Batch 3: Birds & Mammals (media_1793549571258_70289697.png) ---
im_b3 = 'media_1793549571258_70289697.png'
b3_grid = [
    (['songbird', 'owl', 'hawk', 'osprey', 'heron'], 10, 160),
    (['seabird', 'woodpecker', 'kingfisher', 'field-mouse', 'rabbit'], 170, 320),
    (['squirrel', 'deer', 'fox', 'otter', 'seal'], 330, 540)
]
for row_names, y0, y1 in b3_grid:
    for c, name in enumerate(row_names):
        SPECIES_SPECS.append((im_b3, name, int(c * 1024/5), int((c+1) * 1024/5), y0, y1))

# --- Batch 4: Reptiles & Microbes (media_1793549576916_4652d412.png) ---
im_b4 = 'media_1793549576916_4652d412.png'
b4_r0 = ['lizard', 'frog', 'tadpole', 'snake']
for c, name in enumerate(b4_r0):
    SPECIES_SPECS.append((im_b4, name, c * 256, (c + 1) * 256, 10, 220))

b4_r1 = ['bacteria', 'detritus', 'fallback']
for c, name in enumerate(b4_r1):
    SPECIES_SPECS.append((im_b4, name, c * 256, (c + 1) * 256, 280, 500))

# Execute slicing
print(f"Total species to process: {len(SPECIES_SPECS)}")
image_cache = {}

processed = 0
for img_file, name, x0, x1, y0, y1 in SPECIES_SPECS:
    if img_file not in image_cache:
        image_cache[img_file] = Image.open(os.path.join(BASE_USER, img_file))
    im = image_cache[img_file]
    
    icon_canvas = extract_and_clean(im, x0, x1, y0, y1)
    if icon_canvas:
        out_path = os.path.join(OUT_DIR, f"{name}.png")
        icon_canvas.save(out_path)
        processed += 1
        print(f"[{processed}/{len(SPECIES_SPECS)}] Saved {out_path} ({icon_canvas.size})")

print(f"Finished processing all {processed} species icons!")
