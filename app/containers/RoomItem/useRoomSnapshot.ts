import { useCallback, useRef, useSyncExternalStore } from 'react';
import { skip } from 'rxjs';

import { type IRoomItemContainerProps } from './interfaces';

type TRoomItem = IRoomItemContainerProps['item'];

const takeSnapshot = (item: TRoomItem): TRoomItem => item.asPlain?.() ?? item;

export const useRoomSnapshot = (item: TRoomItem): TRoomItem => {
	const cache = useRef<{ source: TRoomItem; room: TRoomItem } | null>(null);

	const getSnapshot = () => {
		if (!cache.current || cache.current.source !== item) {
			cache.current = { source: item, room: takeSnapshot(item) };
		}
		return cache.current.room;
	};

	const subscribe = useCallback(
		(onStoreChange: () => void) => {
			const subscription = item
				.observe?.()
				.pipe(skip(1))
				.subscribe(() => {
					cache.current = { source: item, room: takeSnapshot(item) };
					onStoreChange();
				});
			return () => subscription?.unsubscribe();
		},
		[item]
	);

	return useSyncExternalStore(subscribe, getSnapshot);
};
