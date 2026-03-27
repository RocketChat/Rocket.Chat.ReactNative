import {
	MediaCallWebRTCProcessor,
	type ClientMediaSignal,
	type IClientMediaCall,
	type CallActorType,
	type MediaSignalingSession,
	type WebRTCProcessorConfig
} from '@rocket.chat/media-signaling';
import RNCallKeep from 'react-native-callkeep';
import { registerGlobals } from 'react-native-webrtc';
import { getUniqueIdSync } from 'react-native-device-info';

import { mediaSessionStore } from './MediaSessionStore';
import { useCallStore } from './useCallStore';
import { store } from '../../store/auxStore';
import sdk from '../sdk';
import Navigation from '../../navigation/appNavigation';
import { parseStringToIceServers } from './parseStringToIceServers';
import type { IceServer } from '../../../definitions/Voip';
import type { IDDPMessage } from '../../../definitions/IDDPMessage';
import type { ISubscription, TSubscriptionModel } from '../../../definitions';
import { getUidDirectMessage } from '../../methods/helpers/helpers';

class MediaSessionInstance {
	private iceServers: IceServer[] = [];
	private iceGatheringTimeout: number = 5000;
	private mediaSignalListener: { stop: () => void } | null = null;
	private instance: MediaSignalingSession | null = null;
	private mediaSessionStoreChangeUnsubscribe: (() => void) | null = null;
	private storeTimeoutUnsubscribe: (() => void) | null = null;
	private storeIceServersUnsubscribe: (() => void) | null = null;

	public init(userId: string): void {
		// `getInitialMediaCallEvents` / VoipPushInitialEvents may set `callId` before login; `reset()` clears
		// the Zustand store — restore native-accepted `callId` so `registered` / notification accepted can answer.
		const { callId: preInitCallId, call: preInitCall } = useCallStore.getState();
		const nativeAcceptedCallId = preInitCall == null && preInitCallId ? preInitCallId : null;

		this.reset();

		if (nativeAcceptedCallId) {
			useCallStore.getState().setCallId(nativeAcceptedCallId);
		}

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
		this.instance = mediaSessionStore.getInstance(userId);
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

			console.log('🤙 [VoIP] Processed signal:', signal);

			// Primary path when `registered` ran before native `setCallId` (warm Android): answer only if the user
			// already accepted on this device (store `callId` from native) and the signal targets this contract.
			// `registered` remains a secondary path when callId is already set and id ∈ activeCalls.
			const { callId: storeNativeAcceptedCallId, call } = useCallStore.getState();

			console.log('🤙🤙🤙 [VoIP] Native accepted callId:', storeNativeAcceptedCallId);
			console.log('🤙🤙🤙 [VoIP] Native accepted call:', call);
			console.log('🤙🤙🤙 [VoIP] Signal:', signal);
			if (
				signal.type === 'notification' &&
				signal.notification === 'accepted' &&
				signal.signedContractId === getUniqueIdSync() &&
				storeNativeAcceptedCallId === signal.callId &&
				call == null
			) {
				this.answerCall(signal.callId).catch(error => {
					console.error('[VoIP] Error answering call on notification/accepted:', error);
				});
			}
		});

		this.instance?.on('registered', ({ activeCalls }) => {
			const { callId, call } = useCallStore.getState();
			const mainCall = this.instance?.getMainCall();

			console.log('[VoIP] Media session registered', {
				activeCallsCount: activeCalls.length,
				activeCalls,
				sessionId: this.instance?.sessionId,
				storeCallId: callId,
				storeHasCallObject: call != null,
				mainCallId: mainCall?.callId ?? null,
				mainCallRole: mainCall?.role ?? null,
				mainCallState: mainCall?.state ?? null,
				nativeAcceptedCallIdInActiveCalls: callId != null ? activeCalls.includes(callId) : false,
				mainCallIdInActiveCalls: mainCall != null ? activeCalls.includes(mainCall.callId) : false
			});

			if (!callId || call != null) {
				return;
			}
			if (!activeCalls.includes(callId)) {
				console.log('[VoIP] Native accepted callId not in activeCalls yet:', callId, 'activeCalls:', activeCalls);
				return;
			}
			this.answerCall(callId).catch(error => {
				console.error('[VoIP] Error answering call after registered:', error);
			});
		});

		this.instance?.on('newCall', ({ call }: { call: IClientMediaCall }) => {
			if (call && !call.hidden) {
				call.emitter.on('stateChange', oldState => {
					console.log(`📊 ${oldState} → ${call.state}`);
					console.log('🤙 [VoIP] New call data:', call);
				});

				if (call.role === 'caller') {
					useCallStore.getState().setCall(call);
					Navigation.navigate('CallView');
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
			console.log('[VoIP] answerCall skipped — call already bound in store:', callId);
			return;
		}

		console.log('[VoIP] Answering call:', callId);
		const mainCall = this.instance?.getMainCall();
		console.log('[VoIP] Main call:', mainCall);

		if (mainCall && mainCall.callId === callId) {
			console.log('[VoIP] Accepting call:', callId);
			await mainCall.accept();
			console.log('[VoIP] Setting current call active:', callId);
			RNCallKeep.setCurrentCallActive(callId);
			useCallStore.getState().setCall(mainCall);
			Navigation.navigate('CallView');
		} else {
			RNCallKeep.endCall(callId);
			console.warn('[VoIP] Call not found:', callId); // TODO: Show error message?
		}
	};

	public startCallByRoom = (room: TSubscriptionModel | ISubscription) => {
		const otherUserId = getUidDirectMessage(room);
		if (otherUserId) {
			this.startCall(otherUserId, 'user');
		}
	};

	public startCall = (userId: string, actor: CallActorType) => {
		console.log('[VoIP] Starting call:', userId);
		this.instance?.startCall(actor, userId);
	};

	public endCall = (callId: string) => {
		const mainCall = this.instance?.getMainCall();

		if (mainCall && mainCall.callId === callId) {
			if (mainCall.state === 'ringing') {
				mainCall.reject();
			} else {
				mainCall.hangup();
			}
		}
		RNCallKeep.endCall(callId);
		RNCallKeep.setCurrentCallActive('');
		RNCallKeep.setAvailable(true);
		// Reset Zustand store
		useCallStore.getState().reset();
	};

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
				// this.instance?.setIceServers(this.iceServers);
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
