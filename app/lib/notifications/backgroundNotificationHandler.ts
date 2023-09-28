import notifee, { AndroidCategory, AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

import { INotification } from '../../definitions';

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

		// videoConf channel
		await notifee.createChannel({
			id: 'call',
			name: 'Video Call',
			lights: true,
			vibration: true,
			importance: AndroidImportance.HIGH,
			vibrationPattern: [300, 500]
		});
	}

	notifee.registerForegroundService(notification => new Promise(() => {}));

	notifee.onBackgroundEvent(e => new Promise(() => {}));
};

const setBackgroundNotificationHandler = async (): Promise<void> => {
	messaging().setBackgroundMessageHandler(async (notification: INotification) => {
		console.log('backgroundMessageHandler', notification);
		await notifee.displayNotification({
			title: '(21) 1234-1234',
			body: 'Incoming call',
			android: {
				channelId: 'call',
				category: AndroidCategory.CALL,
				visibility: AndroidVisibility.PUBLIC,
				importance: AndroidImportance.HIGH,
				smallIcon: 'ic_launcher',
				timestamp: Date.now(),
				showTimestamp: true,
				pressAction: {
					id: 'default',
					launchActivity: 'chat.rocket.reactnative.CustomCallActivity'
				},
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
					id: 'default',
					launchActivity: 'chat.rocket.reactnative.CustomCallActivity'
				}
			}
		});
	});
};

setBackgroundNotificationHandler();
