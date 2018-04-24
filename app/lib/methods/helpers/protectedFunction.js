import { Answers } from 'react-native-fabric';

export default fn => (params) => {
	try {
		fn(params);
	} catch (e) {
		Answers.logCustom('erro', e);
		if (__DEV__) {
			alert(e);
		}
	}
};
