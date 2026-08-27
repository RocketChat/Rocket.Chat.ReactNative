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

| Export                  | Contents                                                                          |
| ----------------------- | --------------------------------------------------------------------------------- |
| `emojisByCategory`      | The names the picker lists, per category tab                                      |
| `shortnameToUnicodeMap` | Every resolvable `:shortname:` → unicode, aliases and skin tone variants included |
| `aliasesByEmojiName`    | Alternate names for an emoji, keyed by the name listed in `emojisByCategory`      |

The output is committed, like `mappedIcons.js` (see [icons](./icons.md)). Nothing in the build or
release runs the script — bumping the emoji set means bumping `emojibase-data` in `package.json`,
re-running the script, reviewing the diff and committing it. `emojibase-data` is dev-only and
never reaches the bundle; the generated file does, exactly as a hand-written one would.

Do not edit `data.ts` by hand — the two datasets drifting apart is what this replaced.

Shortname resolution matches web:

- One name per emoji is listed, taken from joypixels shortcodes, falling back to emojibase.
- The remaining shortcodes become aliases, so search matches them but returns the listed name.
- Emojibase's component group (skin tones, hair styles), the regional indicator letters and the
  keycap components (`:digit_zero:`–`:digit_nine:`, `:asterisk_symbol:`, `:pound_symbol:`) are
  skipped: they are building blocks, not emojis to list. The pre-emojibase picker listed all 38, so
  they no longer turn up in search — they still resolve, which is what stored reactions need.
- Skin tone variants resolve but are not listed or searchable, since the picker has no tone
  selector. Remove that exclusion in the generator if one is ever added.

## Variation selectors

Regenerating moved 333 values by a variation selector (`U+FE0F`) only, in both directions, and both
are emojibase emitting the fully-qualified sequence:

- 158 gained one, on bases that already default to emoji presentation — `:alien:` is `1F47D FE0F`
  where the old map had `1F47D`. Cosmetic; the glyph is the same.
- 175 lost one, in every case immediately before a skin tone modifier — `:man_detective_tone1:` is
  `1F575 1F3FB 200D 2642 FE0F` where the old map had `1F575 FE0F 1F3FB 200D 2642 FE0F`. The modifier
  already forces emoji presentation, so the selector in front of it was ill-formed (UTS #51).

Only seven values changed glyph, all repairs of a missing joiner, and they are pinned in
`CHANGED_GLYPHS`. Nothing resolvable was dropped. Do not "restore" the old selectors — a test
guards against reintroducing the ill-formed ones.

## Legacy shortnames

`app/lib/constants/emojis/legacyShortnames.json` is **hand-maintained**, not generated. It holds
shortnames older clients resolved that emojibase no longer lists — `:iphone:`, `:bride_with_veil:`
and around a thousand others, mostly the emojione-era tone naming. `legacyShortnames.ts` re-exports
it typed for the app; the generator requires the same JSON.

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
still holds, every glyph that changed against the pre-emojibase map still has the value this branch
decided on, no value puts a variation selector before a skin tone modifier, and every unlisted
component still resolves. Run it after regenerating — a bump that moves a glyph should fail there and be
answered with a pin or an updated fixture, not a silent diff.
