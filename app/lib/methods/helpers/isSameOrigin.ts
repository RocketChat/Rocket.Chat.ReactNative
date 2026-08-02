export const isSameOrigin = (url: string, origin?: string): boolean => {
	if (!origin) {
		return false;
	}
	try {
		const target = new URL(url, origin);
		const base = new URL(origin);
		if (target.origin !== base.origin) {
			return false;
		}
		const basePath = base.pathname.endsWith('/') ? base.pathname : `${base.pathname}/`;
		const targetPath = target.pathname.endsWith('/') ? target.pathname : `${target.pathname}/`;
		return targetPath.startsWith(basePath);
	} catch {
		return false;
	}
};
