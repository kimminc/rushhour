# Grooved Traffic-Puzzle Board Floor — Top-Down Game Object (v4 — exit size correction)

## Reference match (from real physical ThinkFun/WisdomFun Rush Hour board photos)
The real board is NOT continuous rail lines. It's a 6x6 grid of individual raised square studs, one centered in each cell, with a clearly visible gap of base-panel material between every adjacent stud (both horizontally and vertically) -- this is what makes each cell read as a distinct socket that a vehicle's wheel/peg clips onto. Each stud is roughly 60-65% of the cell's width/height (not edge-to-edge, not tiny) -- square with slightly rounded corners, subtle raised bevel (lit edge on the upper-left, soft shadow on the lower-right), a faint fine ribbed/serrated texture on top like real molded plastic grip texture. Replace the previous "paired parallel rail groove" concept entirely -- go back to a per-cell stud grid, but keep every stud perfectly centered in its cell (unlike a busy full-bevel tile-to-tile grid, there must be visible flat dark gap channel between studs, not touching edges).

## Critical Layout Constraint (this is a game engine asset, not a decorative photo)
This image is stretched edge-to-edge by a game engine onto a canvas where each of the 6 columns and 6 rows is an EXACT equal fraction of the total image (each cell = precisely 1/6 of image width x 1/6 of image height). Any outer border, frame, bezel, rounded corner, drop shadow, or margin around the grid will cause the game's cars to visually misalign with the grid, which is a functional bug, not a style choice. Therefore:
- The grid MUST fill the entire canvas edge-to-edge with ZERO margin.
- The outermost cell edges MUST touch the literal top/bottom/left/right pixel borders of the image -- no frame, no rounded corners, no bezel, no drop shadow outside the grid.
- Do NOT render this as a "product photo of a panel sitting on a surface" -- render it as a seamless, borderless texture/material fill, like a texture map, cropped tight to exactly the 6x6 grid with nothing beyond it.

## Product Description
A top-down seamless texture of a 6x6 game-board surface, matte dark slate-navy (#1E293B) injection-molded plastic material, borderless and edge-to-edge as specified above.

## Groove Redesign -- per-cell wheel-socket studs (matches reference photo)
Draw exactly one square stud centered in each of the 36 cells (6x6 = 36 total, none skipped). Each stud:
- Sized roughly 62% of the cell's width and height, centered in the cell (roughly 19% flat gap margin on all four sides of the stud within its cell, where the base panel color shows through)
- Square with slightly rounded corners, raised with a subtle bevel (soft highlight upper-left edge, soft shadow lower-right edge)
- Faint fine ribbed grip texture on top, same dark navy family as the base panel but very slightly lighter/more saturated so it's distinguishable at a glance without being high-contrast
This is a wheel socket marker: a vehicle occupying a cell has its wheel positioned approximately over this stud, so consistent per-cell centering matters more than any other single detail in this brief.

## Lighting Setup
Soft even studio top light directly above (90 degree overhead) at a slightly raking angle (about 15 degrees off vertical, light from upper-left) so each raised stud catches a visible highlight on its upper-left edge and a soft shadow on its lower-right edge, selling the "raised socket" material read. No harsh specular hotspots, no color casts other than the panel's own dark navy tone.

## Exit -- same size as one block, just brightly colored (v4 correction)
The third row from the top (row index 2 of 6, counting from 0) is the exit lane, on the right edge. Correction from a previous draft: the exit marker got rendered too large (spilling beyond its own cell) -- it must be corrected to occupy EXACTLY the same footprint as any other single stud cell, no bigger:
- The exit cell (row index 2, column index 5 -- the last column) uses the SAME 1/6 x 1/6 cell footprint as every other cell. Do not let it bleed into neighboring rows or extend further into the board than a normal stud does.
- Inside that one cell, replace the normal navy stud with a bright glowing cyan (#2DE2E6) square marker of the SAME size as a normal stud (~62% of the cell, same centering) -- same shape/size contract as every other stud, just a completely different glowing color so it reads as special.
- A single bold chevron arrow (>) icon sits centered on top of that glowing square, pointing right, sized to fit within the same stud footprint -- not larger than the stud, not spilling past the cell boundary.
- Do not add any glow bleed, extra gate framing, or ramp shape that extends beyond that one cell's boundary. One cell in, one cell out -- exactly block-sized.

## Background
N/A -- see Critical Layout Constraint above. The grid texture fills 100% of the frame.

## Angles & Composition
Strict orthographic top-down view (camera at 90 degrees directly overhead, zero perspective convergence), perfectly square 1:1 framing, grid lines exactly parallel to image borders (not rotated even slightly), full-bleed with zero margin as specified above.

## Detail Focus
Stud size and centering consistency across all 36 cells including the exit cell (same ~62% size, dead-centered every time, visible gap to neighboring studs) -- the exit is distinguished ONLY by color/glow, never by size, very faint fine-grain matte plastic texture across flat surfaces (not glossy, not mirror-like), no vehicles placed on the board (empty board only).

## Technical Specifications
- Square 1:1 aspect ratio, full-bleed edge-to-edge, zero margin, zero border, zero rounded corners
- High quality, refined detail, crisp rendering, professional-grade
- Format: PNG
- Deliver raw generated image as-is; no post-processing, no crop, no resize
- No text, no logos, no watermarks
- Color anchors: panel base #1E293B, stud slightly lighter navy, groove shadow near-black #0B1120, exit accent glow #2DE2E6 (same size as a normal stud, distinguished by color/glow only, not by size)
