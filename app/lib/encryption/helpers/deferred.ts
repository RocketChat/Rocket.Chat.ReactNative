export default class Deferred {
	private promise: Promise<unknown>;
	private _resolve: (value?: unknown) => void;
	private _reject: (reason?: any) => void;

	constructor() {
		this._resolve = () => {};
		this._reject = () => {};
		this.promise = new Promise((resolve, reject) => {
			this._resolve = resolve as (value?: unknown) => void;
			this._reject = reject;
		});
	}

	public then<TResult1, TResult2>(
		onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | undefined | null,
		onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
	): Promise<TResult1 | TResult2> {
		return this.promise.then(onfulfilled, onrejected);
	}

	public catch<TResult>(
		onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
	): Promise<unknown | TResult> {
		return this.promise.catch(onrejected);
	}

	public finally(onfinally?: (() => void) | null | undefined): Promise<unknown> {
		return this.promise.finally(onfinally);
	}

	public resolve(value?: unknown): void {
		this._resolve(value);
	}

	public reject(reason?: any): void {
		this._reject(reason);
	}
}
