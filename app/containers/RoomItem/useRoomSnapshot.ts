import { useCallback, useRef, useSyncExternalStore } from 'react';
import { type Observable } from 'rxjs';

type TObservableRoom<TRoom> = TRoom & {
	observe?: () => Observable<unknown>;
	asPlain?: () => TRoom;
};

const takeSnapshot = <TRoom extends object>(item: TObservableRoom<TRoom>): TRoom => (item.asPlain ? item.asPlain() : { ...item });

export const useRoomSnapshot = <TRoom extends object>(item: TObservableRoom<TRoom>): TRoom => {
	const cache = useRef<{ source: TObservableRoom<TRoom>; room: TRoom } | null>(null);

	const getSnapshot = () => {
		if (cache.current?.source !== item) {
			cache.current = { source: item, room: takeSnapshot(item) };
		}
		return cache.current.room;
	};

	const subscribe = useCallback(
		(onStoreChange: () => void) => {
			const subscription = item.observe?.().subscribe(() => {
				cache.current = { source: item, room: takeSnapshot(item) };
				onStoreChange();
			});
			return () => subscription?.unsubscribe();
		},
		[item]
	);

	return useSyncExternalStore(subscribe, getSnapshot);
};
