# Original profile animal companions

## Identity and scope

The selected profile character is the source of truth. `AVATAR_CHARACTERS` points at the five original SVG illustrations in `/images/characters/`. The companion resolves that exact catalog entry. The user's video is a reference for independent, gentle movement only; no video pixels, replacement model, poster, or sprite atlases are included in this implementation.

Version 0.1.9 animates the otter, yak, bear, pterodactyl and penguin. The approved penguin deformation is unchanged. Each other animal has its own anatomical rig: seated paws and tail for the otter, smaller head and hoof gestures for the yak, paw and head movements for the bear, and folded-wing and crest movements for the pterodactyl. Personal photos remain static. Existing accounts retain their character selection or default otter; no database migration is required.

## Rendering

`animalIllustration.ts` loads the selected original SVG and separates its existing `eye-line` group. Both parts are rasterized once to transparent 800×800 immutable bitmaps (canvas fallback when ImageBitmap is unavailable). A 24×28 mesh deforms the original body pixels with continuous joint weights. The same authored eye follows the head and compresses briefly for a blink. The SVG, its silhouette, pigment, painted highlights and pose remain the original artwork. No anatomy is repainted.

Neutral mesh UVs are identical to the source coordinates. `animalRig.ts` records each animal's original bounds, eye, head rotation scale and floor. Penguin anatomy continues to use `penguinRig.ts`. Overlapping triangle clips sample the complete texture to avoid internal cracks and filtering seams. Transparent mesh cells are omitted. Canvas2D works without WebGL. Rasterizing the vector before skinning avoids re-executing SVG filters for each triangle.

This is an articulated illustration, not a rotatable 3D model. Its side-facing view cannot reveal a new front or back without inventing artwork. The supported gestures are head tilts and nods, flipper movements, blinks, breathing, small steps and changes of support.

## Motion and lifecycle

`penguinMotion.ts` schedules bounded, seeded actions with a readable opening greeting, irregular rests and blinks. It does not replay the reference video. Maximum extra travel is ±7 horizontal pixels and ±2 vertical pixels. Head, flippers and feet have independent continuous influences. Editor focus, composition and recent input reduce activity; field contents and keystrokes are never read.

A stable profile button reserves the corner. Scene sizes are 128×112 on desktop, 112×104 on narrow screens, and 104×88 in compact landscape. The navbar and sticky editor controls account for the reserved height. The character has no visible backing container. Clicking it still opens Profile.

The per-device “Movimiento del compañero” control pauses animation for all animals. Reduced motion takes priority. Hidden documents and inert navigation under dialogs suspend the active clock and cancel requestAnimationFrame. Resume does not catch up on elapsed background time. Resize redraws the current pose. Rendering is capped at 24 updates/second and DPR 2; React does not rerender each frame. Changing the selected animal remounts the scene and disposes the old renderer; late asset requests cannot replace the new selection.

The two 800×800 textures for one animal occupy about 5.1 MB uncompressed, plus the small display and alpha-mask canvases. A two-entry cache retains the most recently requested animals (about 10.2 MB of textures) and drops older references for garbage collection. There is no animation service, user-content access or animation telemetry. Asset failures retain the original SVG fallback and permit two bounded retries; online and attention events allow another attempt. Cleanup cancels frames, timers, listeners and observers.

## Review and acceptance

Open `/ux-preview.html?view=dashboard&character=penguin` in the development server; replace `penguin` with `otter`, `yak`, `bear` or `pterodactyl` to review another animal. This view uses isolated synthetic account data and no Supabase operations. The review controls include an eight-second recording of the live companion canvas; it does not capture the page or account fields. Neither the review page nor recording tool enters the production build.

Acceptance criteria:

- The picker, profile portrait, still fallback and animated texture use the same selected catalog animal. All original SVG files are unchanged.
- A gesture starts within the first second. Head and flipper movement is visible, with irregular actions afterward, inside the reserved corner.
- No texture tears, eye drift, mesh folds or abrupt pose changes occur within the supported motion range.
- Pause, reduced motion, hidden state and dialogs stop animation. Navigation and resuming do not replay background time or restart on unrelated renders.
- The profile button remains accessible and stationary. Writing controls remain unobstructed on desktop and narrow screens.
- No personal journal or credential data appears in previews, generated media or tests.

## Validation status

- Motion tests cover opening movement, five-minute bounds, temporal continuity, irregular blinking, quiet mode, deterministic scheduling and interruption recovery.
- Rig tests cover all five animals: neutral UV identity, combinations of joint extrema, triangle orientation, original eye geometry, eye attachment, isolated limbs and preservation of the approved penguin. Penguin renderer tests retain the original transform checks.
- Existing privacy/profile/auth tests remain required. Run `npm test`, `npm run build`, `npm run lint` and `npm run test:preview-boundary`.
- The user approved the penguin in the local running application. Further automated browser interaction was interrupted by an access-policy restriction; do not treat uncompleted browser pause/responsive checks as passed.
- A ten-second, 240-frame standalone render of all five animals using the actual renderer and planner is saved locally as `release-artifacts/animal-companions-v0.1.9.mp4`. Four sampled poses per animal were visually inspected without texture seams. Alpha-mask checks confirm every original silhouette fits its rig. This is not a browser recording or Android performance measurement.
- The final web build, motion/rig/privacy tests and production-preview boundary check pass. Lint has no errors and seven pre-existing warnings in unrelated files.
- Physical Android smoothness, battery behavior and perceived quality remain to be verified on a device.

## Release

Package and Android versionName are 0.1.9; Android versionCode is 17. The `v0.1.9` tag triggers the existing signed Android release workflow. It now runs the privacy/motion/rig tests and verifies that development preview content does not enter the APK before publishing. The release requires no new signing secrets or Supabase changes.
