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

class MediaSessionInstance {
	private iceServers: IceServer[] = [];
	private iceGatheringTimeout: number = 5000;
	private mediaSignalListener: any;
	private mediaSignalsListener: any;
	private instance: MediaSignalingSession | null = null;

	public init(userId: string): void {
		registerGlobals();
		this.iceServers = this.getIceServers();
		this.iceGatheringTimeout = store.getState().settings.VoIP_TeamCollab_Ice_Gathering_Timeout as number;
		this.instance = mediaSessionStore.getInstance(userId);
		mediaSessionStore.onChange(() => (this.instance = mediaSessionStore.getInstance(userId)));

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

		this.mediaSignalListener = sdk.onStreamData('stream-notify-user', (ddpMessage: any) => {
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

		RNCallKeep.addEventListener('answerCall', async ({ callUUID }) => {
			const mainCall = this.instance?.getMainCall();
			if (mainCall && mainCall.callId === callUUID) {
				// RNCallKeep.backToForeground();
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

		this.instance?.on('newCall', ({ call }: { call: IClientMediaCall }) => {
			if (call && !call.hidden) {
				call.emitter.on('stateChange', oldState => {
					console.log(`📊 ${oldState} → ${call.state}`);
				});

				const displayName = call.contact.displayName || call.contact.username || 'Unknown';
				RNCallKeep.displayIncomingCall(call.callId, displayName, displayName, 'generic', false);

				call.emitter.on('ended', () => {
					console.log('❌ CALL ENDED');
					// Optional: Clean up if needed
					RNCallKeep.endCall(call.callId);
				});

				// FOR TESTING: Auto-accept after 2 seconds
				// setTimeout(() => {
				// 	console.log('🟢 AUTO-ACCEPTING...');
				// 	call.accept();
				// }, 2000);
			}
		});
	}

	private getIceServers() {
		const iceServers = store.getState().settings.VoIP_TeamCollab_Ice_Servers as any;
		return parseStringToIceServers(iceServers);
	}
}

export const mediaSessionInstance = new MediaSessionInstance();
