import { BehaviorSubject, Observable } from 'rxjs';

export const createObservableRecord = <T extends Record<string, unknown>>(initialRow: T) => {
	const record = { ...initialRow } as T & { observe: jest.Mock };
	const subject = new BehaviorSubject<T>(record as T);
	const unsubscribe = jest.fn();
	record.observe = jest.fn(
		() =>
			new Observable<T>(observer => {
				const subscription = subject.subscribe(observer);
				return () => {
					subscription.unsubscribe();
					unsubscribe();
				};
			})
	);

	return {
		record,
		unsubscribe,
		emit: (next: Partial<T>) => {
			Object.assign(record, next);
			subject.next(record as T);
		},
		complete: () => subject.complete()
	};
};

export const createObservableQuery = <T>(getInitialRows: () => T[] = () => []) => {
	const subject = new BehaviorSubject<T[]>(getInitialRows());
	const unsubscribe = jest.fn();
	const query = {
		observe: jest.fn(
			() =>
				new Observable<T[]>(observer => {
					const subscription = subject.subscribe(observer);
					return () => {
						subscription.unsubscribe();
						unsubscribe();
					};
				})
		)
	};

	return {
		query,
		unsubscribe,
		emit: (next: T[]) => subject.next(next),
		complete: () => subject.complete()
	};
};
