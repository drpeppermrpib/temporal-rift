# Temporal Rift: Ashen Vanguard — Play Store First-Release Checklist

Everything you need is in this folder (`playstore/`). Work through these steps in order in the
[Play Console](https://play.google.com/console).

App identity used in the build:

- **Package (appId):** `com.drpep.temporalrift`
- **Version:** 2.3 (versionCode 23)
- **Upload bundle:** `playstore/TemporalRift-2.3.aab`
- **Test APK (same signed build):** `playstore/TemporalRift-2.3-release.apk`

---

## 1. Create the app

1. Play Console → **Create app**.
2. App name: **Temporal Rift: Ashen Vanguard**
3. Default language: **English (United States)**.
4. App or game: **Game**. Free or paid: **Paid**. (Note: a paid app can be made free later, but a free app can never be made paid — Paid is the safe choice here.)
5. Accept the declarations and create.

## 2. Play App Signing + first upload

1. Go to **Test and release → Testing → Closed testing** (see step 8 for why closed testing first) and create a release.
2. When prompted about **Play App Signing**, accept the default **Google-managed signing key**.
   Google keeps the app signing key; the keystore we generated
   (`C:\Users\drpep\keystores\temporalrift-upload.jks`, details in `KEYSTORE-INFO.txt` — never
   commit that file) becomes your **upload key**. Every future AAB must be signed with it.
3. Upload `TemporalRift-2.3.aab`.
4. Release name: `2.3 (23)`. Release notes suggestion:
   > First public release. Wave-survival RPG with an adaptive horde, skill tree, quests, and buildable defenses. Fully offline.

## 3. Store listing (Grow → Store presence → Main store listing)

Assets in this folder:

| Slot | File | Size |
|---|---|---|
| App icon | `icon-512.png` | 512x512 |
| Feature graphic | `feature-1024x500.png` | 1024x500 |
| Phone screenshots | `screenshot-1.png` … `screenshot-4.png` | 1920x1080 |

**Short description** (75 chars, limit 80) — paste as-is:

```
Offline wave-survival RPG vs a horde that learns your tactics. No ads ever.
```

**Full description** (limit 4000 chars) — paste as-is:

```
The rift tore three worlds into one — and their dead did not stay dead. You are the last Riftborn Vanguard: a warrior who channels living aether through fist and firearm alike. Hold the refugee camp. Aid its survivors. Seal the rift.

But know this: the horde is bound to a learning engine. It studies your tactics, resists your habits, and hunts where you hide.

A HORDE THAT LEARNS
Temporal Rift is not another mindless wave shooter. Its adaptive AI tracks how you fight — rifle, beam, melee, or grenades — and evolves resistances against your favorite tools. Camp in a corner and rifts start opening right on top of your camping spot. Every run forces you to adapt, rotate weapons, and rethink your position.

WAVE SURVIVAL MEETS RPG
• Fight escalating waves of husks, sprinters, shamans, ravagers — and boss warlords torn from the rift.
• Level up and spend skill points in a three-branch skill tree: Warrior, Aether Arts, and Survivor.
• Loot cores from the fallen and upgrade your gear between waves.
• Take on quests from the survivors of Emberfall Camp — quartermasters, merchants, and scouts each have work for you.

BUILD YOUR DEFENSE
Raise barricades to funnel the horde, protect the camp, and buy yourself precious seconds. Repair, reposition, and reinforce between assaults — then unleash a repel blast when they break through anyway.

AN ARSENAL OF LIVING AETHER
Aether rifle, charged beam, devastating grenades, close-quarters strikes, nova bursts, and an Ascended form for when the horde gets too bold. Chain your tools together — because the horde is counting on you not to.

EXPLORE THE SHATTERED WORLDS
Fight across ember-lit kingdoms, ashen wastes, stone ruins, and the plague-cursed Duskmere Marsh — each region with its own dangers and rewards.

YOURS, COMPLETELY
• 100% offline — play anywhere, no connection required.
• No ads. No in-app purchases. No accounts. Pay once, own it.
• No data collection of any kind. Your saves stay on your device.
• Full touch controls with a drag-to-customize layout, plus auto-save after every wave.

The rift is open. The horde is learning. How long can you hold the line?
```

## 4. Content rating questionnaire (Policy → App content → Content ratings)

- Category: **Game**.
- Violence: **Yes — fantasy violence** against fantasy creatures (pixel-art undead/monsters,
  no gore towards realistic humans, no blood emphasis).
- Sex/nudity, language, drugs, gambling, simulated gambling: **No**.
- Does the app allow users to interact or exchange content with others? **No.**
- Does the app share user location or personal info? **No.**
- Expected rating: **Everyone 10+ / PEGI 7** (fantasy violence).

## 5. Privacy policy (Policy → App content → Privacy policy)

Paste this URL:

```
https://drpeppermrpib.github.io/temporal-rift/privacy.html
```

## 6. Data safety form (Policy → App content → Data safety)

- Does your app collect or share any of the required user data types? **No.**
- Is all of the user data collected by your app encrypted in transit? (Not applicable — nothing is collected.)
- Do you provide a way for users to request that their data is deleted? (Not applicable.)
- Result should display as **"No data collected, No data shared."**
- Note: the app's only network call is an anonymous version check to GitHub's public API; it
  sends no user data and does not count as collection.

## 7. Countries and price (Test and release → Production → Countries / Monetization → Pricing)

1. **Monetization setup → App pricing:** set your price (e.g. $2.99 tier). Google shows the
   local equivalents; you can round per-country later.
2. Add countries/regions: easiest is **Add all countries** unless you have a reason not to.

## 8. IMPORTANT — Closed testing requirement for new personal accounts

Personal developer accounts created after Nov 2023 must run a **closed test with at least 12
testers continuously enrolled for at least 14 days** before they can apply for production access:

1. Create a **Closed testing** track release with the same AAB (step 2 already did this).
2. Create an email list of 12+ testers (friends/family Gmail addresses) and add it to the track.
3. Share the opt-in link with testers; each must opt in AND install the game.
4. Keep 12+ testers enrolled for 14 consecutive days.
5. After 14 days, the **Apply for production** button unlocks on the dashboard; answer the short
   questions about your testing, then promote the release to **Production**.

## 9. Final pre-submit sweep

- [ ] All dashboard "Set up your app" tasks show green checks.
- [ ] Store listing preview looks right (icon, feature graphic, 4 screenshots).
- [ ] Sanity-test the exact store build on a phone: `adb install TemporalRift-2.3-release.apk`.
- [ ] The keystore + `KEYSTORE-INFO.txt` are backed up OUTSIDE this machine (password manager /
      cloud drive). Losing the upload key is recoverable via Google support only because we
      enrolled in Play App Signing — but it's slow. Don't lose it.
- [ ] Submit for review. First reviews commonly take 1–7 days.
