import { type Root } from '@rocket.chat/message-parser';

export const toPlainTextRoot = (text: string): Root => {
	if (!text) {
		return [];
	}

	const lines = text.replace(/\r\n?/g, '\n').split('\n');

	if (lines.length > 1 && lines[lines.length - 1] === '') {
		lines.pop();
	}

	return lines.map(line =>
		line ? { type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: line }] } : { type: 'LINE_BREAK', value: undefined }
	) as Root;
};
