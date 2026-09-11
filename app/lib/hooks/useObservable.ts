import { useCallback, useRef, useSyncExternalStore } from 'react';
import { type Observable } from 'rxjs';

type Emission<T> = { source: Observable<T>; value: T };

export function useObservable<T>(observable: Observable<T> | undefined): T | undefined {
	const latestEmission = useRef<Emission<T> | undefined>(undefined);

	const subscribe = useCallback(
		(onChange: () => void) => {
			if (!observable) {
				return () => {};
			}
			const subscription = observable.subscribe(value => {
				latestEmission.current = { source: observable, value };
				onChange();
			});
			return () => subscription.unsubscribe();
		},
		[observable]
	);

	return useSyncExternalStore(subscribe, () => {
		const emission = latestEmission.current;
		return emission && emission.source === observable ? emission.value : undefined;
	});
}
