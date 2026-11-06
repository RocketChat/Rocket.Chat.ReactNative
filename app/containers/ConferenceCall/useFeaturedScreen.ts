import { useCallback, useEffect, useState } from 'react';

import { useLiveRef } from '~/lib/hooks/useLiveRef';
import {
	nextPinnedScreen,
	pickFeaturedScreen,
	recordShareStarts,
	type ScreenShare,
	type ShareStarts
} from '~/lib/methods/helpers/pickFeaturedScreen';

type TPublication = { trackSid: string };

type TTracked = { starts: ShareStarts<TPublication>; pinned: string | null };

export const useFeaturedScreen = <Share extends ScreenShare<TPublication>>(
	shares: Share[]
): { featured: Share | null; others: Share[]; pin: (id: string) => void } => {
	const [tracked, setTracked] = useState<TTracked>({ starts: new Map(), pinned: null });
	const latest = useLiveRef(shares);
	const signature = shares.map(({ id, stream }) => `${id}:${stream.trackSid}`).join('|');

	useEffect(() => {
		setTracked(previous => {
			const { starts, started } = recordShareStarts(previous.starts, latest.current, Date.now());
			return { starts, pinned: nextPinnedScreen(previous.pinned, started, latest.current) };
		});
	}, [signature, latest]);

	const pin = useCallback((id: string) => setTracked(previous => ({ ...previous, pinned: id })), []);

	const featured = pickFeaturedScreen(shares, tracked.pinned, tracked.starts);
	const others = featured ? shares.filter(({ id }) => id !== featured.id) : [];

	return { featured, others, pin };
};
