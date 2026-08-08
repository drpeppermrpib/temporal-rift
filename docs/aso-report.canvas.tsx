import {
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Stack,
  Stat,
  Table,
  Text,
  useHostTheme,
} from "cursor/canvas";

/**
 * ASO audit for Temporal Rift: Ashen Vanguard (com.drpep.temporalrift).
 * Source of listing truth: playstore/UPLOAD-CHECKLIST.md, README, privacy.html (Aug 2026).
 * Play Console not scraped; closed testing + $0.99 paid noted from operator brief.
 */

const TITLE_CURRENT = "Temporal Rift: Ashen Vanguard";
const TITLE_ALT = "Temporal Rift Horde Survival";
const SHORT_CURRENT =
  "Offline wave-survival RPG vs a horde that learns your tactics. No ads ever.";
const SHORT_OPT =
  "Wave survival action RPG - offline. Adaptive horde learns. No ads or IAP.";

const FULL_OPT = `The rift tore three worlds into one — and their dead did not stay dead. You are the last Riftborn Vanguard: a warrior who channels living aether through fist and firearm. Hold Emberfall Camp. Aid its survivors. Seal the temporal rift.

This is offline wave survival action RPG combat with a twist: the horde is bound to a learning engine. It studies your tactics, resists your habits, and opens spawn rifts where you camp. Adapt or fall.

A HORDE THAT LEARNS
Temporal Rift is not another mindless wave shooter. Adaptive AI tracks how you fight — rifle, charged beam, melee nova, or grenades — and builds resistances against overused tools. Linger in one corner and rift spawns hunt your camping spot. Every run rewards weapon rotation, repositioning, and smarter defense.

WAVE SURVIVAL MEETS ACTION RPG
• Survive escalating waves of husks, sprinters, grave shamans, ork ravagers, and boss warlords torn from the rift.
• Level up and spend skill points in a three-branch skill tree: Warrior, Aether Arts, and Survivor — plus Storm Ascendant transformation.
• Loot energy cores, raid supply caches, and upgrade gear between waves in the field lab.
• Take quests from Emberfall Camp survivors — quartermasters, merchants, and scouts drive a multi-chapter story across named regions.

BUILD, FORTIFY, RECRUIT
Raise barricades and fortify linked fence grids. Mount sentry uplinks. Recruit companions — Rover, Warden, and Scout — to hold the line while you weave aether combat and gunplay. Checkpoints keep death from wiping a hard-fought run.

AN ARSENAL OF LIVING AETHER
Pulse rifle, Gusher splash bolts, Sticker needle clusters, charged Nova Beam, grenades, dash, close-quarters nova bursts, and Ascended dual-wield forms. Chain tools together — because the learning engine is counting on you not to.

EXPLORE THE SHATTERED WORLDS
Fight across Emberfall Camp, the Shattered Fields, Northreach Fort, the Ashen Reach, and plague-cursed Duskmere Marsh. Named zones, NPC dialogue, and open arenas make every assault feel like a place — not a menu.

YOURS, COMPLETELY
• 100% offline wave survival — play anywhere, no connection required for the core game.
• No ads. No in-app purchases. No accounts. Pay once, own it.
• No data collection. Saves stay on your device.
• Full touch controls with drag-to-customize layout, haptics, auto-save after every wave, and landscape mobile combat.

The rift is open. The horde is learning. How long can you hold the line?

Download Temporal Rift: Ashen Vanguard — the offline horde survival action RPG where enemies adapt to you.`;

const PROMO =
  "Closed testers: the horde learns your favorite weapon. Rotate tactics, fortify the camp, seal the rift.";

