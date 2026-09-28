export function decodeFilename(value: string): string;
export function decodeFilename(value?: string): string | undefined;
export function decodeFilename(value?: string): string | undefined {
	if (!value) {
		return value;
	}
	let decoded = value;
	for (let i = 0; i < 3; i += 1) {
		if (!decoded.includes('%')) {
			break;
		}
		try {
			const next = decodeURIComponent(decoded);
			if (next === decoded) {
				break;
			}
			decoded = next;
		} catch {
			try {
				const next = decodeURI(decoded);
				if (next === decoded) {
					break;
				}
				decoded = next;
			} catch {
				break;
			}
		}
	}
	return decoded;
}
