// @ts-ignore
// TODO BUMP LIB VERSION
import NotificationsIOS, { NotificationAction, NotificationCategory, Notification } from 'react-native-notifications';

import reduxStore from '../../lib/createStore';
import I18n from '../../i18n';
import { INotification } from '../../definitions/INotification';

class PushNotification {
	onNotification: (notification: Notification) => void;
	deviceToken: string;

	constructor() {
		this.onNotification = () => {};
		this.deviceToken = '';

		NotificationsIOS.addEventListener('remoteNotificationsRegistered', (deviceToken: string) => {
			this.deviceToken = deviceToken;
		});

		NotificationsIOS.addEventListener('notificationOpened', (notification: Notification, completion: () => void) => {
			// TODO REDUX MIGRATION TO TS
			const { background } = reduxStore.getState().app;
			if (background) {
				this.onNotification(notification);
			}
			completion();
		});

		const actions = [
			new NotificationCategory({
				identifier: 'MESSAGE',
				actions: [
					new NotificationAction({
						activationMode: 'background',
						title: I18n.t('Reply'),
						textInput: {
							buttonTitle: I18n.t('Reply'),
							placeholder: I18n.t('Type_message')
						},
						identifier: 'REPLY_ACTION'
					})
				]
			})
		];
		NotificationsIOS.requestPermissions(actions);
	}

	getDeviceToken() {
		return this.deviceToken;
	}

	setBadgeCount = (count = 0) => {
		NotificationsIOS.setBadgesCount(count);
	};

	async configure(onNotification: (notification: INotification) => void) {
		this.onNotification = onNotification;
		const initial = await NotificationsIOS.getInitialNotification();
		return Promise.resolve(initial);
	}
}
export default new PushNotification();
