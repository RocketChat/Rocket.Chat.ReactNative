import {
	MediaCallWebRTCProcessor,
	type CallContact,
	type ClientMediaSignal,
	type IClientMediaCall,
	type CallActorType,
	type MediaSignalingSession,
	type ServerMediaSignal,
	type WebRTCProcessorConfig
} from '@rocket.chat/media-signaling';
import RNCallKeep from 'react-native-callkeep';
import { registerGlobals } from 'react-native-webrtc';
import { getUniqueIdSync } from 'react-native-device-info';
import { dequal } from 'dequal';

import { mediaSessionStore } from './MediaSessionStore';
import { terminateNativeCall } from './terminateNativeCall';
import { useCallStore } from './useCallStore';
import { MediaCallLogger } from './MediaCallLogger';
import { isSelfUserId } from './isSelfUserId';
import { logVoipFirstSignalElapsed } from './voipReconnectTiming';
import { voipDebugLog } from './voipDebugLogger';
import { store } from '../../store/auxStore';
import sdk from '../sdk';
import { mediaCallsStateSignals } from '../restApi';
import Navigation, { waitForNavigationReady } from '../../navigation/appNavigation';
import { parseStringToIceServers } from './parseStringToIceServers';
import type { IceServer } from '../../../definitions/Voip';
import type { IDDPMessage } from '../../../definitions/IDDPMessage';
import type { ISubscription, TSubscriptionModel } from '../../../definitions';
import { getDMSubscriptionByUsername } from '../../database/services/Subscription';
import { getUidDirectMessage } from '../../methods/helpers/helpers';
import { isInActiveVoipCall } from './isInActiveVoipCall';
import { requestVoipCallPermissions } from '../../methods/voipCallPermissions';
import I18n from '../../../i18n';
import { showErrorAlert } from '../../methods/helpers/info';

const mediaCallLogger = new MediaCallLogger();

class MediaSessionInstance {
	private iceServers: IceServer[] = [];
	private iceGatheringTimeout: number = 5000;
	private mediaSignalListener: { stop: () => void } | null = null;
	private instance: MediaSignalingSession | null = null;
	private mediaSessionStoreChangeUnsubscribe: (() => void) | null = null;
	private storeTimeoutUnsubscribe: (() => void) | null = null;
	private storeIceServersUnsubscribe: (() => void) | null = null;

	private tryAnswerIfNativeAcceptedNotification(signal: ServerMediaSignal): void {
		const { call, nativeAcceptedCallId } = useCallStore.getState();
		if (
			signal.type === 'notification' &&
			signal.notification === 'accepted' &&
			signal.signedContractId === getUniqueIdSync() &&
			nativeAcceptedCallId === signal.callId &&
			call == null
		) {
			voipDebugLog('tryAnswer', 'matched -> answerCall', { callId: signal.callId });
			this.answerCall(signal.callId).catch(error => {
				voipDebugLog('tryAnswer', 'answerCall rejected', String(error));
				console.error('[VoIP] Error answering call on notification/accepted:', error);
			});
		}
	}

	/** Replays `media-calls.stateSignals`. Used on init and when native accept raced ahead of `nativeAcceptedCallId`. Caller must ensure SDK/session host matches the call (see MediaCallEvents host gate). `tryAnswerIfNativeAcceptedNotification` may also fire from the stream-notify-user path; `answerCall` is idempotent. */
	public async applyRestStateSignals(): Promise<void> {
		if (!this.instance) {
			voipDebugLog('applyRestStateSignals', 'no instance');
			return;
		}
		try {
			voipDebugLog('applyRestStateSignals', 'fetch start');
			const { signals } = await mediaCallsStateSignals(getUniqueIdSync());
			voipDebugLog('applyRestStateSignals', 'fetched', {
				count: signals.length,
				types: signals.map((s: any) => `${s.type}${s.notification ? `/${s.notification}` : ''}`)
			});
			for (const signal of signals) {
				this.instance.processSignal(signal);
				this.tryAnswerIfNativeAcceptedNotification(signal);
			}
		} catch (error) {
			voipDebugLog('applyRestStateSignals', 'error', String(error));
			console.error('[VoIP] Failed to fetch or apply REST state signals:', error);
		}
	}

