export const isSameOrigin = (url: string, origin?: string): boolean => {
	if (!origin) {
		return true;
	}
	try {
		return new URL(url).origin === new URL(origin).origin;
	} catch {
		// Relative/internal URL — safe to attach auth headers.
		return true;
	}
};
