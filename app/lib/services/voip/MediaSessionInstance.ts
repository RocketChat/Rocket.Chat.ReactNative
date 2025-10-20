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
		this.iceServers = this.getIceServers();
		console.log('iceServers', this.iceServers);
		this.iceGatheringTimeout = store.getState().settings.VoIP_TeamCollab_Ice_Gathering_Timeout as number;
		console.log('iceGatheringTimeout', this.iceGatheringTimeout);

		registerGlobals();

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
				console.warn('Media Call - Tried to process signal, but no instance was set');
				return;
			}

			const [, ev] = ddpMessage.fields.eventName.split('/');
			if (ev !== 'media-signal') {
				return;
			}
			const signal = ddpMessage.fields.args[0];
			this.instance.processSignal(signal);
		});

		this.instance = mediaSessionStore.getInstance(userId);
		console.log('instance', this.instance);

		mediaSessionStore.onChange(() => {
			const previousInstance = this.instance;
			this.instance = mediaSessionStore.getInstance(userId);
			console.log('previousInstance', previousInstance, 'new instance', this.instance);
		});

		RNCallKeep.addEventListener('answerCall', async ({ callUUID }) => {
			const mainCall = this.instance?.getMainCall();
			console.log('answerCall', mainCall.callId, callUUID);
			if (mainCall && mainCall.callId === callUUID) {
				console.log('📱 User accepted call:', callUUID);
				// RNCallKeep.backToForeground();
				await mainCall.accept();
				RNCallKeep.setCurrentCallActive(mainCall.callId);
			} else {
				console.warn('⚠️ Call not found:', callUUID);
				RNCallKeep.endCall(callUUID);
			}
		});

		// User tapped "Decline" or "End Call"
		RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
			console.log('📱 User ended call:', callUUID);

			const mainCall = this.instance?.getMainCall();
			if (mainCall && mainCall.callId === callUUID) {
				if (mainCall.state === 'ringing') {
					mainCall.reject();
				} else {
					mainCall.hangup();
				}
			}
		});

		// User toggled mute button
		RNCallKeep.addEventListener('didPerformSetMutedCallAction', ({ muted, callUUID }) => {
			console.log('📱 Mute toggled:', muted);

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
			console.log('📞 NEW CALL RECEIVED', {
				callId: call.callId,
				contact: call.contact.displayName || call.contact.username,
				role: call.role,
				state: call.state
			});

			if (call && !call.hidden) {
				// Listen to state changes
				call.emitter.on('stateChange', oldState => {
					console.log(`📊 ${oldState} → ${call.state}`);
				});

				const displayName = call.contact.displayName || call.contact.username || 'Unknown';

				// Show CallKeep incoming call screen
				RNCallKeep.displayIncomingCall(
					call.callId, // UUID
					displayName, // Caller name
					displayName, // Caller handle (can be phone number)
					'generic', // Call type
					false // Has video
				);

				call.emitter.on('active', () => {
					console.log('✅ CALL ACTIVE - Audio should work automatically!');
					const remoteStream = call.getRemoteMediaStream();
					// RNCallKeep.backToForeground();
					console.log('Remote stream:', {
						id: remoteStream.id,
						active: remoteStream.active,
						audioTracks: remoteStream.getAudioTracks().length,
						tracks: remoteStream.getTracks().map(t => ({
							kind: t.kind,
							enabled: t.enabled,
							readyState: t.readyState
						}))
					});
					// RNCallKeep.startCall(call.callId, displayName, displayName);
					// That's it! No need to do anything else for audio to work.
				});

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
