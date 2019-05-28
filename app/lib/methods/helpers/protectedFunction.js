export default fn => (...params) => {
	try {
		fn(...params);
	} catch (e) {
		let error = e;
		if (typeof error !== 'object') {
			error = { error };
		}
		if (__DEV__) {
			alert(error);
		}
	}
};
