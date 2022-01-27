export default fn =>
	(...params) => {
		try {
			fn(...params);
		} catch (e) {
			console.log(e);
		}
	};
