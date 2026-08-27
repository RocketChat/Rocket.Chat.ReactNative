// Hand-maintained pins — safe to edit.
//
// Shortnames held at the glyph a previous release resolved, over whatever emojibase points them at
// now. Reactions and the frequently used emojis table store shortnames, so an upstream reassignment
// silently changes an emoji a user already picked. `scripts/generate-emoji-data.js` applies these
// over the emojibase value and warns when a pin stops earning its place. See docs/emojis.md.
//
// Only names an older client could have stored belong here: `:man_in_tuxedo_tone1:` is pinned
// because the pre-emojibase map resolved it, `:man_in_tuxedo_light_skin_tone:` is not because that
// map never had it.

module.exports = {
	// Unicode 13 gave the beetle its own glyph; 🐞 is `:lady_beetle:` upstream.
	':beetle:': '🐞',
	// Emojibase points `man_in_tuxedo` at the gendered sequence; 🤵 is `:person_in_tuxedo:` upstream.
	':man_in_tuxedo:': '🤵',
	':man_in_tuxedo_tone1:': '🤵🏻',
	':man_in_tuxedo_tone2:': '🤵🏼',
	':man_in_tuxedo_tone3:': '🤵🏽',
	':man_in_tuxedo_tone4:': '🤵🏾',
	':man_in_tuxedo_tone5:': '🤵🏿'
};
