KodiKart — Placeholder Icons
==============================

These placeholder icon files are referenced by manifest.json and index.html.

BEFORE LAUNCHING TO PRODUCTION:
Replace icon-72.png, icon-96.png, icon-128.png, icon-192.png, and icon-512.png
with real KodiKart brand PNG icons at the correct sizes.

Sizes needed (all PNG):
  - icon-72.png   →  72 × 72 px
  - icon-96.png   →  96 × 96 px
  - icon-128.png  → 128 × 128 px
  - icon-192.png  → 192 × 192 px   (marked "maskable" — keep content inside safe zone)
  - icon-512.png  → 512 × 512 px   (marked "maskable" — keep content inside safe zone)

Recommended free tools:
  • https://realfavicongenerator.net  — upload one 512×512 image, download all sizes
  • https://www.canva.com             — design your icon then export per size
  • https://favicon.io               — instant PNG generation from text or image

Maskable icons:
  The 192×192 and 512×512 icons are declared with purpose "maskable" in
  manifest.json. For these, keep all important artwork within the central
  80% "safe zone" so Android adaptive-icon shapes (circle, squircle, etc.)
  don't clip the logo.  See: https://web.dev/maskable-icon/

The source SVG icon (icon.svg) is included as a starting point.
You can render it at each PNG size using any SVG-to-PNG converter or
browser dev-tools screenshot.
