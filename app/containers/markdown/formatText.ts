// Support <http://link|Text>
export const formatText = (text: string) =>
	text.replace(
		new RegExp('(?:<|<)((?:https|http):\\/\\/[^\\|]+)\\|(.+?)(?=>|>)(?:>|>)', 'gm'),
		(match, url, title) => `[${title}](${url})`
	);
