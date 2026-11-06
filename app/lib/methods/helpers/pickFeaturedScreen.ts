export type ScreenShare<Stream extends object = object> = {
	id: string;
	stream: Stream;
	name?: string;
	isLocal: boolean;
};

export type ShareStart<Stream extends object = object> = { stream: Stream; startedAt: number };

export type ShareStarts<Stream extends object = object> = ReadonlyMap<string, ShareStart<Stream>>;

export const recordShareStarts = <Stream extends object>(
	starts: ShareStarts<Stream>,
	shares: ScreenShare<Stream>[],
	now: number
): { starts: Map<string, ShareStart<Stream>>; started: string | null } => {
	const next = new Map<string, ShareStart<Stream>>();
	let started: string | null = null;
	for (const { id, stream } of shares) {
		const existing = starts.get(id);
		if (existing?.stream === stream) {
			next.set(id, existing);
		} else {
			next.set(id, { stream, startedAt: now });
			started = id;
		}
	}
	return { starts: next, started };
};

export const nextPinnedScreen = (pinned: string | null, started: string | null, shares: { id: string }[]): string | null => {
	if (started !== null) return started;
	if (pinned && !shares.some(({ id }) => id === pinned)) return null;
	return pinned;
};

export const pickFeaturedScreen = <Share extends { id: string }>(
	shares: Share[],
	pinned: string | null,
	starts: ReadonlyMap<string, { startedAt: number }>
): Share | null => {
	if (shares.length === 0) return null;
	const pinnedShare = pinned ? shares.find(({ id }) => id === pinned) : undefined;
	if (pinnedShare) return pinnedShare;
	const startedAtOf = ({ id }: Share): number => starts.get(id)?.startedAt ?? 0;
	return [...shares].sort((a, b) => startedAtOf(b) - startedAtOf(a))[0];
};