export default function AsoReport() {
  const theme = useHostTheme();
  const accent = theme.accent;

  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 960 }}>
      <Stack gap={8}>
        <Row gap={8} align="center" wrap>
          <H1 style={{ margin: 0 }}>ASO Report</H1>
          <Pill tone="info">Play Store</Pill>
          <Pill>Paid $0.99</Pill>
          <Pill tone="warning">Closed testing</Pill>
        </Row>
        <Text tone="secondary">
          Temporal Rift: Ashen Vanguard · com.drpep.temporalrift · Listing truth
          from playstore/UPLOAD-CHECKLIST.md, README, privacy.html (Aug 2026).
          Play Console not modified.
        </Text>
      </Stack>

      <Grid columns={4} gap={12}>
        <Stat value="72" label="ASO readiness / 100" tone="info" />
        <Stat value="29/30" label="Title length (brand)" />
        <Stat value="75→73" label="Short desc chars" />
        <Stat value="4" label="Phone screenshots" tone="warning" />
      </Grid>

      <Callout tone="info" title="Executive summary">
        The listing already sells the real USP — a learning horde, offline play,
        and pay-once with no ads/IAP — in clear original IP language. Biggest
        gaps: title carries zero category keywords, only four screenshots and no
        listing video, closed-test discovery is near-zero until production, and
        the free GitHub/sideload channel can undercut paid conversion if not
        messaged carefully. Fix short description + graphics sequence first;
        keep the brand title until you can A/B a keyword variant in production.
      </Callout>

      <Divider />

      <H2>Current listing audit</H2>
      <Table
        headers={["Field", "Current", "Verdict", "Notes"]}
        columnAlign={["left", "left", "left", "left"]}
        rowTone={["success", "info", "success", "warning", "warning", "info"]}
        rows={[
          [
            "App name",
            TITLE_CURRENT,
            "Strong brand",
            "29/30 chars. Unique, fits limit. No wave/horde/RPG keywords.",
          ],
          [
            "Short desc",
            SHORT_CURRENT,
            "Good USP",
            "75/80. Offline + learning horde + no ads. Missing action RPG / IAP denial.",
          ],
          [
            "Full desc",
            "Structured sections in checklist",
            "Strong base",
            "Hooks + features + trust. Underuses newer systems (companions, fortify, arsenal).",
          ],
          [
            "Graphics",
            "icon-512, feature-1024x500, shots 1–4",
            "Minimum met",
            "Need 6–8 phone shots + optional 7-inch/tablet; promo video absent.",
          ],
          [
            "Device name",
            "Capacitor appName: Temporal Rift",
            "Watch mismatch",
            "Launcher name shorter than store title — OK if intentional.",
          ],
          [
            "Privacy / data",
            "No collection; policy live on GitHub Pages",
            "Trust asset",
            "Rare differentiator for games — keep front-and-center in copy.",
          ],
        ]}
        striped
      />

      <Grid columns={2} gap={16}>
        <Stack gap={8}>
          <H3>What is strong</H3>
          <Text>
            Clear elevator pitch, original framing (aether, husks, rift-horde —
            not trademarked zombie-mode names), offline/privacy/no-IAP trust
            cluster, and a full description already written for humans not
            keyword salad.
          </Text>
        </Stack>
        <Stack gap={8}>
          <H3>What is weak</H3>
          <Text>
            Title keyword vacuum, thin screenshot set, no video, paid-app CTR
            headwind, closed-test vs production timing, and store copy lagging
            Release 2.8–2.9 features still in the README.
          </Text>
        </Stack>
      </Grid>

      <Divider />

      <H2>Keyword research</H2>
      <Text tone="secondary">
        Play indexes title, short description, and full description. No hidden
        keyword field. Prefer original framing; avoid COD Zombies / Halo / DBZ
        brand strings.
      </Text>

      <Table
        headers={["Tier", "Keywords", "Intent", "Placement"]}
        rows={[
          [
            "Primary",
            "wave survival, action RPG, offline RPG, horde survival",
            "Category discovery",
            "Short desc + full H2s + optional title A/B",
          ],
          [
            "Secondary",
            "adaptive AI, learning enemies, skill tree, barricade defense, boss waves",
            "Differentiation",
            "Full description body",
          ],
          [
            "Brand / IP",
            "temporal rift, ashen vanguard, aether, riftborn, emberfall",
            "Branded search + uniqueness",
            "Title + first paragraph",
          ],
          [
            "Trust",
            "no ads, no IAP, offline, no data collection",
            "Paid conversion / quality filter",
            "Short desc end + YOURS COMPLETELY",
          ],
          [
            "Avoid / careful",
            "Call of Duty, Nazi Zombies, Halo, Dragon Ball, Kakarot, Skyrim",
            "Trademark / IP risk",
            "Never in store text or graphics",
          ],
          [
            "Use carefully",
            "zombie, zombies",
            "High volume but crowded + IP adjacency",
            "Prefer husk / horde / undead / rift-horde; zombie OK sparingly if accurate",
          ],
        ]}
        striped
      />

      <H3>Competitor positioning (category, not scraped)</H3>
      <Text>
        You sit between offline wave-survival shooters, twin-stick / cover action
        games, and light action RPGs with skill trees. Generic comps players
        mentally map: Vampire Survivors–style wave pressure (different camera),
        classic horde/defense nights, and mobile action RPGs with transformation
        fantasy. Your wedge is{" "}
        <Text as="span" weight="semibold">
          adaptive enemies that punish repetition
        </Text>{" "}
        plus{" "}
        <Text as="span" weight="semibold">
          pay-once offline completeness
        </Text>
        — say that louder than “another zombie wave game.”
      </Text>

      <Divider />

      <H2>Optimized copy (paste-ready)</H2>
      <Text tone="secondary">
        Limits checked Aug 2026: title ≤30, short ≤80, full ≤4000. Em-dash in
        short desc avoided so length stays stable across consoles.
      </Text>

      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader trailing={<Pill tone="success">Recommended</Pill>}>
            App name (29/30)
          </CardHeader>
          <CardBody>
            <Text weight="semibold">{TITLE_CURRENT}</Text>
            <Text size="small" tone="secondary">
              Keep for brand uniqueness and launcher recognition. Fits Play’s
              30-char hard limit.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Pill tone="warning">A/B later</Pill>}>
            Alt name (28/30)
          </CardHeader>
          <CardBody>
            <Text weight="semibold">{TITLE_ALT}</Text>
            <Text size="small" tone="secondary">
              Keyword-weighted variant once Store Listing Experiments unlock in
              production. Loses “Ashen Vanguard” brand string.
            </Text>
          </CardBody>
        </Card>
      </Grid>

      <Card>
        <CardHeader trailing={<Text size="small">73/80</Text>}>
          Short description
        </CardHeader>
        <CardBody>
          <Text weight="semibold">{SHORT_OPT}</Text>
          <Text size="small" tone="secondary">
            Gains action RPG + IAP denial vs current; keeps offline, adaptive
            horde, no ads.
          </Text>
        </CardBody>
      </Card>

      <Card>
        <CardHeader trailing={<Text size="small">Promo text (optional)</Text>}>
          Closed-test / what’s new blurb
        </CardHeader>
        <CardBody>
          <Text>{PROMO}</Text>
          <Text size="small" tone="secondary">
            Play has no iOS-style subtitle; use release notes and social. Promo
            field varies by console surface — safe as tester messaging.
          </Text>
        </CardBody>
      </Card>

      <Card collapsible defaultOpen>
        <CardHeader trailing={<Text size="small">Full description</Text>}>
          Paste into Main store listing
        </CardHeader>
        <CardBody>
          <Text
            size="small"
            style={{
              whiteSpace: "pre-wrap",
              color: accent,
            }}
          >
            {FULL_OPT}
          </Text>
        </CardBody>
      </Card>

      <Divider />

      <H2>Graphics checklist</H2>
      <Table
        headers={["Asset", "Spec", "You have", "Recommendation"]}
        rowTone={["success", "success", "warning", "danger", "info"]}
        rows={[
          [
            "App icon",
            "512×512 PNG",
            "icon-512.png + icon-gen.html",
            "High-contrast silhouette at 48dp; test on light/dark shelf. One focal symbol (rift/eye/vanguard), not busy scene.",
          ],
          [
            "Feature graphic",
            "1024×500",
            "feature-1024x500.png + feature-gen.html",
            "Title readable at mobile width; avoid tiny subtitle. Show combat vibe + “offline / no ads” only if policy-safe (no price claims).",
          ],
          [
            "Phone screenshots",
            "16:9 or 9:16, 2–8",
            "screenshot-1…4 (1920×1080)",
            "Expand to 6–8: (1) hero combat hook, (2) learning-engine HUD, (3) skill tree, (4) barricades/sentries, (5) boss Gharok, (6) quest/NPC, (7) companions, (8) offline/no-ads trust card.",
          ],
          [
            "Promo video",
            "YouTube, 30s–2m",
            "Missing",
            "Highest CTR lever after icon. 15–30s: camp under siege → resistance HUD flash → Ascend → boss. No copyrighted music/IP.",
          ],
          [
            "Captions on shots",
            "Short benefit lines",
            "Unknown / likely plain",
            "Add 3–6 word captions: “Horde that learns”, “Offline. No ads.”, “Build & fortify”, “Skill tree + Ascend”.",
          ],
        ]}
        striped
      />

      <H3>Conversion tips</H3>
      <Grid columns={3} gap={12}>
        <Stack gap={6}>
          <Text weight="semibold">Icon</Text>
          <Text size="small" tone="secondary">
            First pixel of paid conversion. Prefer single glowing rift glyph or
            Vanguard bust over dense collage. A/B only after production traffic.
          </Text>
        </Stack>
        <Stack gap={6}>
          <Text weight="semibold">Shot #1</Text>
          <Text size="small" tone="secondary">
            Must answer “what do I do?” in one frame: mid-wave combat with
            readable HUD, not title menu. Caption the learning-engine hook.
          </Text>
        </Stack>
        <Stack gap={6}>
          <Text weight="semibold">Video</Text>
          <Text size="small" tone="secondary">
            Autoplay muted — burn USP in captions. End card: brand + “Pay once ·
            Offline · No ads” (not price).
          </Text>
        </Stack>
      </Grid>

      <Divider />

      <H2>Localization priorities</H2>
      <Table
        headers={["Priority", "Locales", "Why"]}
        rowTone={["success", "info", "info", "neutral"]}
        rows={[
          [
            "P0",
            "en-US (default)",
            "Already live; polish short/full before translating.",
          ],
          [
            "P1",
            "es-419, pt-BR, id, en-GB",
            "Large Play game spend / offline RPG affinity; reuse English creatives first.",
          ],
          [
            "P2",
            "de-DE, fr-FR, ja-JP, ko-KR",
            "Action RPG audiences; JA/KO need native tone for aether/horde fantasy.",
          ],
          [
            "P3",
            "hi-IN, ru-RU, tr-TR",
            "Volume markets; do after reviews prove retention in EN.",
          ],
        ]}
        striped
      />
      <Text size="small" tone="secondary">
        Translate short description + screenshots captions before full
        description. Keep brand name “Temporal Rift” transliterated consistently.
      </Text>

      <Divider />

      <H2>Post-launch ASO checklist</H2>
      <Table
        headers={["When", "Action"]}
        rows={[
          [
            "Pre-production",
            "Ship optimized short desc; expand screenshots to 6–8; draft 30s video; align store version notes with real build (2.9.x).",
          ],
          [
            "Week 1 live",
            "Reply to every review; tag bugs vs wishes; pin FAQ in short replies (offline, no IAP, learning engine).",
          ],
          [
            "Week 2–4",
            "Store Listing Experiment: short desc A/B; then icon; then screenshot order. One variable at a time.",
          ],
          [
            "Monthly",
            "Feature update + What’s new with 1 searchable phrase (e.g. companions, fortify links). Refresh shot #1 if meta changes.",
          ],
          [
            "Ongoing",
            "Track Play Console growth: store listing visitors → acquisitions → uninstalls. Paid apps need higher intent creative.",
          ],
        ]}
        striped
      />

      <Divider />

      <H2>Risks</H2>
      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader trailing={<Pill tone="warning">Conversion</Pill>}>
            Paid $0.99
          </CardHeader>
          <CardBody>
            <Text size="small">
              Browse-to-install is harder than free+IAP. Listing must scream
              completeness (offline, no ads, no IAP) in short desc and early
              screenshots. Free GitHub APK channel should be framed as demo/dev,
              not the same game free, or paid converts will bounce.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Pill tone="warning">IP care</Pill>}>
            Zombie keyword and inspired-by language
          </CardHeader>
          <CardBody>
            <Text size="small">
              Mechanics are fine; brand names are not. Never use Call of Duty,
              Nazi Zombies, Halo, Dragon Ball, or Skyrim in store text, tags, or
              image captions. Prefer horde / husk / rift-undead. The word zombie
              alone is ordinary English but crowded — not worth the IP adjacency.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Pill tone="warning">Access</Pill>}>
            Closed test vs production
          </CardHeader>
          <CardBody>
            <Text size="small">
              Closed testing does not build public search rank. Finish 12-tester /
              14-day gate, then promote. ASO experiments and meaningful keyword
              rankings start after production.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Pill>Channels</Pill>}>
            Play vs GitHub free
          </CardHeader>
          <CardBody>
            <Text size="small">
              Play build is channel-stamped (no out-of-store update banner). Keep
              that boundary. On GitHub README, soft-CTA to Play for the supported
              paid build; avoid promising identical free forever if monetization
              depends on Play.
            </Text>
          </CardBody>
        </Card>
      </Grid>

      <Callout tone="success" title="Do this next">
        1) Paste the optimized short description. 2) Keep current app name. 3)
        Add screenshots for learning-engine HUD, fortify/companions, and
        trust/no-ads. 4) Record a 30s captioned trailer before production apply.
      </Callout>

      <Text size="small" tone="tertiary">
        Scores are qualitative audit judgments, not Play Console metrics. No
        third-party rank scrapes used. Markdown backup: docs/aso_report.md
      </Text>
    </Stack>
  );
}
