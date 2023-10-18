import { useDebouncedCallback, Options } from 'use-debounce';

export function debounce(func: Function, wait?: number, immediate?: boolean) {
	let timeout: ReturnType<typeof setTimeout> | null;
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
		// @ts-ignore
		timeout = setTimeout(later, wait);
		if (callNow) {
			func.apply(context, args);
		}
	}
	_debounce.stop = () => clearTimeout(timeout!);
	return _debounce;
}

export function useDebounce(func: (...args: any) => any, wait?: number, options?: Options): (...args: any[]) => void {
	return useDebouncedCallback(func, wait || 1000, options);
}
