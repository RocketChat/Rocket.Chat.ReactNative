import notifee, { AndroidCategory, AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import ejson from 'ejson';
import { Alert } from 'react-native';

import i18n from '../../i18n';
import { BACKGROUND_PUSH_COLOR } from '../constants';

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

	notifee.onBackgroundEvent(
		event =>
			new Promise(() => {
				console.log('onBackgroundEvent', event);
			})
	);
};

function getNumbersAndLettersOnly(inputString: string) {
	// Replace all characters that are NOT (A-Z, a-z, or 0-9) with an empty string
	return inputString.replace(/[^A-Za-z0-9]/g, '');
}

const setBackgroundNotificationHandler = (): void => {
	messaging().setBackgroundMessageHandler(async (n: any) => {
		const notification = ejson.parse(n.data.ejson);
		console.log('setBackgroundMessageHandler', n);
		if (notification?.notificationType === 'videoconf') {
			if (notification.status === 0) {
				await notifee.displayNotification({
					id: getNumbersAndLettersOnly(notification.rid + notification.caller._id),
					title: i18n.t('conference_call'),
					body: `${i18n.t('Incoming_call_from')} ${notification.caller.name}`,
					data: notification,
					android: {
						channelId: 'video-conf-call',
						category: AndroidCategory.CALL,
						visibility: AndroidVisibility.PUBLIC,
						importance: AndroidImportance.HIGH,
						smallIcon: 'ic_notification',
						timestamp: Date.now(),
						color: BACKGROUND_PUSH_COLOR,
						actions: [
							{
								title: i18n.t('accept'),
								pressAction: {
									id: 'accept',
									launchActivity: 'default'
								}
							},
							{
								title: i18n.t('decline'),
								pressAction: {
									id: 'decline'
								}
							}
						],
						lightUpScreen: true
					}
				});
			}
			if (notification.status === 4) {
				const notification = ejson.parse(n.data.ejson);
				await notifee.cancelNotification(getNumbersAndLettersOnly(notification.rid + notification.caller._id));
			}
		}
		return null;
	});
};

setBackgroundNotificationHandler();
