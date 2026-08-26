export default class Deferred<T = void> {
	private promise: Promise<T>;
	private _resolve: (value: T) => void;
	private _reject: (reason?: any) => void;

	constructor() {
		this._resolve = () => {};
		this._reject = () => {};
		this.promise = new Promise((resolve, reject) => {
			this._resolve = resolve;
			this._reject = reject;
		});
	}

	public then<TResult1 = T, TResult2 = never>(
		onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
		onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
	): Promise<TResult1 | TResult2> {
		return this.promise.then(onfulfilled, onrejected);
	}

	public catch<TResult = never>(
		onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
	): Promise<T | TResult> {
		return this.promise.catch(onrejected);
	}

	public finally(onfinally?: (() => void) | null | undefined): Promise<T> {
		return this.promise.finally(onfinally);
	}

	public resolve(value: T): void {
		this._resolve(value);
	}

	public reject(reason?: any): void {
		this._reject(reason);
	}
}
