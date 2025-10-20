import {
	ClientMediaSignal,
	IClientMediaCall,
	MediaCallWebRTCProcessor,
	MediaSignalingSession,
	WebRTCProcessorConfig
} from '@rocket.chat/media-signaling';
import RNCallKeep from 'react-native-callkeep';
import { registerGlobals } from 'react-native-webrtc';

import { mediaSessionStore } from './MediaSessionStore';
import { store } from '../../store/auxStore';
import sdk from '../sdk';
import { parseStringToIceServers } from './parseStringToIceServers';
import { IceServer } from '../../../definitions/Voip';
import { IDDPMessage } from '../../../definitions/IDDPMessage';

class MediaSessionInstance {
	private iceServers: IceServer[] = [];
	private iceGatheringTimeout: number = 5000;
	private mediaSignalListener: { stop: () => void } | null = null;
	private mediaSignalsListener: { stop: () => void } | null = null;
	private instance: MediaSignalingSession | null = null;
	private storeTimeoutUnsubscribe: (() => void) | null = null;
	private storeIceServersUnsubscribe: (() => void) | null = null;

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

		this.instance?.on('newCall', ({ call }: { call: IClientMediaCall }) => {
			if (call && !call.hidden) {
				call.emitter.on('stateChange', oldState => {
					console.log(`📊 ${oldState} → ${call.state}`);
				});

				const displayName = call.contact.displayName || call.contact.username || 'Unknown';
				RNCallKeep.displayIncomingCall(call.callId, displayName, displayName, 'generic', false);

				call.emitter.on('ended', () => RNCallKeep.endCall(call.callId));
			}
		});
	}

	private configureRNCallKeep() {
		RNCallKeep.addEventListener('answerCall', async ({ callUUID }) => {
			const mainCall = this.instance?.getMainCall();
			if (mainCall && mainCall.callId === callUUID) {
				await mainCall.accept();
				RNCallKeep.setCurrentCallActive(mainCall.callId);
			} else {
				RNCallKeep.endCall(callUUID);
			}
		});

		RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
			const mainCall = this.instance?.getMainCall();
			if (mainCall && mainCall.callId === callUUID) {
				if (mainCall.state === 'ringing') {
					mainCall.reject();
				} else {
					mainCall.hangup();
				}
			}
		});

		RNCallKeep.addEventListener('didPerformSetMutedCallAction', ({ muted, callUUID }) => {
			const mainCall = this.instance?.getMainCall();
			if (mainCall && mainCall.callId === callUUID) {
				mainCall.setMuted(muted);
			}
		});

		RNCallKeep.addEventListener('didPerformDTMFAction', ({ digits }) => {
			const mainCall = this.instance?.getMainCall();
			if (mainCall) {
				mainCall.sendDTMF(digits);
			}
		});
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
				this.instance?.setIceServers(this.iceServers);
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
		RNCallKeep.removeEventListener('answerCall');
		RNCallKeep.removeEventListener('endCall');
		RNCallKeep.removeEventListener('didPerformSetMutedCallAction');
		RNCallKeep.removeEventListener('didPerformDTMFAction');
		if (this.storeTimeoutUnsubscribe) {
			this.storeTimeoutUnsubscribe();
		}
		if (this.storeIceServersUnsubscribe) {
			this.storeIceServersUnsubscribe();
		}
		if (this.instance) {
			this.instance.endSession();
		}
	}
}

export const mediaSessionInstance = new MediaSessionInstance();
