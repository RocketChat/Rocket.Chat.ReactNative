import notifee, { AndroidCategory, AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';
import ejson from 'ejson';

export const backgroundNotificationHandler = async (): Promise<void> => {
	// 1. get info on the device and the Power Manager settings
	const powerManagerInfo = await notifee.getPowerManagerInfo();
	if (powerManagerInfo.activity) {
		// 2. ask your users to adjust their settings
		Alert.alert(
			'Restrictions Detected',
			'To ensure notifications are delivered, please adjust your settings to prevent the app from being killed',
			[
				// 3. launch intent to navigate the user to the appropriate screen
				{
					text: 'OK, open settings',
					onPress: notifee.openPowerManagerSettings
				},
				{
					text: 'Cancel',
					onPress: () => {
						// TODO: handle cancel
					},
					style: 'cancel'
				}
			],
			{ cancelable: false }
		);
	}

	const batteryOptimizationEnabled = await notifee.isBatteryOptimizationEnabled();
	if (batteryOptimizationEnabled) {
		// 2. ask your users to disable the feature
		Alert.alert(
			'Restrictions Detected',
			'To ensure notifications are delivered, please disable battery optimization for the app.',
			[
				// 3. launch intent to navigate the user to the appropriate screen
				{
					text: 'OK, open settings',
					onPress: notifee.openBatteryOptimizationSettings
				},
				{
					text: 'Cancel',
					onPress: () => {
						// TODO: handle cancel
					},
					style: 'cancel'
				}
			],
			{ cancelable: false }
		);
	}

	// videoConf channel
	await notifee.createChannel({
		id: 'video-conf-call',
		name: 'Video Call',
		lights: true,
		vibration: true,
		importance: AndroidImportance.HIGH
	});

	notifee.registerForegroundService(
		notification =>
			new Promise(() => {
				console.log('registerForegroundService', notification);
			})
	);

	notifee.onBackgroundEvent(
		event =>
			new Promise(() => {
				console.log('onBackgroundEvent', event);
			})
	);
};

const setBackgroundNotificationHandler = async (): Promise<void> => {
	messaging().setBackgroundMessageHandler(async (n: any) => {
		const notification = ejson.parse(n.data.ejson);
		console.log('setBackgroundMessageHandler', notification, n);
		if (notification) {
			await notifee.displayNotification({
				title: notification.sender?.name || notification.sender.username || 'Rocket.Chat',
				body: 'Incoming call',
				android: {
					channelId: 'video-conf-call',
					category: AndroidCategory.CALL,
					visibility: AndroidVisibility.PUBLIC,
					importance: AndroidImportance.HIGH,
					smallIcon: 'ic_notification',
					timestamp: Date.now(),
					color: '#F5455C',
					actions: [
						{
							title: 'Accept',
							pressAction: {
								id: 'accept',
								launchActivity: 'default'
							}
						},
						{
							title: 'Decline',
							pressAction: {
								id: 'reject'
							}
						}
					],
					fullScreenAction: {
						id: 'full-screen',
						launchActivity: 'chat.rocket.reactnative.CustomCallActivity'
					},
					lightUpScreen: true
				}
			});
		}
	});
};

setBackgroundNotificationHandler();
