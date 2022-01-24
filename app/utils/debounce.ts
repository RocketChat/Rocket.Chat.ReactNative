export default function debounce(func: Function, wait?: number, immediate?: boolean) {
	let timeout: number | null;
	function _debounce(...args: any[]) {
		// @ts-ignore
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const context = this;
		const later = function __debounce() {
			timeout = null;
			if (!immediate) {
				func.apply(context, args);
			}
		};
		const callNow = immediate && !timeout;
		clearTimeout(timeout!);
		timeout = setTimeout(later, wait);
		if (callNow) {
			func.apply(context, args);
		}
	}
	_debounce.stop = () => clearTimeout(timeout!);
	return _debounce;
}
