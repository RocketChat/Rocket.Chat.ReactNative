export const getMessageIdFromPermalink = (permalink?: string): string | undefined => {
	if (!permalink) {
		return undefined;
	}
	const [, messageId] = permalink.match(/[?&]msg=([^&#]+)/) ?? [];
	return messageId || undefined;
};
