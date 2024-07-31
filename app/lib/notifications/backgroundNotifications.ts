import notifee, { AndroidCategory, AndroidImportance, AndroidVisibility, Event } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { deepLinkingClickCallPush } from '../../actions/deepLinking';
import { store } from '../store/auxStore';

const PUSH_NOTIFICATION_CHANNEL = 'push-notification-channel';

const createChannel = () =>
	notifee.createChannel({
		id: PUSH_NOTIFICATION_CHANNEL,
		name: 'Push Notification',
		lights: true,
		vibration: true,
		importance: AndroidImportance.HIGH,
		sound: 'default'
	});

const handleBackgroundEvent = async (event: Event) => {
	console.log('handleBackgroundEvent notifee', event);
	const { pressAction, notification } = event.detail;
	const notificationData = notification?.data;
	if (typeof notificationData?.caller === 'object' && (event.type === 1 || event.type === 2)) {
		if (store?.getState()?.app.ready) {
			store.dispatch(deepLinkingClickCallPush({ ...notificationData, event: pressAction?.id }));
		} else {
			AsyncStorage.setItem('pushNotification', JSON.stringify({ ...notificationData, event: pressAction?.id }));
		}
		await notifee.cancelNotification('canceled notification');
	}
};

const displayNotification = async (message: any) => {
	console.log('Received message:', message);
	const notificationData = message.notification;
	// const data = message.data;

	const notificationId = message.messageId;

	await notifee.displayNotification({
		id: notificationId,
		title: notificationData.title,
		body: notificationData.body,
		android: {
			channelId: PUSH_NOTIFICATION_CHANNEL,
			category: AndroidCategory.MESSAGE,
			visibility: AndroidVisibility.PUBLIC,
			importance: AndroidImportance.HIGH,
			smallIcon: 'ic_notification',
			color: '#1d74f5',
			sound: 'default',
			autoCancel: true,
			pressAction: {
				id: 'default',
				launchActivity: 'default'
			}
		}
	});
};

export const setBackgroundNotificationHandler = () => {
	console.log('setBackgroundNotificationHandler');
	createChannel();
	messaging().setBackgroundMessageHandler(async message => {
		console.log('Background message:', message);
		if (message.notification) {
			await displayNotification(message);
		}
		return null;
	});
};

export const backgroundNotificationHandler = () => {
	console.log('backgroundNotificationHandler');
	notifee.onBackgroundEvent(handleBackgroundEvent);
};

setBackgroundNotificationHandler();
backgroundNotificationHandler();
