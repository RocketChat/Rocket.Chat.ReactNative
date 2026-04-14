import {
	MediaCallWebRTCProcessor,
	type ClientMediaSignal,
	type IClientMediaCall,
	type CallActorType,
	type MediaSignalingSession,
	type WebRTCProcessorConfig,
	type CallContact
} from '@rocket.chat/media-signaling';
import RNCallKeep from 'react-native-callkeep';
import { registerGlobals } from 'react-native-webrtc';
import { getUniqueIdSync } from 'react-native-device-info';

import { mediaSessionStore } from './MediaSessionStore';
import { useCallStore } from './useCallStore';
import { store } from '../../store/auxStore';
import sdk from '../sdk';
import { mediaCallsStateSignals } from '../restApi';
import Navigation from '../../navigation/appNavigation';
import { parseStringToIceServers } from './parseStringToIceServers';
import type { IceServer } from '../../../definitions/Voip';
import type { IDDPMessage } from '../../../definitions/IDDPMessage';
import type { ISubscription, TSubscriptionModel } from '../../../definitions';
import { getDMSubscriptionByUsername } from '../../database/services/Subscription';
import { getUidDirectMessage } from '../../methods/helpers/helpers';
import { requestPhoneStatePermission } from '../../methods/voipPhoneStatePermission';

class MediaSessionInstance {
	private iceServers: IceServer[] = [];
	private iceGatheringTimeout: number = 5000;
	private mediaSignalListener: { stop: () => void } | null = null;
	private instance: MediaSignalingSession | null = null;
	private mediaSessionStoreChangeUnsubscribe: (() => void) | null = null;
	private storeTimeoutUnsubscribe: (() => void) | null = null;
	private storeIceServersUnsubscribe: (() => void) | null = null;

	public async init(userId: string): Promise<void> {
		this.reset();

		registerGlobals();
		this.configureIceServers();

		mediaSessionStore.setWebRTCProcessorFactory(
			(config: WebRTCProcessorConfig) =>
				new MediaCallWebRTCProcessor({
					...config,
					rtc: { ...config.rtc, iceServers: this.iceServers },
					iceGatheringTimeout: this.iceGatheringTimeout
				})
		);
		mediaSessionStore.setSendSignalFn((signal: ClientMediaSignal) => {
			sdk.methodCall('stream-notify-user', `${userId}/media-calls`, JSON.stringify(signal));
		});
		const instance = mediaSessionStore.getInstance(userId);
		this.instance = instance;

		if (instance) {
			// Fetch initial call state via REST before DDP register fires
			try {
				const { signals } = await mediaCallsStateSignals(getUniqueIdSync());
				for (const signal of signals) {
					instance.processSignal(signal);
				}
			} catch (error) {
				console.error('[VoIP] Failed to fetch initial state signals:', error);
			}

			// instance.register(false);
		}

		this.mediaSessionStoreChangeUnsubscribe = mediaSessionStore.onChange(() => {
			this.instance = mediaSessionStore.getInstance(userId);
		});

		this.mediaSignalListener = sdk.onStreamData('stream-notify-user', (ddpMessage: IDDPMessage) => {
			if (!this.instance) {
				return;
			}
			const [, ev] = ddpMessage.fields.eventName.split('/');
			if (ev !== 'media-signal') {
				return;
			}
			const signal = ddpMessage.fields.args[0];
			this.instance.processSignal(signal);

			// Answer when native already accepted and stream matches device contract + callId.
			const storeSlice = useCallStore.getState();
			const { call, nativeAcceptedCallId } = storeSlice;

			if (
				signal.type === 'notification' &&
				signal.notification === 'accepted' &&
				signal.signedContractId === getUniqueIdSync() &&
				nativeAcceptedCallId === signal.callId &&
				call == null
			) {
				this.answerCall(signal.callId).catch(error => {
					console.error('[VoIP] Error answering call on notification/accepted:', error);
				});
			}
		});

		this.instance?.on('newCall', ({ call }: { call: IClientMediaCall }) => {
			if (call && !call.hidden) {
				call.emitter.on('stateChange', () => {});

				if (call.localParticipant.role === 'caller') {
					useCallStore.getState().setCall(call);
					Navigation.navigate('CallView');
					if (useCallStore.getState().roomId == null) {
						this.resolveRoomIdFromContact(call.localParticipant.contact).catch(error => {
							console.error('[VoIP] Error resolving room id from contact (newCall):', error);
						});
					}
				}

				call.emitter.on('ended', () => {
					RNCallKeep.endCall(call.callId);
				});
			}
		});
	}

