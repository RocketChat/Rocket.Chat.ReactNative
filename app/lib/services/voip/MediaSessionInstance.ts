import { Emitter } from '@rocket.chat/emitter';
import {
	MediaCallWebRTCProcessor,
	MediaSignalingSession,
	type CallContact,
	type ClientMediaSignal,
	type IClientMediaCall,
	type CallActorType,
	type MediaSignalTransport,
	type ServerMediaSignal,
	type WebRTCProcessorConfig
} from '@rocket.chat/media-signaling';
import RNCallKeep from 'react-native-callkeep';
import { registerGlobals, mediaDevices } from 'react-native-webrtc';
import { getUniqueIdSync } from 'react-native-device-info';

import { createReduxIceServersProvider, type IceServersProvider } from './IceServersProvider';
import { mediaCallLogger, mediaSignalingLogger } from './MediaCallLogger';
import { useCallStore } from './useCallStore';
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

type SignalTransport = MediaSignalTransport<ClientMediaSignal>;

type SignalingSession = InstanceType<typeof MediaSignalingSession>;

const randomStringFactory = (): string =>
	Date.now().toString(36) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

class MediaSessionInstance {
	private iceServers: IceServer[] = [];
	private iceGatheringTimeout: number = 5000;
	private mediaSignalListener: { stop: () => void } | null = null;
	private instance: SignalingSession | null = null;
	private signalingChangeUnsubscribe: (() => void) | null = null;
	private iceSettingsUnsubscribe: (() => void) | null = null;
	private lastIceServersSetting: string | null = null;

	private signalingEmitter = new Emitter<{ change: void }>();
	private signalingSession: SignalingSession | null = null;
	private signalingSendFn: SignalTransport | null = null;
	private signalingWebRTCFactory: ((config: WebRTCProcessorConfig) => MediaCallWebRTCProcessor) | null = null;

	private emitSignalingChange(): void {
		this.signalingEmitter.emit('change');
	}

	private signalingWebrtcProcessorFactory(config: WebRTCProcessorConfig): MediaCallWebRTCProcessor {
		if (!this.signalingWebRTCFactory) {
			throw new Error('WebRTC processor factory not set');
		}
		return this.signalingWebRTCFactory(config);
	}

	private signalingSendSignal(signal: ClientMediaSignal) {
		if (!this.signalingSendFn) {
			throw new Error('Send signal function not set');
		}
		return this.signalingSendFn(signal);
	}

	private makeSignalingSession(userId: string): SignalingSession | null {
		if (this.signalingSession !== null) {
			this.signalingSession.endSession();
			this.signalingSession = null;
		}

		if (!this.signalingWebRTCFactory || !this.signalingSendFn) {
			throw new Error('WebRTC processor factory and send signal function must be set');
		}

		// Must match native VoIP DDP contractId: iOS `DeviceUID`, Android `Settings.Secure.ANDROID_ID` (see native VoipService / VoipNotification).
		const mobileDeviceId = getUniqueIdSync();
		mediaCallLogger.debug('[VoIP] Mobile device ID:', mobileDeviceId);
		this.signalingSession = new MediaSignalingSession({
			userId,
			transport: (signal: ClientMediaSignal) => this.signalingSendSignal(signal),
			processorFactories: {
				webrtc: (config: WebRTCProcessorConfig) => this.signalingWebrtcProcessorFactory(config)
			},
			mediaStreamFactory: (constraints: any) => mediaDevices.getUserMedia(constraints) as unknown as Promise<MediaStream>,
			displayMediaFactory: (constraints: any) => mediaDevices.getUserMedia(constraints) as unknown as Promise<MediaStream>,
			randomStringFactory,
			logger: mediaSignalingLogger,
			features: ['audio'],
			mobileDeviceId
		});

		this.emitSignalingChange();
		return this.signalingSession;
	}

	private getOrCreateSignalingSession(userId: string): SignalingSession | null {
		if (!userId) {
			throw new Error('User Id is required');
		}

		if (this.signalingSession?.userId === userId) {
			return this.signalingSession;
		}

		return this.makeSignalingSession(userId);
	}

	private setSignalingSendFn(sendSignalFn: SignalTransport): void {
		this.signalingSendFn = sendSignalFn;
		this.emitSignalingChange();
	}