	public async init(userId: string): Promise<void> {
		voipDebugLog('init', 'enter', { userId });
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
		// DDP signal transport — offer/answer/ICE stay on DDP. Gate methodCall on `loggedIn`
		// (not just socket open). ddp.send awaits 'open' but server-side stream-notify-user requires
		// `this.userId` — sending before relogin = silent drop. Pre-emptive force-reconnect in
		// MediaCallEvents covers warm-locked accept; this gate handles the residual reconnect window.
		mediaSessionStore.setSendSignalFn((signal: ClientMediaSignal) => {
			voipDebugLog('sendSignal', 'enter', { type: (signal as any)?.type, callId: (signal as any)?.callId });
			void (async () => {
				try {
					try {
						sdk.current?.checkAndReopen?.();
					} catch (e) {
						voipDebugLog('sendSignal', 'checkAndReopen threw', String(e));
					}
					const driver = await (sdk.current as any)?.socket;
					const ddpSocket = driver?.ddp;
					if (ddpSocket && !ddpSocket.loggedIn) {
						voipDebugLog('sendSignal', 'awaiting login', { type: (signal as any)?.type });
						await Promise.race([
							new Promise<void>(resolve => ddpSocket.once('login', () => resolve())),
							new Promise<void>(resolve => setTimeout(resolve, 8000))
						]);
						if (!ddpSocket.loggedIn) {
							voipDebugLog('sendSignal', 'login wait timed out, dropping', { type: (signal as any)?.type });
							return;
						}
						voipDebugLog('sendSignal', 'login ready, proceeding');
					}
					await sdk.methodCall('stream-notify-user', `${userId}/media-calls`, JSON.stringify(signal));
					voipDebugLog('sendSignal', 'methodCall resolved', { type: (signal as any)?.type });
					logVoipFirstSignalElapsed();
				} catch (e: unknown) {
					voipDebugLog('sendSignal', 'methodCall rejected', String(e));
				}
			})();
		});
		this.instance = mediaSessionStore.getInstance(userId);

		if (!this.instance) {
			throw new Error('Failed to create media session instance');
		}

		await this.applyRestStateSignals();

		this.mediaSessionStoreChangeUnsubscribe = mediaSessionStore.onChange(() => {
			this.instance = mediaSessionStore.getInstance(userId);
		});

		// TESTING: DDP real-time signal subscription — stays for offer/answer/ICE/notifications
		this.mediaSignalListener = sdk.onStreamData('stream-notify-user', (ddpMessage: IDDPMessage) => {
			if (!this.instance) {
				voipDebugLog('streamData', 'no instance');
				return;
			}
			const [, ev] = ddpMessage.fields.eventName.split('/');
			if (ev !== 'media-signal') {
				return;
			}
			const signal = ddpMessage.fields.args[0];
			voipDebugLog('streamData', 'media-signal', {
				type: (signal as any)?.type,
				notification: (signal as any)?.notification,
				callId: (signal as any)?.callId
			});
			this.instance.processSignal(signal);

			this.tryAnswerIfNativeAcceptedNotification(signal as ServerMediaSignal);
		});

		this.instance?.on('newCall', ({ call }: { call: IClientMediaCall }) => {
			voipDebugLog('newCall', 'enter', {
				callId: call?.callId,
				hidden: call?.hidden,
				role: call?.localParticipant?.role,
				state: (call as any)?.state
			});
			if (call && !call.hidden) {
				call.emitter.on('stateChange', _oldState => {
					voipDebugLog('callState', 'change', {
						callId: call.callId,
						from: String(_oldState),
						to: String((call as any)?.state)
					});
				});

				if (call.localParticipant.role === 'caller') {
					useCallStore.getState().setCall(call);
					useCallStore.getState().setDirection('outgoing');
					Navigation.navigate('CallView');
					if (useCallStore.getState().roomId == null) {
						this.resolveRoomIdFromContact(call.remoteParticipants[0]?.contact).catch(error => {
							console.error('[VoIP] Error resolving room id from contact (newCall):', error);
						});
					}
				}

				call.emitter.on('ended', () => {
					voipDebugLog('callState', 'ended', { callId: call.callId });
					terminateNativeCall(call.callId);
				});
			}
		});
	}

