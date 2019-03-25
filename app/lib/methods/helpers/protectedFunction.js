import { Answers } from 'react-native-fabric';

export default fn => (...params) => {
	try {
		fn(...params);
	} catch (e) {
		let error = e;
		if (typeof error !== 'object') {
			error = { error };
		}
		Answers.logCustom('error', error);
		if (__DEV__) {
			alert(error);
		}
	}
};
