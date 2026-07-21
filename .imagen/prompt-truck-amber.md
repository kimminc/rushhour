# Amber Box Truck — Top-Down Pixel Art Game Sprite

## Style
Crisp hard-edged PIXEL ART matching the existing truck-green sprite in this set (same "big pixel" scale, outline weight, flat-shading). NOT photorealistic, NOT anti-aliased/blurry.

## Product Description
A top-down box-truck sprite (cab + cargo box), spanning 3 cells — the second of two truck colors in this set. Base color amber/gold (#D97706) cargo box with 2 flat shading blocks (lighter highlight along centerline, darker rust-amber shadow along edges) and a slightly darker amber cab section at the front with a flat near-black (#1A1A1F) windshield rectangle. Thin black outline around the whole silhouette. A single thin darker seam line marks the cab-to-cargo-box transition.

## Wheel Position — CRITICAL, must be pixel-precise
Spans exactly 3 cells lengthwise, socket studs at 1/6, 3/6, 5/6 of width. Two wheel pairs:
- Front-left/front-right (under cab): centered at exactly 83% of sprite width
- Rear-left/rear-right: centered at exactly 17% of sprite width
- Vertically centered (50% of sprite height)
No wheels under the middle cell (cargo box middle) — that's correct.

## Background
Solid flat pure magenta chroma-key background, hex #FF00FF, uniform, hard clean edge — for chroma-key alpha extraction.

## Angles & Composition — near-zero margin
Top-down, cab pointing right. Frame width = EXACTLY three grid-cell-lengths. Front/rear tips within ~1.5% of left/right edges. Roughly 3:1 landscape aspect, same scale as the truck-green sprite in this set.

## Technical Specifications
- Roughly 3:1 landscape aspect ratio
- Pixel art: hard edges, flat color blocks, NO anti-aliasing
- Format: PNG, deliver as-is, no post-processing
- No text, no logos, no watermarks