	public answerCall = async (callId: string) => {
		voipDebugLog('answerCall', 'enter', { callId });
		const { call: existingCall } = useCallStore.getState();
		if (existingCall != null && existingCall.callId === callId) {
			voipDebugLog('answerCall', 'already same call');
			return;
		}

		const mainCall = this.instance?.getCallData(callId);
		voipDebugLog('answerCall', 'lookup', { found: !!mainCall, hasInstance: !!this.instance });

		if (mainCall && mainCall.callId === callId) {
			try {
				voipDebugLog('answerCall', 'accept() start');
				await mainCall.accept();
				voipDebugLog('answerCall', 'accept() resolved');
			} catch (error) {
				voipDebugLog('answerCall', 'accept() rejected', String(error));
				console.error('[VoIP] accept() rejected:', error);
				terminateNativeCall(callId);
				const st = useCallStore.getState();
				if (st.nativeAcceptedCallId === callId) {
					st.resetNativeCallId();
				}
				showErrorAlert(I18n.t('VoIP_Answer_Failed'), I18n.t('Oops'));
				return;
			}
			RNCallKeep.setCurrentCallActive(callId);
			useCallStore.getState().setCall(mainCall);
			useCallStore.getState().setDirection('incoming');
			await waitForNavigationReady();
			Navigation.navigate('CallView');
			voipDebugLog('answerCall', 'post-accept navigate done', { callId });
			this.resolveRoomIdFromContact(mainCall.remoteParticipants[0]?.contact).catch(error => {
				console.error('[VoIP] Error resolving room id from contact (answerCall):', error);
			});
		} else {
			voipDebugLog('answerCall', 'call not found', { callId, hasInstance: !!this.instance });
			terminateNativeCall(callId);
			const st = useCallStore.getState();
			if (st.nativeAcceptedCallId === callId) {
				st.resetNativeCallId();
			}
			console.warn('[VoIP] Call not found after accept:', callId);
		}
	};

	public startCallByRoom = (room: TSubscriptionModel | ISubscription) => {
		if (isInActiveVoipCall()) return;
		useCallStore.getState().setRoomId(room.rid ?? null);
		const otherUserId = getUidDirectMessage(room);
		if (otherUserId) {
			this.startCall(otherUserId, 'user').catch(error => {
				// Clear the optimistic roomId so a concurrent incoming call can resolve its own DM context.
				useCallStore.getState().setRoomId(null);
				console.error('[VoIP] Error starting call from room:', error);
			});
		}
	};

	public startCall = async (userId: string, actor: CallActorType): Promise<void> => {
		if (isInActiveVoipCall()) {
			throw new Error(I18n.t('VoIP_Already_In_Call'));
		}
		if (isSelfUserId(userId)) {
			mediaCallLogger.debug('[VoIP] startCall blocked: target userId matches logged-in user');
			return;
		}
		if (!this.instance) {
			mediaCallLogger.debug('[VoIP] startCall blocked: MediaSessionInstance not initialized');
			showErrorAlert(I18n.t('VoIP_Still_Connecting'), I18n.t('Oops'));
			return;
		}
		const granted = await requestVoipCallPermissions();
		if (!granted) {
			showErrorAlert(
				I18n.t('Go_to_your_device_settings_and_allow_microphone'),
				I18n.t('Microphone_access_needed_to_record_audio')
			);
			return;
		}
		// Re-evaluate: an incoming call may have been accepted during the permission prompt.
		if (isInActiveVoipCall()) {
			throw new Error(I18n.t('VoIP_Already_In_Call'));
		}
		await this.instance.startCall(actor, userId);
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
		terminateNativeCall(callId);
		RNCallKeep.setCurrentCallActive('');
		RNCallKeep.setAvailable(true);
		useCallStore.getState().resetNativeCallId();
		useCallStore.getState().reset();
	};

	private async resolveRoomIdFromContact(contact: CallContact | undefined): Promise<void> {
		if (!contact) {
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
			if (!dequal(currentIceServers, this.iceServers)) {
				this.iceServers = currentIceServers;
				this.instance?.setIceServers(this.iceServers);
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
