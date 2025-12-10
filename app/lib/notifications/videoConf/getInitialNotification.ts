import * as Notifications from 'expo-notifications';
import EJSON from 'ejson';
import { NativeModules, Platform } from 'react-native';

import { deepLinkingClickCallPush } from '../../../actions/deepLinking';
import { store } from '../../store/auxStore';

const { VideoConfModule } = NativeModules;

/**
 * Check for pending video conference actions from native notification handling.
 * @returns true if a video conf action was found and dispatched, false otherwise
 */
export const getInitialNotification = async (): Promise<boolean> => {
	// Android: Check native module for pending action
	if (Platform.OS === 'android' && VideoConfModule) {
		try {
			const pendingAction = await VideoConfModule.getPendingAction();
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

				// Check if it's a video conf action (Accept or Decline)
				if (actionIdentifier === 'ACCEPT_ACTION' || actionIdentifier === 'DECLINE_ACTION') {
					const trigger = notification.request.trigger;
					let payload: Record<string, any> = {};

					if (trigger && 'type' in trigger && trigger.type === 'push' && 'payload' in trigger && trigger.payload) {
						payload = trigger.payload as Record<string, any>;
					}

					if (payload.ejson) {
						const ejsonData = EJSON.parse(payload.ejson);
						if (ejsonData?.notificationType === 'videoconf') {
							const event = actionIdentifier === 'ACCEPT_ACTION' ? 'accept' : 'decline';
							store.dispatch(deepLinkingClickCallPush({ ...ejsonData, event }));
							return true;
						}
					}
				}
			}
		} catch (error) {
			console.log('Error getting iOS video conf initial notification:', error);
		}
	}

	return false;
};