	public answerCall = async (callId: string) => {
		const { call: existingCall } = useCallStore.getState();
		if (existingCall != null && existingCall.callId === callId) {
			return;
		}

		const { call } = useCallStore.getState();

		if (call && call.callId === callId) {
			await call.accept();
			RNCallKeep.setCurrentCallActive(callId);
			useCallStore.getState().setCall(call);
			Navigation.navigate('CallView');
			this.resolveRoomIdFromContact(call.localParticipant.contact).catch(error => {
				console.error('[VoIP] Error resolving room id from contact (answerCall):', error);
			});
		} else {
			RNCallKeep.endCall(callId);
			const st = useCallStore.getState();
			if (st.nativeAcceptedCallId === callId) {
				st.resetNativeCallId();
			}
		}
	};

	public startCallByRoom = (room: TSubscriptionModel | ISubscription) => {
		useCallStore.getState().setRoomId(room.rid ?? null);
		const otherUserId = getUidDirectMessage(room);
		if (otherUserId) {
			this.startCall(otherUserId, 'user');
		}
	};

	public startCall = (userId: string, actor: CallActorType) => {
		requestPhoneStatePermission();
		this.instance?.startCall(actor, userId);
	};

	public endCall = (callId: string) => {
		const { call } = useCallStore.getState();

		if (call && call.callId === callId) {
			if (call.state === 'ringing') {
				call.reject();
			} else {
				call.hangup();
			}
		}
		RNCallKeep.endCall(callId);
		RNCallKeep.setCurrentCallActive('');
		RNCallKeep.setAvailable(true);
		useCallStore.getState().resetNativeCallId();
		useCallStore.getState().reset();
	};

	private async resolveRoomIdFromContact(contact: CallContact): Promise<void> {
		if (contact.sipExtension) {
			return;
		}
		const { username } = contact;
		if (!username) {
			return;
		}
		const sub = await getDMSubscriptionByUsername(username);
		if (sub) {
			useCallStore.getState().setRoomId(sub.rid);
		}
	}

	private getIceServers() {
		const iceServers = store.getState().settings.VoIP_TeamCollab_Ice_Servers as any;
		return parseStringToIceServers(iceServers);
	}

	private configureIceServers() {
		this.iceServers = this.getIceServers();
		this.iceGatheringTimeout = store.getState().settings.VoIP_TeamCollab_Ice_Gathering_Timeout as number;

		this.storeTimeoutUnsubscribe = store.subscribe(() => {
			const currentTimeout = store.getState().settings.VoIP_TeamCollab_Ice_Gathering_Timeout as number;
			if (currentTimeout !== this.iceGatheringTimeout) {
				this.iceGatheringTimeout = currentTimeout;
				this.instance?.setIceGatheringTimeout(this.iceGatheringTimeout);
			}
		});

		this.storeIceServersUnsubscribe = store.subscribe(() => {
			const currentIceServers = this.getIceServers();
			if (currentIceServers !== this.iceServers) {
				this.iceServers = currentIceServers;
			}
		});
	}

	public reset() {
		if (this.mediaSessionStoreChangeUnsubscribe) {
			this.mediaSessionStoreChangeUnsubscribe();
			this.mediaSessionStoreChangeUnsubscribe = null;
		}
		if (this.mediaSignalListener?.stop) {
			this.mediaSignalListener.stop();
		}
		this.mediaSignalListener = null;
		if (this.storeTimeoutUnsubscribe) {
			this.storeTimeoutUnsubscribe();
			this.storeTimeoutUnsubscribe = null;
		}
		if (this.storeIceServersUnsubscribe) {
			this.storeIceServersUnsubscribe();
			this.storeIceServersUnsubscribe = null;
		}
		mediaSessionStore.dispose();
		this.instance = null;
		useCallStore.getState().reset();
	}
}

export const mediaSessionInstance = new MediaSessionInstance();
