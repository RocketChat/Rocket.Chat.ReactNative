import { parse, type Options, type Root } from '@rocket.chat/message-parser';

const PARSE_CACHE_MAX = 200;
const parseCache = new Map<string, Root>();

const cacheKey = (msg: string, options: Options): string =>
	options.katex ? `${Number(options.katex.dollarSyntax)}${Number(options.katex.parenthesisSyntax)}:${msg}` : `-:${msg}`;

export const parseMessage = (msg: string, options: Options): Root => {
	const key = cacheKey(msg, options);
	const cached = parseCache.get(key);
	if (cached) {
		return cached;
	}

	const tokens = parse(msg, options);

	if (parseCache.size >= PARSE_CACHE_MAX) {
		const oldestKey = parseCache.keys().next().value;
		if (oldestKey !== undefined) {
			parseCache.delete(oldestKey);
		}
	}

	parseCache.set(key, tokens);
	return tokens;
};
