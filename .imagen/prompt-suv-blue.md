# Blue SUV — Top-Down Pixel Art Game Sprite (v3 — pixel art style)

## Style correction from previous drafts
Previous drafts were photorealistic 3D-rendered product shots. Switch entirely to crisp, hard-edged PIXEL ART matching the red target sedan sprite in this same set (same "big pixel" scale, same outline weight, same flat-shading approach) -- 16-bit/32-bit era top-down racing game look. NOT a photograph run through a pixelate filter, NOT soft/blurry, NOT anti-aliased gradients. Flat color blocks, hard chunky pixel edges.

## Product Description
A boxy top-down SUV sprite, one of the blocking vehicles. Base color royal blue (#3B82F6) with 2-3 flat shading blocks (lighter blue highlight block along centerline, darker blue shadow block along side edges). Windshield/rear window as flat near-black (#1A1A1F) rectangles. Slightly taller/boxier silhouette than the sedan sprite in this set to read as a bigger blocking vehicle. Thin black outline around the whole silhouette.

## Wheel Position — CRITICAL, must be pixel-precise
This vehicle spans exactly 2 cells lengthwise, each cell with a socket stud dead-centered. The four wheels (small black squares) MUST be positioned:
- Front-left and front-right wheels: centered at exactly 75% of sprite width
- Rear-left and rear-right wheels: centered at exactly 25% of sprite width
- All four wheels vertically centered within the sprite height (50%)
These two wheel-pair positions must land on the two cell-centers. Place wheels at the 25%/75% marks even if that looks slightly stylized rather than photographically accurate.

## Background
Solid flat pure magenta chroma-key background, hex #FF00FF, completely uniform, hard clean edge — for chroma-key alpha extraction.

## Angles & Composition — near-zero margin
Strict top-down view, nose pointing right. Frame width = EXACTLY two grid-cell-lengths. Front/rear tips within ~2% of left/right frame edges. Roughly 2:1 landscape aspect, same scale as the sedan sprite in this set.

## Technical Specifications
- Roughly 2:1 landscape aspect ratio
- Pixel art style: hard edges, flat color blocks, NO anti-aliasing, NO photographic gradients
- Format: PNG
- Deliver raw generated image as-is; no post-processing, no crop, no resize
- No text, no logos, no watermarks
