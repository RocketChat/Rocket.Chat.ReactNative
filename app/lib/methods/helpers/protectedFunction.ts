export default <T extends (...args: any[]) => any>(fn: T): ((...params: Parameters<T>) => void) =>
	(...params: Parameters<T>) => {
		try {
			fn(...params);
		} catch (e) {
			console.log(e);
		}
	};
