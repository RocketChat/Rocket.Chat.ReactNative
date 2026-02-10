import {
	MediaCallWebRTCProcessor,
	type ClientMediaSignal,
	type IClientMediaCall,
	type MediaSignalingSession,
	type WebRTCProcessorConfig
} from '@rocket.chat/media-signaling';
import RNCallKeep from 'react-native-callkeep';
import { registerGlobals } from 'react-native-webrtc';

import { mediaSessionStore } from './MediaSessionStore';
import { useCallStore } from './useCallStore';
import { store } from '../../store/auxStore';
import sdk from '../sdk';
import Navigation from '../../navigation/appNavigation';
import { parseStringToIceServers } from './parseStringToIceServers';
import CallIdUUIDModule from '../../native/NativeCallIdUUID';
import type { IceServer } from '../../../definitions/Voip';
import type { IDDPMessage } from '../../../definitions/IDDPMessage';

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

				const existingCallUUID = useCallStore.getState().callUUID;
				console.log('[VoIP] Existing call UUID:', existingCallUUID);
				// // TODO: need to answer the call here?
				if (existingCallUUID) {
					this.answerCall(existingCallUUID);
					return;
				}

				const callUUID = CallIdUUIDModule.toUUID(call.callId);
				console.log('[VoIP] New call UUID:', callUUID);

				// const displayName = call.contact.displayName || call.contact.username || 'Unknown';
				// RNCallKeep.displayIncomingCall(callUUID, displayName, displayName, 'generic', false);

				call.emitter.on('ended', () => {
					RNCallKeep.endCall(callUUID);
				});
			}
		});
	}

	public answerCall = async (callUUID: string) => {
		console.log('[VoIP] Answering call:', callUUID);
		const mainCall = this.instance?.getMainCall();
		console.log('[VoIP] Main call:', mainCall);
		// Compare using deterministic UUID conversion
		if (mainCall && CallIdUUIDModule.toUUID(mainCall.callId) === callUUID) {
			console.log('[VoIP] Accepting call:', callUUID);
			await mainCall.accept();
			console.log('[VoIP] Setting current call active:', callUUID);
			RNCallKeep.setCurrentCallActive(callUUID);
			useCallStore.getState().setCall(mainCall, callUUID);
			Navigation.navigate('CallView', { callUUID });
		} else {
			RNCallKeep.endCall(callUUID);
		}
	};

	public endCall = (callUUID: string) => {
		const mainCall = this.instance?.getMainCall();
		// Compare using deterministic UUID conversion
		if (mainCall && CallIdUUIDModule.toUUID(mainCall.callId) === callUUID) {
			if (mainCall.state === 'ringing') {
				mainCall.reject();
			} else {
				mainCall.hangup();
			}
		}
		RNCallKeep.endCall(callUUID);
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

	private stop() {
		if (this.mediaSignalListener?.stop) {
			this.mediaSignalListener.stop();
		}
		if (this.mediaSignalsListener?.stop) {
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
	}
}

export const mediaSessionInstance = new MediaSessionInstance();
