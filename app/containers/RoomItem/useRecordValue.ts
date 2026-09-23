import { useSyncExternalStore } from 'react';
import { type Observable } from 'rxjs';

interface IObservableRecord {
	observe?: () => Observable<unknown>;
}

export const useRecordValue = <TRecord extends IObservableRecord, TValue extends string | boolean>(
	item: TRecord,
	select: (item: TRecord) => TValue
): TValue => {
	const subscribe = (onRecordChange: () => void) => {
		const subscription = item.observe?.().subscribe(onRecordChange);
		return () => subscription?.unsubscribe();
	};
	return useSyncExternalStore(subscribe, () => select(item));
};
