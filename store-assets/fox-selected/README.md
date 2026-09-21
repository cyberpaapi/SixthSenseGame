# Selected happy-fox branding

Selected by the owner on September 21, 2026. `approved-source.png` is the exact attached selection (691×679), preserved unchanged. It corresponds to the happy furry fox concept above two rows of SIXTH / SENSE blocks. The store icon exports that source directly; it is not a new mascot redraw. The slight source aspect difference is handled by proportional scaling and purple padding.

`adaptive-foreground.png` is a built-in image_gen adaptation that removes the purple background and restores the cropped ear tip. `feature-source.png` is a matching generated wide graphic. Source generation stays separate from deterministic size/format exports in `scripts/export-fox-icons.py` (Pillow). Android foreground pixels fit a centered 64dp-diameter circle inside the 108dp adaptive canvas, providing margin within the 66dp safe region. Legacy round icons use the same isolated emblem; regular legacy icons retain the approved square composition.

Outputs: `store-assets/app-icon-512.png` (opaque 512×512), `store-assets/feature-graphic-1024x500.png` (opaque 1024×500), `assets/app-icon-fox-{192,512}.png`, Android density launcher icons and splash branding. No advertisements are present. The in-game horizontal clay wordmark and player's selected avatar remain separate, preserving game-screen geometry.

## Exact built-in image_gen prompts

### Adaptive foreground

Use case: background-extraction. Edit target is the attached APPROVED Sixth Sense logo. Produce a matching Android adaptive launcher foreground on a genuinely transparent alpha background. Preserve the EXACT happy orange fox identity, open smile, brown eyes, paws, curled tail and glossy colored blocks; preserve exact spelling and row layout SIXTH above SENSE, five blocks per row, white letters. Remove only the purple background. Restore the tiny cropped tip of the top ear naturally, and keep all ears/tail/blocks fully visible. Center entire fox plus blocks as one compact composition in the middle 80% of a square canvas with transparent margins. No new props, no ads, no lettering beyond SIXTH SENSE, no badges, no halo or floor shadow outside the artwork. This is an adaptation of a chosen logo, not a redesign. Return transparent PNG.

### Feature graphic

Use case: ads-marketing. Input image is the APPROVED Sixth Sense fox-and-block logo; preserve its fox identity, happy open smile, orange fur, cream muzzle, brown eyes, paws on blocks, and EXACT two rows SIXTH above SENSE. Create a matching finished wide Google Play feature graphic, 1024x500 aspect ratio (2.048:1), opaque purple backdrop. Place the approved fox-and-block emblem prominently in the CENTER with both ears and all ten tiles visible, wide balanced breathing room on left and right. Match the reference's purple lighting, orange fox and glossy red yellow turquoise violet blocks. Background is a restrained purple gradient with gentle lavender light and a few faint small rounded-block shapes near far outer edges. Only text is the ten exact letters of SIXTH SENSE in the emblem. No tagline, no new logo, no aperture symbol, no UI or screenshot, no ads, prices, badges, install buttons or store logos. Keep all meaningful artwork in the central 80% of the width and with 8% top and bottom margin. Elegant simple original game branding for teens and adults.

### Feature graphic margin correction

undefined

## References

- [Android adaptive icon layers and safe region](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive)
- [Play icon export specification](https://developer.android.com/distribute/google-play/resources/icon-design-specifications)

Generated original foreground: `C:/Users/Aryan/.codex/generated_images/01a085cd-5c83-7763-bb25-738c9f3dff40/exec-7b73c76f-4835-4f64-bf3a-82b64d132e18.png`. Final feature original: `C:/Users/Aryan/.codex/generated_images/01a085cd-5c83-7763-bb25-738c9f3dff40/exec-00a0b29a-8f85-479e-b0bf-93952d41b946.png`. The first feature draft cropped an ear and was replaced by the corrected final export.
