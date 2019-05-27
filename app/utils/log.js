import firebase from 'react-native-firebase';

export default (event, error) => {
	if (typeof error !== 'object') {
		error = { error };
	}
	firebase.analytics().logEvent(event);
	if (__DEV__) {
		console.warn(event, error);
	}
};
