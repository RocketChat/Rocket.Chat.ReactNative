export function camelCaseToWords(s: string) {
	const result = s.replace(/([A-Z])/g, ' $1');
	return result.charAt(0).toUpperCase() + result.slice(1);
}
