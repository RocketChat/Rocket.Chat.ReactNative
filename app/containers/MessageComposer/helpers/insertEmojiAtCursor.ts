export const insertEmojiAtCursor = (text: string, emojiText: string, cursor: number) => {
	let updatedText = '';
	let updatedCursor = cursor + emojiText.length;

	const firstPart = text.substr(0, cursor);
	const lastPart = text.substr(cursor);

	if (firstPart[firstPart.length - 1] !== ' ') {
		updatedText = `${firstPart} ${emojiText}`;
		updatedCursor += 1;
	} else {
		updatedText = `${firstPart}${emojiText}`;
	}

	if (lastPart.length === 0) {
		return {
			updatedCursor,
			updatedText
		};
	}

	if (lastPart[0] !== ' ') {
		updatedText = `${updatedText} ${lastPart}`;
		updatedCursor += 1;
	} else {
		updatedText = `${updatedText}${lastPart}`;
	}
	return {
		updatedCursor,
		updatedText
	};
};
