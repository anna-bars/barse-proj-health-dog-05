# Health Dog — Rive Integration Docs (Delivery #3)

Live Rive demo + integration documentation for `Dog Controller`.

## Delivery #3 — Mood States are now Booleans

Verified byte-for-byte from `Health Dog 03.riv`. Still 10 inputs, same `Dog Controller` state machine name, but the composition changed:

- **Mood States (Boolean, ENTER → LOOP → RETURN)**: `isGentleConcern`, `isSleep`, `isSad` — the app sets these `true`/`false`, the animation never exits on its own.
- **Main Triggers (one-shot)**: `trg_happy`, `trg_celebrate`, `trg_onboarding`.
- **Idle Variations (trigger)**: `trg_idle_b`, `trg_idle_c` (Idle A is the default, no trigger).
- **Blink (trigger, own parallel layer)**: `trg_blink`, `trg_slow_blink`.

The old `trg_concern` / `trg_sleepy` / `trg_sad` **triggers no longer exist** — replaced by the 3 booleans above.

## Tongue

Not an exposed input — handled inside the rig, tied to which mood is playing. Hidden during Gentle Concern / Sad / Sleep, visible and pulsing otherwise. Documented in its own section so the "missing" input reads as intentional.

## Interface

The canvas backdrop behind the character is now a dark warm charcoal gradient instead of a light/cream one — the dog's own fur colors (cream/tan) were blending into the previous light backdrop, so contrast was fixed at the canvas level while the rest of the page stays in the warm light theme.

## What's inside

- **Hero** — live `health-dog.riv` canvas, Mood State toggles (boolean switches) plus Main Triggers / Idle Variations / Blink as buttons, all grouped and icon-coded.
- **Docs** — Overview, Rebuild (ENTER→LOOP→RETURN explainer), Delivery #3 polish notes, Tongue system, full 10-input reference split by Boolean vs Trigger, JS / React Native examples, auto-blink, best practices, checklist.

## Run it

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Latest delivery — Happy animation reworked

- Removed head size scaling entirely — no more grow/shrink pulsing.
- Head now moves in a smooth up/down bounce (5 bounces per loop) instead of side to side.
- Ears now have a subtle floppy side-to-side reaction that follows the head bounce.
- Tongue movement is clearly visible.
- Added darker shading above the tongue / below the top of the mouth when fully open.
- No trigger or state machine names changed — same 10 inputs, same `Dog Controller`.

## Interface — dark dashboard theme

The whole page (not just the canvas) is now styled like a dark fintech dashboard — near-black background, dark rounded cards, blue accent color, card-style groupings for each input section — instead of the earlier warm light theme.
