// https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Promise.jsm/Deferred
export default class Deferred {
	constructor() {
		const promise = new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		});

		promise.resolve = this.resolve;
		promise.reject = this.reject;

		return promise;
	}
}
