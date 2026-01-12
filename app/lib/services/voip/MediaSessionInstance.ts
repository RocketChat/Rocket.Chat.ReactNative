import {
	MediaCallWebRTCProcessor,
	type ClientMediaSignal,
	type IClientMediaCall,
	type MediaSignalingSession,
	type WebRTCProcessorConfig
} from '@rocket.chat/media-signaling';
import RNCallKeep, { type EventListener } from 'react-native-callkeep';
import { registerGlobals } from 'react-native-webrtc';
import { randomUuid } from '@rocket.chat/mobile-crypto';

import { mediaSessionStore } from './MediaSessionStore';
import { store } from '../../store/auxStore';
import sdk from '../sdk';
import Navigation from '../../navigation/appNavigation';
import { parseStringToIceServers } from './parseStringToIceServers';
import type { IceServer } from '../../../definitions/Voip';
import type { IDDPMessage } from '../../../definitions/IDDPMessage';

const localCallIdMap: Record<string, string> = {};

class MediaSessionInstance {
	private iceServers: IceServer[] = [];
	private iceGatheringTimeout: number = 5000;
	private mediaSignalListener: { stop: () => void } | null = null;
	private mediaSignalsListener: { stop: () => void } | null = null;
	private instance: MediaSignalingSession | null = null;
	private storeTimeoutUnsubscribe: (() => void) | null = null;
	private storeIceServersUnsubscribe: (() => void) | null = null;
	private callKeepListeners: {
		answerCall?: EventListener;
		endCall?: EventListener;
		didPerformSetMutedCallAction?: EventListener;
		didPerformDTMFAction?: EventListener;
	} = {};

	public init(userId: string): void {
		this.stop();
		registerGlobals();
		this.configureRNCallKeep();
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
		mediaSessionStore.onChange(() => (this.instance = mediaSessionStore.getInstance(userId)));

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
		});

		this.instance?.on('newCall', async ({ call }: { call: IClientMediaCall }) => {
			if (call && !call.hidden) {
				call.emitter.on('stateChange', oldState => {
					console.log(`📊 ${oldState} → ${call.state}`);
				});
				const callUUID = (await randomUuid()).toLowerCase();
				localCallIdMap[callUUID] = call.callId;
				const displayName = call.contact.displayName || call.contact.username || 'Unknown';
				RNCallKeep.displayIncomingCall(callUUID, displayName, displayName, 'generic', false);

				call.emitter.on('ended', () => {
					RNCallKeep.endCall(callUUID);
					delete localCallIdMap[callUUID];
				});
			}
		});
	}

	private configureRNCallKeep = () => {
		this.callKeepListeners.answerCall = RNCallKeep.addEventListener('answerCall', async ({ callUUID }) => {
			const callId = localCallIdMap[callUUID];
			const mainCall = this.instance?.getMainCall();
			if (mainCall && mainCall.callId === callId) {
				await mainCall.accept();
				RNCallKeep.setCurrentCallActive(callUUID);
				// Navigate to CallView - call data fetched from mediaSessionStore
				Navigation.navigate('CallView', { callUUID });
			} else {
				RNCallKeep.endCall(callUUID);
			}
		});

		this.callKeepListeners.endCall = RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
			const callId = localCallIdMap[callUUID];
			const mainCall = this.instance?.getMainCall();
			if (mainCall && mainCall.callId === callId) {
				if (mainCall.state === 'ringing') {
					mainCall.reject();
				} else {
					mainCall.hangup();
				}
			}
			delete localCallIdMap[callUUID];
		});

		this.callKeepListeners.didPerformSetMutedCallAction = RNCallKeep.addEventListener(
			'didPerformSetMutedCallAction',
			({ muted, callUUID }) => {
				const callId = localCallIdMap[callUUID];
				const mainCall = this.instance?.getMainCall();
				if (mainCall && mainCall.callId === callId) {
					mainCall.setMuted(muted);
				}
			}
		);

		this.callKeepListeners.didPerformDTMFAction = RNCallKeep.addEventListener('didPerformDTMFAction', ({ digits, callUUID }) => {
			const callId = localCallIdMap[callUUID];
			const mainCall = this.instance?.getMainCall();
			if (mainCall && mainCall.callId === callId) {
				mainCall.sendDTMF(digits);
			}
		});
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

	private stop() {
		if (this.mediaSignalListener) {
			this.mediaSignalListener.stop();
		}
		if (this.mediaSignalsListener) {
			this.mediaSignalsListener.stop();
		}
		if (this.storeTimeoutUnsubscribe) {
			this.storeTimeoutUnsubscribe();
		}
		if (this.storeIceServersUnsubscribe) {
			this.storeIceServersUnsubscribe();
		}
		if (this.instance) {
			this.instance.endSession();
		}
		Object.values(this.callKeepListeners).forEach(listener => listener?.remove());
		Object.keys(localCallIdMap).forEach(key => delete localCallIdMap[key]);
	}
}

export const mediaSessionInstance = new MediaSessionInstance();
