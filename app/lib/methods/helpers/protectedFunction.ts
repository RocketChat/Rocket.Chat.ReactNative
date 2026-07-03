export default <T extends (...args: any[]) => any>(fn: T): ((...params: Parameters<T>) => void) =>
	(...params: Parameters<T>) => {
		try {
			const result = fn(...params);
			if (result && typeof result.catch === 'function') {
				result.catch((e: any) => {
					console.log(e);
				});
			}
		} catch (e) {
			console.log(e);
		}
	};
