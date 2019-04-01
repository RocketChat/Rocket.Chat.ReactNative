export default function debounce(func, wait, immediate) {
	let timeout;
	function _debounce(...args) {
		const context = this;
		const later = function __debounce() {
			timeout = null;
			if (!immediate) { func.apply(context, args); }
		};
		const callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) { func.apply(context, args); }
	}
	_debounce.stop = () => clearTimeout(timeout);
	return _debounce;
}
