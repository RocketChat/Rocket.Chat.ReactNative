// Wraps the current selection (or the cursor when nothing is selected) in a fenced code block.
// Fenced code blocks are only parsed when the ``` markers sit alone on their own line, so the
// opening and closing fences are placed on dedicated lines and separated from the surrounding
// text. The cursor is left on the (possibly empty) content line between the fences.
// See https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/7099
interface ISelectionRange {
	start: number;
	end: number;
}

interface IWrapCodeBlockResult {
	updatedText: string;
	selection: ISelectionRange;
}

export const wrapCodeBlock = (text: string, start: number, end: number): IWrapCodeBlockResult => {
	const before = text.substring(0, start);
	const selected = text.substring(start, end);
	const after = text.substring(end);

	const prefix = before.length > 0 && !before.endsWith('\n') ? '\n```\n' : '```\n';
	const suffix = after.length > 0 && !after.startsWith('\n') ? '\n```\n' : '\n```';

	const updatedText = `${before}${prefix}${selected}${suffix}${after}`;
	const cursor = before.length + prefix.length;

	return {
		updatedText,
		selection: { start: cursor, end: cursor + selected.length }
	};
};
