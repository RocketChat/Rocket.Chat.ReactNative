import { Answers } from 'react-native-fabric';

export default fn => (params) => {
	try {
		fn(params);
	} catch (e) {
		Answers.logCustom('error', e);
		if (__DEV__) {
			alert(e);
		}
	}
};
