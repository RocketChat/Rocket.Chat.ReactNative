import notifee, { AndroidCategory, AndroidFlags, AndroidImportance, AndroidVisibility, Event } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ejson from 'ejson';

import { deepLinkingClickCallPush } from '../../../actions/deepLinking';
import i18n from '../../../i18n';
import { colors } from '../../constants';
import { store } from '../../store/auxStore';

const VIDEO_CONF_CHANNEL = 'video-conf-call';
const VIDEO_CONF_TYPE = 'videoconf';

interface Caller {
	_id?: string;
	name?: string;
}

interface NotificationData {
	notificationType?: string;
	status?: number;
	rid?: string;
	caller?: Caller;
}

const createChannel = () =>
	notifee.createChannel({
		id: VIDEO_CONF_CHANNEL,
		name: 'Video Call',
		lights: true,
		vibration: true,
		importance: AndroidImportance.HIGH,
		sound: 'ringtone'
	});

const handleBackgroundEvent = async (event: Event) => {
	const { pressAction, notification } = event.detail;
	const notificationData = notification?.data;
	if (
		typeof notificationData?.caller === 'object' &&
		(notificationData.caller as Caller)?._id &&
		(event.type === 1 || event.type === 2)
	) {
		if (store?.getState()?.app.ready) {
			store.dispatch(deepLinkingClickCallPush({ ...notificationData, event: pressAction?.id }));
		} else {
			AsyncStorage.setItem('pushNotification', JSON.stringify({ ...notificationData, event: pressAction?.id }));
		}
		await notifee.cancelNotification(
			`${notificationData.rid}${(notificationData.caller as Caller)._id}`.replace(/[^A-Za-z0-9]/g, '')
		);
	}
};

const backgroundNotificationHandler = () => {
	notifee.onBackgroundEvent(handleBackgroundEvent);
};

const displayVideoConferenceNotification = async (notification: NotificationData) => {
	const id = `${notification.rid}${notification.caller?._id}`.replace(/[^A-Za-z0-9]/g, '');
	const actions = [
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
	];

	await notifee.displayNotification({
		id,
		title: i18n.t('conference_call'),
		body: `${i18n.t('Incoming_call_from')} ${notification.caller?.name}`,
		data: notification as { [key: string]: string | number | object },
		android: {
			channelId: VIDEO_CONF_CHANNEL,
			category: AndroidCategory.CALL,
			visibility: AndroidVisibility.PUBLIC,
			importance: AndroidImportance.HIGH,
			smallIcon: 'ic_notification',
			color: colors.light.badgeBackgroundLevel4,
			actions,
			lightUpScreen: true,
			loopSound: true,
			sound: 'ringtone',
			autoCancel: false,
			ongoing: true,
			pressAction: {
				id: 'default',
				launchActivity: 'default'
			},
			flags: [AndroidFlags.FLAG_NO_CLEAR]
		}
	});
};

const setBackgroundNotificationHandler = () => {
	createChannel();
	messaging().setBackgroundMessageHandler(async message => {
		if (message?.data?.ejson) {
			const notification: NotificationData = ejson.parse(message?.data?.ejson as string);
			if (notification?.notificationType === VIDEO_CONF_TYPE) {
				if (notification.status === 0) {
					await displayVideoConferenceNotification(notification);
				} else if (notification.status === 4) {
					const id = `${notification.rid}${notification.caller?._id}`.replace(/[^A-Za-z0-9]/g, '');
					await notifee.cancelNotification(id);
				}
			}
		}

		return null;
	});
};

setBackgroundNotificationHandler();
backgroundNotificationHandler();