	private setSignalingWebRTCProcessorFactory(factory: (config: WebRTCProcessorConfig) => MediaCallWebRTCProcessor): void {
		this.signalingWebRTCFactory = factory;
		this.emitSignalingChange();
	}

	private onSignalingStoreChange(callback: () => void) {
		return this.signalingEmitter.on('change', callback);
	}

	private disposeSignalingBacking(): void {
		if (this.signalingSession !== null) {
			this.signalingSession.endSession();
			this.signalingSession = null;
		}
		this.signalingSendFn = null;
		this.signalingWebRTCFactory = null;
		this.emitSignalingChange();
	}

	private tryAnswerIfNativeAcceptedNotification(signal: ServerMediaSignal): void {
		const { call, nativeAcceptedCallId } = useCallStore.getState();
		if (
			signal.type === 'notification' &&
			signal.notification === 'accepted' &&
			signal.signedContractId === getUniqueIdSync() &&
			nativeAcceptedCallId === signal.callId &&
			call == null
		) {
			this.answerCall(signal.callId).catch(error => {
				mediaCallLogger.error('[VoIP] Error answering call on notification/accepted:', error);
			});
		}
	}

	/** Replays `media-calls.stateSignals`. Used on init and when native accept raced ahead of `nativeAcceptedCallId`. Caller must ensure SDK/session host matches the call (see MediaCallEvents host gate). `tryAnswerIfNativeAcceptedNotification` may also fire from the stream-notify-user path; `answerCall` is idempotent. */
	public async applyRestStateSignals(): Promise<void> {
		if (!this.instance) {
			return;
		}
		try {
			const { signals } = await mediaCallsStateSignals(getUniqueIdSync());
			for (const signal of signals) {
				this.instance.processSignal(signal);
				this.tryAnswerIfNativeAcceptedNotification(signal);
			}
		} catch (error) {
			mediaCallLogger.error('[VoIP] Failed to fetch or apply REST state signals:', error);
		}
	}

