/**
 * Serialized write queue — promise-chain mutex.
 * Ensures only one writer runs at a time, matching WMDB single-writer semantics.
 */

export class WriterQueue {
	private _tail: Promise<void> = Promise.resolve();
	private _running = false;

	/** Enqueue a writer fn. Returns the result of fn. */
	enqueue<T>(fn: () => Promise<T>): Promise<T> {
		// Re-entrant call: a writer is already running on this queue, so this is a nested write
		// (the WMDB idiom db.write(() => collection.create()), where create()/update() call db.write()
		// again). Run it inline within the current writer — enqueuing it would deadlock, since the outer
		// fn awaits this inner one, which can't start until the outer fn resolves.
		if (this._running) {
			return fn();
		}

		let resolve!: (value: T | PromiseLike<T>) => void;
		let reject!: (reason?: unknown) => void;

		const result = new Promise<T>((res, rej) => {
			resolve = res;
			reject = rej;
		});

		this._tail = this._tail
			.then(async () => {
				this._running = true;
				try {
					resolve(await fn());
				} catch (e) {
					reject(e);
				} finally {
					this._running = false;
				}
			})
			.then(
				() => undefined,
				() => undefined
			);

		return result;
	}
}
