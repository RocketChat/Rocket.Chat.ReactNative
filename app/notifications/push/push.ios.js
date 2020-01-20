import NotificationsIOS, { NotificationAction, NotificationCategory } from 'react-native-notifications';

import reduxStore from '../../lib/createStore';
import I18n from '../../i18n';

const replyAction = new NotificationAction({
	activationMode: 'background',
	title: I18n.t('Reply'),
	textInput: {
		buttonTitle: I18n.t('Reply'),
		placeholder: I18n.t('Type_message')
	},
	identifier: 'REPLY_ACTION'
});

class PushNotification {
	constructor() {
		this.onRegister = null;
		this.onNotification = null;
		this.deviceToken = null;

		NotificationsIOS.addEventListener('remoteNotificationsRegistered', (deviceToken) => {
			this.deviceToken = deviceToken;
		});

		NotificationsIOS.addEventListener('notificationOpened', (notification, completion) => {
			const { background } = reduxStore.getState().app;
			if (background) {
				this.onNotification(notification);
			}
			completion();
		});

		const actions = [];
		actions.push(new NotificationCategory({
			identifier: 'MESSAGE',
			actions: [replyAction]
		}));
		NotificationsIOS.requestPermissions(actions);
	}

	getDeviceToken() {
		return this.deviceToken;
	}

	setBadgeCount = (count = 0) => {
		NotificationsIOS.setBadgesCount(count);
	}

	async configure(params) {
		this.onRegister = params.onRegister;
		this.onNotification = params.onNotification;

		const initial = await NotificationsIOS.getInitialNotification();
		// NotificationsIOS.consumeBackgroundQueue();
		return Promise.resolve(initial);
	}
}
export default new PushNotification();
