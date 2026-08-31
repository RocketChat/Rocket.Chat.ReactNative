# Emojis

The emoji dataset is generated from [emojibase](https://emojibase.dev), the same source the
web client uses ([Rocket.Chat#39411](https://github.com/RocketChat/Rocket.Chat/pull/39411)), so
both clients agree on shortnames, aliases and picker categories.

## Generating

```sh
pnpm generate-emoji-data
```

Reads the `emojibase-data` devDependency and writes `app/lib/constants/emojis/data.ts`, which
exports:

| Export                  | Contents                                                                         |
| ----------------------- | -------------------------------------------------------------------------------- |
| `emojisByCategory`      | The names the picker lists, per category tab                                     |
| `shortnameToUnicodeMap` | Every generated `:shortname:` → unicode, aliases and skin tone variants included |
| `aliasesByEmojiName`    | Alternate names for an emoji, keyed by the name listed in `emojisByCategory`     |

`shortnameToUnicodeMap` is not the whole resolvable set. `useShortnameToUnicode` reads it first and
falls back to [legacy shortnames](#legacy-shortnames), which a test keeps out of the generated map,
so a name resolving is never the same question as a name being in `data.ts`.

The output is committed, like `mappedIcons.js` (see [icons](./icons.md)). Nothing in the build or
release runs the script — bumping the emoji set means bumping `emojibase-data` in `package.json`,
re-running the script, reviewing the diff and committing it. `emojibase-data` is dev-only and
never reaches the bundle; the generated file does, exactly as a hand-written one would.

Do not edit `data.ts` by hand — the two datasets drifting apart is what this replaced.

Shortname resolution matches web:

- One name per emoji is listed, taken from joypixels shortcodes, falling back to emojibase.
- The remaining shortcodes become aliases, so search matches them but returns the listed name. The
  picker and the composer's `:` autocomplete both search through `searchEmojiNames` in
  `app/lib/methods/emojis.ts`, so the same names match in both. What they show differs: the picker
  scrolls the whole result, the composer shows the first four. That is why `searchEmojiNames` ranks
  exact matches — on the name or an alias — above partial ones, and a test pins `:fire` to `fire`.
- The 26 regional indicator letters are generated but not listed: they are the building blocks of
  flags, not emojis to pick. They resolve from `data.ts` like anything else.
- Emojibase's component group — skin tones, hair styles, and the 12 keycap components
  (`:digit_zero:`–`:digit_nine:`, `:asterisk_symbol:`, `:pound_symbol:`) — is dropped before
  anything is added, so those names are absent from `data.ts` entirely. The keycaps still resolve,
  but only through [legacy shortnames](#legacy-shortnames), which is what stored reactions need.
- Between them that is 38 names the pre-emojibase picker listed which no longer turn up in search at
  all. A further 36 names it listed are still searchable, just as aliases of the name joypixels
  picked instead — `cop` returns `police_officer`, `shrug` returns `person_shrugging`. 74 of the old
  1,388 listings are gone; only these 38 left search with them.
- Skin tone variants resolve but are not listed or searchable, since the picker has no tone
  selector. Remove that exclusion in the generator if one is ever added.

## Variation selectors

Regenerating moved 333 values by a variation selector (`U+FE0F`) only, in both directions, and both
are emojibase emitting the fully-qualified sequence:

- 158 gained one, on bases that already default to emoji presentation — `:alien:` is `1F47D FE0F`
  where the old map had `1F47D`. The glyph is the same, the string is not: anything matching emoji
  text literally, or counting code units, sees the extra codepoint. `Markdown.test.tsx.snap` was
  regenerated for that, `testID` and `accessibilityLabel` values included, so a selector written
  against one of those has to use the fully-qualified sequence. It also broke the emoji keyboard's
  backspace, which read a fixed two-code-unit window and so deleted only the invisible selector —
  `lastGlyphLength` in `app/containers/MessageComposer/helpers` measures the whole sequence now.
- 175 lost one, in every case immediately before a skin tone modifier — `:man_detective_tone1:` is
  `1F575 1F3FB 200D 2642 FE0F` where the old map had `1F575 FE0F 1F3FB 200D 2642 FE0F`. The modifier
  already forces emoji presentation, so the selector in front of it was ill-formed (UTS #51).

Only seven values changed glyph, all repairs of a missing joiner, and each is asserted in
`JOINER_REPAIRS`, a fixture in `data.test.ts` — not a [pin](#pinned-shortnames), which is a
generation-time override. Nothing resolvable was dropped. Do not "restore" the old selectors — a test
guards against reintroducing the ill-formed ones.

## Legacy shortnames

`app/lib/constants/emojis/legacyShortnames.json` is **hand-maintained**, not generated. It holds
shortnames older clients resolved that `data.ts` does not carry — `:iphone:`, `:bride_with_veil:`
and around a thousand others, mostly the emojione-era tone naming, plus the 12 keycap components
the generator skips. `legacyShortnames.ts` re-exports it typed for the app; the generator requires
the same JSON.

Most entries are there because emojibase dropped the name; the keycaps are there because the
generator drops emojibase's component group. Either way removing one stops the name resolving, so
the distinction only matters when reading the script's "back in emojibase and can be removed"
warning — it compares against the generated map, so it never names a keycap.

They matter because reactions and the frequently used emojis table store _shortnames_: drop a name
and every stored reaction using it renders as literal `:shortname:` text. So entries are only
removed once nothing can still hold them.

`useShortnameToUnicode` falls back to this map, and the generator folds these names into
`aliasesByEmojiName` so they stay searchable. If emojibase starts listing one again, the script
prints it as removable.

## Pinned shortnames

`scripts/pinned-shortnames.js` is **hand-maintained**, and build-time only — the generator applies it
over the emojibase value, so the pin lands in `data.ts` and nothing reverse-maps at runtime. It
exists because the generated map is read first: `useShortnameToUnicode` falls back to
`legacyShortnames.json`, so a hand-maintained map can add a name but never hold one.

Pins hold a shortname at the glyph a previous release resolved, for the cases where upstream
reassigns a name to a different emoji — `:beetle:` (🐞 upstream became `:lady_beetle:` when Unicode 13
gave the beetle its own glyph) and `:man_in_tuxedo:` with its tone variants (🤵 upstream became
`:person_in_tuxedo:`). Without a pin those reactions and frequently used entries change glyph under
users who already picked them.

Only names an older client could have stored belong here — the pre-emojibase map had
`:man_in_tuxedo_tone1:`, so that is pinned, and never had `:man_in_tuxedo_light_skin_tone:`, so that
one takes the upstream value.

The cost is that mobile disagrees with web on a pinned name, and that the displaced glyph can lose
its only shortname: 🪲 and 🤵‍♂️ are unreachable today, and appear in the picker as a second 🐞 and a
second 🤵. The script prints that, along with pins that now match emojibase and can be removed, and
pins whose name emojibase dropped entirely — those belong in `legacyShortnames.json` instead.

## Invariants

`app/lib/constants/emojis/data.test.ts` guards the ones that broke before: every listed emoji
resolves, no emoji is listed twice, aliases are keyed by a listed name and resolve to the same
glyph as that name, no category is empty, no legacy shortname shadows a current one, every pin
still holds at the glyph `PINNED_GLYPHS` spells out, every joiner repair still has the value this
branch decided on, no value puts a variation selector before a skin tone modifier, and every
unlisted component still resolves — from either map, since the keycaps only resolve from the
legacy one. Run it after regenerating — a bump that moves a glyph should fail there and be
answered with a pin or an updated fixture, not a silent diff.
