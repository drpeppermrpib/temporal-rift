# Gharok art plan

Active look as of **v2.8.3**: procedural canvas redraw of an **original** twin-headed green war-brute (Image 1 silhouette cues only — purple tunic, asymmetric pauldrons, spiked mace + cleaver, barefoot). No Hero Forge / Warhammer / Warcraft assets shipped.

## Preserved template

- `drawWarlord_v282_template` in `game.js` — the v2.8.2 clean geometric twin-brute (unused; restore by swapping the warlord draw call).
- Preview archive: `gharok-template-2.8.2.png` (also under `rollouts/`).
- Concept sketch (original gen, not used as a sprite): `gharok-twinorc-concept.png`.

## Combat that must stay

- `armorCrack` — mapped to 2 chest straps + 2 pauldrons (chip/fall).
- Cleaver wind-up telegraph (red glow) + heavy mace silhouette.
- Bigger boss footprint (`r: 54`, draw scale `s: 3.2`).

## Deferred (do NOT implement until look is confirmed)

- Foot-stomp sounds + vibration (`GHAROK_STOMP_JUICE` flag already stubs the juice off).

## Later backlog (do NOT implement now)

- Skill tree improvements
- Better sound engine (beyond current WebAudio synth snippets)

## Reference notes (inspiration only — never ship the PNGs)

1. **Primary** — twin green muscular war-brute: tunic, belt/buckle, skull+horn pauldron vs silver pauldron, mace + cleaver.
2. **Secondary help** — twin red ogre T-pose: belly mass, tusks, rounded pauldrons.
3. **Detail ideas only** — tusks, amber eyes, scars, spiked pauldrons, skull buckle grit.
