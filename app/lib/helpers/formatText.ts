// Support <http://link|Text>
export const formatText = (text: string): string =>
	text.replace(
		new RegExp('(?:<|<)((?:https|http):\\/\\/[^\\|]+)\\|(.+?)(?=>|>)(?:>|>)', 'gm'),
		(_match, url, title) => `[${title}](${url})`
	);
