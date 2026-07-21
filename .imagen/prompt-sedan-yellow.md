# Yellow Sedan — Top-Down Pixel Art Game Sprite (v3 — pixel art style)

## Style correction from previous drafts
Previous drafts were photorealistic 3D-rendered product shots. Switch entirely to crisp, hard-edged PIXEL ART matching the red target sedan sprite in this same set (identical "big pixel" scale, outline weight, flat-shading approach). NOT a photograph run through a pixelate filter, NOT soft/blurry.

## Product Description
A compact top-down sedan sprite, one of the blocking vehicles. Base color taxi-yellow (#EAB308) with 2-3 flat shading blocks (lighter yellow highlight block along centerline, darker yellow/amber shadow block along side edges). Windshield/rear window as flat near-black (#1A1A1F) rectangles. Thin black outline around the whole silhouette. Same scale and proportions as the red target sedan in this set.

## Wheel Position — CRITICAL, must be pixel-precise
This vehicle spans exactly 2 cells lengthwise, each cell with a socket stud dead-centered. The four wheels (small black squares) MUST be positioned:
- Front-left and front-right wheels: centered at exactly 75% of sprite width
- Rear-left and rear-right wheels: centered at exactly 25% of sprite width
- All four wheels vertically centered within the sprite height (50%)
These two wheel-pair positions must land on the two cell-centers.

## Background
Solid flat pure magenta chroma-key background, hex #FF00FF, completely uniform, hard clean edge — for chroma-key alpha extraction.

## Angles & Composition — near-zero margin
Strict top-down view, nose pointing right. Frame width = EXACTLY two grid-cell-lengths. Front/rear tips within ~2% of left/right frame edges. Roughly 2:1 landscape aspect.

## Technical Specifications
- Roughly 2:1 landscape aspect ratio
- Pixel art style: hard edges, flat color blocks, NO anti-aliasing, NO photographic gradients
- Format: PNG
- Deliver raw generated image as-is; no post-processing, no crop, no resize
- No text, no logos, no watermarks
