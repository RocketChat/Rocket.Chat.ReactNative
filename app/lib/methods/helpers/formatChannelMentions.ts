import { escapeRegExp } from 'lodash';

/** Structural subset of the two `IUserChannel` declarations in the codebase, so either one fits */
export type TMentionableChannel = { name: string; fname?: string };

/**
 * Rewrites `#<name>` mentions to `#<fname>` so plain-text surfaces show the same label as the
 * rendered message body. Discussions carry a server-generated, ID-like `name`, so without this
 * they read as `#aBcD123xyz` instead of `#My Discussion`.
 *
 * Only names present in `channels` are considered, and longer names are matched first, so a
 * mention is never partially replaced. With `dropSigil`, the `#` is left out (accessibility
 * labels announce the name alone).
 */
export const formatChannelMentions = (msg: string, channels?: TMentionableChannel[], dropSigil = false): string => {
	if (!msg || !channels?.length) {
		return msg;
	}

	// With the sigil kept, a channel whose fname matches its name would rewrite to the same text
	const rewrites = (channel: TMentionableChannel) => dropSigil || (channel.fname && channel.fname !== channel.name);
	const named = channels.filter(channel => channel?.name && rewrites(channel));
	if (!named.length) {
		return msg;
	}

	const byName = new Map(named.map(channel => [channel.name, channel.fname || channel.name]));
	// Longest first so `#abcdef` never resolves against a channel merely named `abc`
	const pattern = [...byName.keys()]
		.sort((a, b) => b.length - a.length)
		.map(escapeRegExp)
		.join('|');
	// Trailing `-`/word chars would mean a longer room name, so they must not terminate a mention.
	// A `.` is allowed to terminate one, since dotted names are matched by the longest-first pattern.
	const mention = new RegExp(`#(${pattern})(?![\\w-])`, 'g');

	return msg.replace(mention, (_, name: string) => `${dropSigil ? '' : '#'}${byName.get(name) ?? name}`);
};
