export const isSameOrigin = (url: string, origin?: string): boolean => {
	if (!origin) {
		return false;
	}
	try {
		return new URL(url, origin).origin === new URL(origin).origin;
	} catch {
		return false;
	}
};
