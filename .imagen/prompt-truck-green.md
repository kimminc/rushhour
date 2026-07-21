# Green Box Truck — Top-Down Pixel Art Game Sprite (v3 — pixel art style)

## Style correction from previous drafts
Previous drafts were photorealistic 3D-rendered product shots. Switch entirely to crisp, hard-edged PIXEL ART matching the sedan sprites in this same set (identical "big pixel" scale, outline weight, flat-shading approach). NOT a photograph run through a pixelate filter, NOT soft/blurry.

## Product Description
A top-down box-truck sprite (cab + cargo box), the longest blocking vehicle, spanning 3 cells. Base color forest green (#22C55E) cargo box with 2 flat shading blocks (lighter green highlight along centerline, darker green shadow along edges) and a slightly darker green cab section at the front with a flat near-black (#1A1A1F) windshield rectangle. Thin black outline around the whole silhouette. A single thin darker-green horizontal seam line marks the cab-to-cargo-box transition so it doesn't read as one uniform blob.

## Wheel Position — CRITICAL, must be pixel-precise
This vehicle spans exactly 3 cells lengthwise, each cell with a socket stud dead-centered at 1/6, 3/6, and 5/6 of the sprite width. The truck has two wheel pairs (front axle near the cab, rear axle near the back) -- they MUST be positioned:
- Front-left and front-right wheels (under the cab): centered at exactly 83% of sprite width (rightmost cell's center)
- Rear-left and rear-right wheels: centered at exactly 17% of sprite width (leftmost cell's center)
- All four wheels vertically centered within the sprite height (50%)
The middle cell (50% of width, under the cargo box) has no wheels beneath it -- that's correct, real trucks don't have a wheel under the cargo middle either. Precision on the 17%/83% wheel positions matters more than any other detail in this brief.

## Background
Solid flat pure magenta chroma-key background, hex #FF00FF, completely uniform, hard clean edge — for chroma-key alpha extraction.

## Angles & Composition — near-zero margin
Strict top-down view, cab pointing right. Frame width = EXACTLY three grid-cell-lengths. Front (cab) and rear (cargo door) tips within ~1.5% of left/right frame edges. Roughly 3:1 landscape aspect, noticeably longer/narrower than the sedan/SUV sprites in this set.

## Technical Specifications
- Roughly 3:1 landscape aspect ratio
- Pixel art style: hard edges, flat color blocks, NO anti-aliasing, NO photographic gradients
- Format: PNG
- Deliver raw generated image as-is; no post-processing, no crop, no resize
- No text, no logos, no watermarks
