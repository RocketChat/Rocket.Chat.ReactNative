/**
 * Serialized write queue — promise-chain mutex.
 * Ensures only one writer runs at a time, matching WMDB single-writer semantics.
 */

export class WriterQueue {
	private _tail: Promise<void> = Promise.resolve();

	/** Enqueue a writer fn. Returns the result of fn. */
	enqueue<T>(fn: () => Promise<T>): Promise<T> {
		let resolve!: (value: T | PromiseLike<T>) => void;
		let reject!: (reason?: unknown) => void;

		const result = new Promise<T>((res, rej) => {
			resolve = res;
			reject = rej;
		});

		this._tail = this._tail
			.then(async () => {
				try {
					resolve(await fn());
				} catch (e) {
					reject(e);
				}
			})
			.then(
				() => undefined,
				() => undefined
			);

		return result;
	}
}
