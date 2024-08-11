import React from 'react';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

class FirebaseMessagingComponent extends React.Component {
	private unsubscribeMessaging: () => void | undefined;

	componentDidMount() {
		this.requestFCMPermission();

		messaging().setBackgroundMessageHandler(async remoteMessage => {
			this.onMessageHandler(remoteMessage);
		});

		this.unsubscribeMessaging = messaging().onMessage(async remoteMessage => {
			this.onMessageHandler(remoteMessage);
		});
	}

	componentWillUnmount() {
		if (this.unsubscribeMessaging) {
			this.unsubscribeMessaging();
		}
	}

	private async requestFCMPermission(): Promise<void> {
		const authResponse = await messaging().requestPermission();
		const enabled =
			authResponse === messaging.AuthorizationStatus.AUTHORIZED || authResponse === messaging.AuthorizationStatus.PROVISIONAL;

		if (enabled) {
			await messaging()
				.getToken()
				.then(e => {
					console.error(e, 'this isa fcm token');
				});
			messaging().subscribeToTopic('all');
			messaging().subscribeToTopic('version');
		}
	}

	private async createNotificationChannel() {
		const channelId = await notifee.createChannel({
			id: 'default',
			name: 'Default Channel',
			importance: AndroidImportance.HIGH
		});
		return channelId;
	}

	private async onMessageHandler(remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
		const channelId = await this.createNotificationChannel();
		const { data } = remoteMessage;
		const title = data?.title || '';
		const body = data?.body || '';
		await notifee.displayNotification({
			title,
			body,
			data
		});
	}

	render() {
		// This component doesn't render anything
		return null;
	}
}

export default FirebaseMessagingComponent;