	public async init(userId: string, iceServersProvider: IceServersProvider = createReduxIceServersProvider()): Promise<void> {
		this.reset();

		registerGlobals();
		this.configureIceServers(iceServersProvider);

		const streamUserId = userId;

		this.setSignalingWebRTCProcessorFactory(
			(config: WebRTCProcessorConfig) =>
				new MediaCallWebRTCProcessor({
					...config,
					rtc: { ...config.rtc, iceServers: this.iceServers },
					iceGatheringTimeout: this.iceGatheringTimeout
				})
		);
		this.setSignalingSendFn((signal: ClientMediaSignal) => {
			sdk.methodCall('stream-notify-user', `${userId}/media-calls`, JSON.stringify(signal));
		});
		this.instance = this.getOrCreateSignalingSession(userId);

		if (!this.instance) {
			throw new Error('Failed to create media session instance');
		}

		await this.applyRestStateSignals();

		this.signalingChangeUnsubscribe = this.onSignalingStoreChange(() => {
			this.instance = this.getOrCreateSignalingSession(userId);
		});

		// TESTING: DDP real-time signal subscription — stays for offer/answer/ICE/notifications
		this.mediaSignalListener = sdk.onStreamData('stream-notify-user', (ddpMessage: IDDPMessage) => {
			if (!this.instance) {
				return;
			}
			const eventNameParts = ddpMessage.fields.eventName.split('/');
			if (eventNameParts.length !== 2) {
				return;
			}
			const [uid, ev] = eventNameParts;
			if (uid !== streamUserId || ev !== 'media-signal') {
				return;
			}
			const signal = ddpMessage.fields.args?.[0];
			if (!signal) {
				return;
			}
			this.instance.processSignal(signal);

			mediaCallLogger.debug('[VoIP] Processed signal:', signal);

			this.tryAnswerIfNativeAcceptedNotification(signal as ServerMediaSignal);
		});

		this.instance?.on('newCall', ({ call }: { call: IClientMediaCall }) => {
			if (call && !call.hidden) {
				call.emitter.on('stateChange', oldState => {
					mediaCallLogger.debug(`[VoIP] ${oldState} → ${call.state}`);
					mediaCallLogger.debug('[VoIP] New call data:', call);
				});

				if (call.localParticipant.role === 'caller') {
					useCallStore.getState().setCall(call);
					Navigation.navigate('CallView');
					if (useCallStore.getState().roomId == null) {
						this.resolveRoomIdFromContact(call.remoteParticipants[0]?.contact).catch(error => {
							mediaCallLogger.error('[VoIP] Error resolving room id from contact (newCall):', error);
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
			mediaCallLogger.info('[VoIP] answerCall skipped — call already bound in store:', callId);
			return;
		}

		mediaCallLogger.info('[VoIP] Answering call:', callId);
		const mainCall = this.instance?.getCallData(callId);
		mediaCallLogger.info('[VoIP] Main call:', mainCall);

		if (mainCall && mainCall.callId === callId) {
			mediaCallLogger.info('[VoIP] Accepting call:', callId);
			await mainCall.accept();
			mediaCallLogger.info('[VoIP] Setting current call active:', callId);
			RNCallKeep.setCurrentCallActive(callId);
			useCallStore.getState().setCall(mainCall);
			Navigation.navigate('CallView');
			this.resolveRoomIdFromContact(mainCall.remoteParticipants[0]?.contact).catch(error => {
				mediaCallLogger.error('[VoIP] Error resolving room id from contact (answerCall):', error);
			});
		} else {
			RNCallKeep.endCall(callId);
			const st = useCallStore.getState();
			if (st.nativeAcceptedCallId === callId) {
				st.resetNativeCallId();
			}
			mediaCallLogger.warn('[VoIP] Call not found:', callId);
		}
	};

	public startCallByRoom = (room: TSubscriptionModel | ISubscription) => {
		useCallStore.getState().setRoomId(room.rid ?? null);
		const otherUserId = getUidDirectMessage(room);
		if (otherUserId) {
			this.startCall(otherUserId, 'user').catch(error => {
				console.error('[VoIP] Error starting call from room:', error);
			});
		}
	};

	public startCall = (userId: string, actor: CallActorType): void => {
		requestPhoneStatePermission();
		mediaCallLogger.info('[VoIP] Starting call:', userId);
		this.instance?.startCall(actor, userId);
	};

	public endCall = (callId: string) => {
		const mainCall = this.instance?.getCallData(callId);

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
		useCallStore.getState().resetNativeCallId();
		useCallStore.getState().reset();
	};

	private async resolveRoomIdFromContact(contact: CallContact | undefined): Promise<void> {
		if (!contact || contact.sipExtension) {
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

	private configureIceServers(iceServersProvider: IceServersProvider): void {
		const applySettings = () => {
			const { iceServersSetting, iceGatheringTimeout } = iceServersProvider.getSettings();
			if (iceGatheringTimeout !== this.iceGatheringTimeout) {
				this.iceGatheringTimeout = iceGatheringTimeout;
				this.instance?.setIceGatheringTimeout(this.iceGatheringTimeout);
			}
			if (iceServersSetting !== this.lastIceServersSetting) {
				this.lastIceServersSetting = iceServersSetting;
				this.iceServers = parseStringToIceServers(iceServersSetting);
			}
		};

		applySettings();
		this.iceSettingsUnsubscribe = iceServersProvider.subscribe(() => {
			const next = iceServersProvider.getSettings();
			if (next.iceGatheringTimeout === this.iceGatheringTimeout && next.iceServersSetting === this.lastIceServersSetting) {
				return;
			}
			applySettings();
		});
	}

	public reset() {
		if (this.signalingChangeUnsubscribe) {
			this.signalingChangeUnsubscribe();
			this.signalingChangeUnsubscribe = null;
		}
		if (this.mediaSignalListener?.stop) {
			this.mediaSignalListener.stop();
		}
		this.mediaSignalListener = null;
		if (this.iceSettingsUnsubscribe) {
			this.iceSettingsUnsubscribe();
			this.iceSettingsUnsubscribe = null;
		}
		this.lastIceServersSetting = null;
		this.disposeSignalingBacking();
		this.instance = null;
		useCallStore.getState().reset();
	}
}

export const mediaSessionInstance = new MediaSessionInstance();
