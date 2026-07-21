# Red Target Sedan — Top-Down Pixel Art Game Sprite (v3 — pixel art style)

## Style correction from previous drafts
Previous drafts were photorealistic 3D-rendered product shots. That style clashes with the board floor's chunky molded-plastic stud texture. Switch entirely to crisp, hard-edged PIXEL ART, in the spirit of 16-bit/32-bit era top-down racing games (Micro Machines, top-down GTA1-era sprite cars). This must look like it was authored on a small native pixel grid (roughly 64x32 "big pixels") and then scaled up with nearest-neighbor (NO smoothing) -- NOT a photograph run through a pixelate filter, NOT soft/blurry, NOT anti-aliased gradients. Flat color blocks, hard 1-pixel-equivalent outlines, limited palette (4-6 shades of red plus black/dark-gray for windows and wheels), visible chunky square pixel edges on every diagonal/curve.

## Product Description
A compact top-down sedan sprite, the player's target vehicle. Base color candy-apple red (#E63946) with exactly 2-3 shading blocks (a lighter red highlight block along the centerline, a darker red shadow block along the side edges -- flat blocks of color, not a gradient). Windshield and rear window as flat near-black (#1A1A1F) rectangles. A thin black outline (1-2 "big pixels" thick) around the entire silhouette, like classic sprite art.

## Wheel Position — CRITICAL, must be pixel-precise
This car will sit on a game board where each cell has a socket stud dead-centered in the cell, and this car spans exactly 2 cells lengthwise. The four wheels (drawn as small black squares) MUST be positioned as follows, measured as a percentage of the total sprite width from the left edge:
- Front-left and front-right wheels: centered at exactly 75% of sprite width (right-side cell's center)
- Rear-left and rear-right wheels: centered at exactly 25% of sprite width (left-side cell's center)
- All four wheels vertically centered within the sprite height (50% of sprite height)
This is not a stylistic suggestion -- these two wheel-pair positions must land on the two cell-centers so the wheels visually plug into the board's studs. Do not place wheels near the front/rear bumper tips as a realistic car would; place them at the 25%/75% cell-center marks even if that looks slightly stylized/toy-like.

## Background
Solid flat pure magenta chroma-key background, hex #FF00FF, completely uniform with zero gradient or texture, hard clean edge between the car silhouette and the background — for a chroma-key alpha extraction pass.

## Angles & Composition — near-zero margin
Strict top-down view, nose pointing right. This frame's width represents EXACTLY two grid-cell-lengths. Front and rear tips of the sprite must each come within ~2% of the left/right frame edges. Roughly 2:1 landscape aspect.

## Technical Specifications
- Roughly 2:1 landscape aspect ratio
- Pixel art style: hard edges, flat color blocks, NO anti-aliasing, NO photographic gradients, NO soft shadows -- if it looks smooth/photographic, it is wrong
- Format: PNG
- Deliver raw generated image as-is; no post-processing, no crop, no resize
- No text, no logos, no watermarks
