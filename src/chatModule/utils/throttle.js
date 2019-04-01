export default function throttle(fn, threshhold = 250, scope) {
	let last;
	let deferTimer;

	const _throttle = (...args) => {
		const context = scope || this;

		const now = +new Date();

		if (last && now < last + threshhold) {
			// hold on to it
			clearTimeout(deferTimer);
			deferTimer = setTimeout(() => {
				last = now;
				fn.apply(context, args);
			}, threshhold);
		} else {
			last = now;
			fn.apply(context, args);
		}
	};

	_throttle.stop = () => clearTimeout(deferTimer);

	return _throttle;
}
