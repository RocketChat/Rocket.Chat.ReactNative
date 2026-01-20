import RNCallKeep from 'react-native-callkeep';
import VoipPushNotification from 'react-native-voip-push-notification';

import { isIOS } from '../../methods/helpers';
import { CallIdUUIDModule } from '../../native/CallIdUUID';
import store from '../../store';
import { voipCallOpen } from '../../../actions/deepLinking';

// const options = {
// 	ios: {
// 		appName: 'Rocket.Chat',
// 		supportsVideo: true,
// 		maximumCallGroups: 1,
// 		maximumCallsPerCallGroup: 1,
// 		includesCallsInRecents: false
// 	},
// 	android: {
// 		alertTitle: 'Permissions required',
// 		alertDescription: 'This application needs to access your phone accounts',
// 		cancelButton: 'Cancel',
// 		okButton: 'ok'
// 	}
// };

// Store VoIP push data temporarily
let voipPushData: { callId: string; caller: string; host?: string; callUUID: string } | null = null;

export const getInitialEvents = async () => {
	if (!isIOS) {
		return null;
	}

	try {
		// 1. Setup CallKeep FIRST (if not already done in native)
		// Note: Setup is already done in AppDelegate.swift, but we need to ensure JS side is ready
		// await RNCallKeep.setup(options);
		// console.log('[CallKeep][getInitialEvents] Setup completed');

		// 2. Get VoIP push events from didLoadWithEvents
		VoipPushNotification.addEventListener('didLoadWithEvents', events => {
			if (!events || !Array.isArray(events)) return;

			for (const event of events) {
				const { name, data } = event;

				if (name === VoipPushNotification.RNVoipPushRemoteNotificationReceivedEvent) {
					const { callId, caller, host } = data;
					if (callId) {
						const callUUID = CallIdUUIDModule.toUUID(callId);
						voipPushData = { callId, caller, host, callUUID };
						console.log('[VoIP][getInitialEvents] Stored VoIP push data:', voipPushData);
					}
				}
			}
		});

		RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
			console.log('[CallKeep][getInitialEvents] Live answerCall event received:', callUUID);

			if (voipPushData && voipPushData.callUUID.toLowerCase() === callUUID.toLowerCase()) {
				console.log('[CallKeep][getInitialEvents] Matched live answer to VoIP call');
				// handleAnsweredCall(voipPushData);
			} else {
				console.log('[CallKeep][getInitialEvents] Live answer UUID mismatch. Answer:', callUUID, 'VoIP:', voipPushData?.callUUID);
			}
		});

		// 3. Get CallKeep initial events AFTER setup
		const initialEvents = await RNCallKeep.getInitialEvents();
		console.log('[CallKeep][getInitialEvents] Initial events:', JSON.stringify(initialEvents, null, 2));

		// 4. Process answer events
		for (const event of initialEvents) {
			const { name, data } = event;

			if (name === 'RNCallKeepPerformAnswerCallAction') {
				const { callUUID } = data;
				console.log('[CallKeep][getInitialEvents] Found ANSWER event:', callUUID);

				// Match to VoIP push data
				if (voipPushData && voipPushData.callUUID.toLowerCase() === callUUID.toLowerCase()) {
					console.log('[CallKeep][getInitialEvents] Matched answer to VoIP call:', voipPushData);

					// Dispatch action to handle server switching and call connection
					if (voipPushData.host) {
						store.dispatch(
							voipCallOpen({
								callId: voipPushData.callId,
								callUUID: voipPushData.callUUID,
								host: voipPushData.host
							})
						);
						console.log('[CallKeep][getInitialEvents] Dispatched voipCallOpen action');

						// Clear events after processing
						RNCallKeep.clearInitialEvents();
						return { answered: true, callData: voipPushData };
					}
				} else {
					console.log('[CallKeep][getInitialEvents] Answer event UUID does not match VoIP push UUID');
				}
			}
		}

		// Clear events if processed
		if (initialEvents.length > 0) {
			RNCallKeep.clearInitialEvents();
		}

		return { answered: false };
	} catch (error) {
		console.error('[CallKeep][getInitialEvents] Error:', error);
		return null;
	}
};
