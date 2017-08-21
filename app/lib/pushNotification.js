import Meteor from 'react-native-meteor';
import PushNotification from 'react-native-push-notification';
import { AsyncStorage } from 'react-native';
import Random from 'react-native-meteor/lib/Random';
import RocketChat from '../lib/rocketchat';

try {
	AsyncStorage.getItem('pushId')
		.then((pushId) => {
			if (!pushId) {
				AsyncStorage.setItem('pushId', Random.id());
			}
		});
} catch (error) {
// Error saving data
}

PushNotification.configure({

	// (optional) Called when Token is generated (iOS and Android)
	async onRegister({ token }) {


		console.log( 'TOKEN:', token );
		Meteor.Accounts.onLogin(async() => {
			console.log('onLogin');
			RocketChat.registerPushToken(await AsyncStorage.getItem('pushId'), { gcm: token })
				.then(sucesso => console.log('FOI -> ',sucesso))
				.catch(error => console.log('ERRO ->', error));
		});
	},

	// (required) Called when a remote or local notification is opened or received
	onNotification(notification) {
		console.log( 'NOTIFICATION:', notification );
	},

	// ANDROID ONLY: GCM Sender ID (optional - not required for local notifications, but is need to receive remote push notifications)
	senderID: '673693445664',

	// IOS ONLY (optional): default: all - Permissions to register.
	permissions: {
		alert: true,
		badge: true,
		sound: true
	},

	// Should the initial notification be popped automatically
	// default: true
	popInitialNotification: false,

	/**
      * (optional) default: true
      * - Specified if permissions (ios) and token (android and ios) will requested or not,
      * - if not, you must call PushNotificationsHandler.requestPermissions() later
      */
	requestPermissions: true
});
