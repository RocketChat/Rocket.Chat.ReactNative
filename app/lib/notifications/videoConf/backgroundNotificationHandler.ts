import notifee, { AndroidCategory, AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import ejson from 'ejson';

import { deepLinkingClickCallPush } from '../../../actions/deepLinking';
import i18n from '../../../i18n';
import { BACKGROUND_PUSH_COLOR } from '../../constants';
import { store } from '../../store/auxStore';

const backgroundNotificationHandler = async (): Promise<void> => {
	await notifee.createChannel({
		id: 'video-conf-call',
		name: 'Video Call',
		lights: true,
		vibration: true,
		importance: AndroidImportance.HIGH,
		sound: 'ringtone'
	});

	notifee.onBackgroundEvent(async event => {
		if (event.detail.pressAction?.id === 'accept' || event.detail.pressAction?.id === 'decline') {
			const notificationData = event.detail?.notification?.data;
			if (typeof notificationData?.caller === 'object' && (notificationData.caller as any)._id) {
				store.dispatch(deepLinkingClickCallPush({ ...notificationData, event: event.detail.pressAction?.id }));
				await notifee.cancelNotification(
					`${notificationData.rid}${(notificationData.caller as any)._id}`.replace(/[^A-Za-z0-9]/g, '')
				);
			}
		}
	});
};

interface NotificationData {
	notificationType?: string;
	status?: number;
	rid?: string;
	caller?: {
		_id?: string;
		name?: string;
	};
}

const setBackgroundNotificationHandler = (): void => {
	messaging().setBackgroundMessageHandler(async message => {
		const notification: NotificationData = ejson.parse(message?.data?.ejson as string);

		if (notification?.notificationType === 'videoconf') {
			const id = `${notification?.rid}${notification?.caller?._id}`.replace(/[^A-Za-z0-9]/g, '');
			if (notification.status === 0) {
				await notifee.displayNotification({
					id,
					title: i18n.t('conference_call'),
					body: `${i18n.t('Incoming_call_from')} ${notification?.caller?.name}`,
					data: notification as { [key: string]: string | number | object },
					android: {
						channelId: 'video-conf-call',
						category: AndroidCategory.CALL,
						visibility: AndroidVisibility.PUBLIC,
						importance: AndroidImportance.HIGH,
						smallIcon: 'ic_notification',
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
									id: 'decline',
									launchActivity: 'default'
								}
							}
						],
						lightUpScreen: true,
						loopSound: true,
						sound: 'ringtone',
						autoCancel: false,
						ongoing: true
					}
				});
			} else if (notification.status === 4) {
				await notifee.cancelNotification(id);
			}
		}
		return null;
	});
};

setBackgroundNotificationHandler();
backgroundNotificationHandler();
