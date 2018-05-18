import { Answers } from 'react-native-fabric';

export default (event, error) => {
	Answers.logCustom(event, error);
	if (__DEV__) {
		console.warn(event, error);
	}
};
