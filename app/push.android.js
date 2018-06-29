import { NotificationsAndroid } from 'react-native-notifications';
import { AsyncStorage } from 'react-native';

console.warn('NotificationsAndroid')

// On Android, we allow for only one (global) listener per each event type.
NotificationsAndroid.setRegistrationTokenUpdateListener((deviceToken) => {
	// TODO: Send the token to my server so it could send back push notifications...
	console.warn('Push-notifications registered!');
	AsyncStorage.setItem('pushId', deviceToken);
});
