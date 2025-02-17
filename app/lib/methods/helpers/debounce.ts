import { useDebouncedCallback, type Options } from 'use-debounce';

export function debounce<F extends Function>(func: F, wait?: number, immediate?: boolean) {
	let timeout: ReturnType<typeof setTimeout> | null;
	function _debounce(this: ThisParameterType<F>, ...args: unknown[]) {
		const context: ThisParameterType<F> = this;
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

export function useDebounce(func: (...args: any) => any, wait?: number, options?: Options): (...args: any[]) => void {
	return useDebouncedCallback(func, wait || 1000, options);
}
