import EJSON from 'ejson';

import store from '../../lib/createStore';
import { deepLinkingOpen } from '../../actions/deepLinking';
import { isFDroidBuild } from '../../constants/environment';
import PushNotification from './push';
import { INotification, SubscriptionType } from '../../definitions';

interface IEjson {
	rid: string;
	name: string;
	sender: { username: string; name: string };
	type: string;
	host: string;
	messageType: string;
	messageId: string;
}

export const onNotification = (push: INotification): void => {
	if (push) {
		try {
			const notification = push?.getData();
			const { rid, name, sender, type, host, messageType, messageId }: IEjson = EJSON.parse(notification.ejson);

			const types: Record<string, string> = {
				c: 'channel',
				d: 'direct',
				p: 'group',
				l: 'channels'
			};
			let roomName = type === SubscriptionType.DIRECT ? sender.username : name;
			if (type === SubscriptionType.OMNICHANNEL) {
				roomName = sender.name;
			}

			const params = {
				host,
				rid,
				messageId,
				path: `${types[type]}/${roomName}`,
				isCall: messageType === 'jitsi_call_started'
			};
			// TODO REDUX MIGRATION TO TS
			store.dispatch(deepLinkingOpen(params));
		} catch (e) {
			console.warn(e);
		}
	}
};

export const getDeviceToken = (): string => PushNotification.getDeviceToken();
export const setBadgeCount = (count?: number): void => PushNotification.setBadgeCount(count);
export const initializePushNotifications = (): Promise<INotification> | undefined => {
	if (!isFDroidBuild) {
		setBadgeCount();
		return PushNotification.configure(onNotification);
	}
};
