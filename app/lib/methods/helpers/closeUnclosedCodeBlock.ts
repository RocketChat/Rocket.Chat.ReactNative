export const closeUnclosedCodeBlock = (text: string): string => {
	let isOpen = false;
	for (const run of text.match(/`+/g) || []) {
		if (isOpen ? run.length >= 3 : run.length === 3) {
			isOpen = !isOpen;
		}
	}
	return isOpen ? `${text}\n\`\`\`` : text;
};
