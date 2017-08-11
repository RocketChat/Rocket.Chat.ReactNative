export default function throttle(fn, threshhold = 250, scope) {
	let last,
		deferTimer;
	return function() {
		const context = scope || this;

		let now = +new Date(),
			args = arguments;
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
}
