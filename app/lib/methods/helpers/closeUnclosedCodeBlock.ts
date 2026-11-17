export const closeUnclosedCodeBlock = (text: string): string =>
	(text.match(/```/g) || []).length % 2 ? `${text}\n\`\`\`` : text;
