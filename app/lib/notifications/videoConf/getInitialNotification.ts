import * as Notifications from 'expo-notifications';
import EJSON from 'ejson';
import { Platform } from 'react-native';

import { deepLinkingClickCallPush } from '../../../actions/deepLinking';
import { store } from '../../store/auxStore';
import NativeVideoConfModule from '../../native/NativeVideoConfAndroid';

/**
 * Check for pending video conference actions from native notification handling.
 * @returns true if a video conf action was found and dispatched, false otherwise
 */
export const getInitialNotification = async (): Promise<boolean> => {
	// Android: Check native module for pending action
	if (Platform.OS === 'android' && NativeVideoConfModule) {
		try {
			const pendingAction = await NativeVideoConfModule.getPendingAction();
			if (pendingAction) {
				const data = JSON.parse(pendingAction);
				if (data?.notificationType === 'videoconf') {
					store.dispatch(deepLinkingClickCallPush(data));
					return true;
				}
			}
		} catch (error) {
			console.log('Error getting video conf initial notification:', error);
		}
	}

	// iOS: Check expo-notifications for last response with video conf action
	if (Platform.OS === 'ios') {
		try {
			const lastResponse = await Notifications.getLastNotificationResponseAsync();
			if (lastResponse) {
				const { actionIdentifier, notification } = lastResponse;
				const { trigger } = notification.request;
				let payload: Record<string, any> = {};

				if (trigger && 'type' in trigger && trigger.type === 'push' && 'payload' in trigger && trigger.payload) {
					payload = trigger.payload as Record<string, any>;
				}

				if (payload.ejson) {
					const ejsonData = EJSON.parse(payload.ejson);
					if (ejsonData?.notificationType === 'videoconf') {
						// Accept/Decline actions or default tap (treat as accept)
						let event = 'accept';
						if (actionIdentifier === 'DECLINE_ACTION') {
							event = 'decline';
						}
						store.dispatch(deepLinkingClickCallPush({ ...ejsonData, event }));
						return true;
					}
				}
			}
		} catch (error) {
			console.log('Error getting iOS video conf initial notification:', error);
		}
	}

	return false;
};
