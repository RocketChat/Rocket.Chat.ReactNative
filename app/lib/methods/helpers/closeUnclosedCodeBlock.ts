export const closeUnclosedCodeBlock = (text: string): string => {
	const fences = (text.match(/`+/g) || []).filter(run => run.length === 3).length;
	return fences % 2 ? `${text}\n\`\`\`` : text;
};
