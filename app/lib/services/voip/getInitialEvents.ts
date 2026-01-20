import RNCallKeep from 'react-native-callkeep';
import VoipPushNotification from 'react-native-voip-push-notification';

import { isIOS } from '../../methods/helpers';
import { CallIdUUIDModule } from '../../native/CallIdUUID';
import store from '../../store';
import { voipCallOpen } from '../../../actions/deepLinking';

// Store VoIP push data temporarily
let voipPushData: { callId: string; caller: string; host?: string; callUUID: string } | null = null;
let voipPushToken: string | null = null;

export const getVoipPushToken = (): string | null => voipPushToken;

export const getInitialEvents = async (): Promise<boolean> => {
	if (!isIOS) {
		return false;
	}

	try {
		VoipPushNotification.addEventListener('register', (token: string) => {
			console.log('[VoIP][getInitialEvents] Registered VoIP push token:', token);
			voipPushToken = token;
		});

		VoipPushNotification.addEventListener('didLoadWithEvents', events => {
			if (!events || !Array.isArray(events)) return;

			for (const event of events) {
				const { name, data } = event;

				if (name === VoipPushNotification.RNVoipPushRemoteNotificationReceivedEvent) {
					const voipData = data as { callId?: string; caller?: string; host?: string };
					const { callId, caller, host } = voipData;
					if (callId) {
						const callUUID = CallIdUUIDModule.toUUID(callId);
						voipPushData = { callId, caller: caller || 'Unknown', host, callUUID };
						console.log('[VoIP][getInitialEvents] Stored VoIP push data:', voipPushData);
					}
				}
				if (name === VoipPushNotification.RNVoipPushRemoteNotificationsRegisteredEvent) {
					voipPushToken = data;
					console.log('[VoIP][getInitialEvents] Registered VoIP push token:', voipPushToken);
				}
			}
		});

		RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
			console.log('[CallKeep][getInitialEvents] Live answerCall event received:', callUUID);

			if (voipPushData && voipPushData.callUUID.toLowerCase() === callUUID.toLowerCase()) {
				console.log('[CallKeep][getInitialEvents] Matched live answer to VoIP call');
				if (voipPushData.host) {
					store.dispatch(
						voipCallOpen({
							callId: voipPushData.callId,
							callUUID: voipPushData.callUUID,
							host: voipPushData.host
						})
					);
					console.log('[CallKeep][getInitialEvents] Dispatched voipCallOpen action from live listener');
				}
			} else {
				console.log('[CallKeep][getInitialEvents] Live answer UUID mismatch. Answer:', callUUID, 'VoIP:', voipPushData?.callUUID);
			}
		});

		const initialEvents = await RNCallKeep.getInitialEvents();
		console.log('[CallKeep][getInitialEvents] Initial events:', JSON.stringify(initialEvents, null, 2));

		for (const event of initialEvents) {
			const { name, data } = event;

			if (name === 'RNCallKeepPerformAnswerCallAction') {
				const { callUUID } = data;
				console.log('[CallKeep][getInitialEvents] Found ANSWER event:', callUUID);

				if (voipPushData && voipPushData.callUUID.toLowerCase() === callUUID.toLowerCase()) {
					console.log('[CallKeep][getInitialEvents] Matched answer to VoIP call:', voipPushData);

					if (voipPushData.host) {
						store.dispatch(
							voipCallOpen({
								callId: voipPushData.callId,
								callUUID: voipPushData.callUUID,
								host: voipPushData.host
							})
						);
						console.log('[CallKeep][getInitialEvents] Dispatched voipCallOpen action');

						RNCallKeep.clearInitialEvents();
						return true;
					}
				} else {
					console.log('[CallKeep][getInitialEvents] Answer event UUID does not match VoIP push UUID');
				}
			}
		}

		if (initialEvents.length > 0) {
			RNCallKeep.clearInitialEvents();
		}

		return false;
	} catch (error) {
		console.error('[CallKeep][getInitialEvents] Error:', error);
		return false;
	}
};
