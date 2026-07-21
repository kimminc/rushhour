# School Yellow Bus — Top-Down Pixel Art Game Sprite

## Style
Crisp hard-edged PIXEL ART matching the existing sedan/truck sprites in this set (same "big pixel" scale, outline weight, flat-shading). NOT photorealistic, NOT anti-aliased/blurry.

## Product Description
A top-down school-bus-style vehicle sprite, spanning 3 cells — visually distinct from the box trucks in this set. Base color school-bus yellow (#FBBF24) with 2 flat shading blocks (lighter highlight along centerline, darker amber-yellow shadow along edges). The KEY distinguishing feature vs a box truck: a row of 5 evenly spaced small square window cutouts (flat near-black #1A1A1F) running the full length along both the top and bottom edge of the body, like passenger-bus windows — NOT one or two large windows like a truck cab. A single larger flat near-black windshield rectangle at the very front (right end). Thin black outline around the whole silhouette, flat roof, slightly rounded front nose.

## Wheel Position — CRITICAL, must be pixel-precise
Spans exactly 3 cells lengthwise, socket studs at 1/6, 3/6, 5/6 of width. Two wheel pairs:
- Front-left/front-right: centered at exactly 83% of sprite width
- Rear-left/rear-right: centered at exactly 17% of sprite width
- Vertically centered (50% of sprite height)
No wheels under the middle cell.

## Background
Solid flat pure magenta chroma-key background, hex #FF00FF, uniform, hard clean edge — for chroma-key alpha extraction.

## Angles & Composition — near-zero margin
Top-down, front (windshield end) pointing right. Frame width = EXACTLY three grid-cell-lengths. Front/rear tips within ~1.5% of left/right edges. Roughly 3:1 landscape aspect, same scale as the truck sprites in this set.

## Technical Specifications
- Roughly 3:1 landscape aspect ratio
- Pixel art: hard edges, flat color blocks, NO anti-aliasing
- Format: PNG, deliver as-is, no post-processing
- No text, no logos, no watermarks
