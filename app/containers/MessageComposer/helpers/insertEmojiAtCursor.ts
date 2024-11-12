export const insertEmojiAtCursor = (text: string, emojiText: string, cursor: number) => {
	let updatedCursor = cursor + emojiText.length;

	const firstPart = text.substr(0, cursor);
	const lastPart = text.substr(cursor);

	const spaceBefore = firstPart.endsWith(' ') || firstPart.length === 0 ? '' : ' ';
	const spaceAfter = lastPart.startsWith(' ') || lastPart.length === 0 ? '' : ' ';

	const updatedText = `${firstPart}${spaceBefore}${emojiText}${spaceAfter}${lastPart}`;
	updatedCursor += spaceBefore ? 1 : 0;
	updatedCursor += spaceAfter ? 1 : 0;

	return {
		updatedCursor,
		updatedText
	};
};
