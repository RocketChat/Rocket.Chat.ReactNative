import {
	type ClientMediaSignal,
	type IClientMediaCall,
	type CallActorType,
	type MediaSignalingSession
} from '@rocket.chat/media-signaling';
import RNCallKeep from 'react-native-callkeep';
import { getUniqueIdSync } from 'react-native-device-info';

import { mediaSessionStore } from './MediaSessionStore';
import { useCallStore } from './useCallStore';
import sdk from '../sdk';
import Navigation from '../../navigation/appNavigation';
import type { IDDPMessage } from '../../../definitions/IDDPMessage';
import type { ISubscription, TSubscriptionModel } from '../../../definitions';
import { getDMSubscriptionByUsername } from '../../database/services/Subscription';
import { getUidDirectMessage } from '../../methods/helpers/helpers';
import { requestPhoneStatePermission } from '../../methods/voipPhoneStatePermission';
import { MediaSessionController } from './MediaSessionController';

export type CallOrchestratorConfig = {
	onCallStarted?: () => void;
	onCallEnded?: () => void;
};

export type CallResult =
	| { success: true; callId?: string }
	| { success: false; error: string };

class CallOrchestrator {
	private controller: MediaSessionController;
	private mediaSignalListener: { stop: () => void } | null = null;
	private storeChangeUnsubscribe: (() => void) | null = null;
	private attachedSession: MediaSignalingSession | null = null;
	private onCallStarted: () => void;
	private onCallEnded: () => void;

	constructor(config?: CallOrchestratorConfig) {
		this.controller = new MediaSessionController('');
		this.onCallStarted = config?.onCallStarted ?? (() => Navigation.navigate('CallView'));
		this.onCallEnded = config?.onCallEnded ?? (() => {});
	}

	public init(userId: string): void {
		if (this.storeChangeUnsubscribe) {
			this.storeChangeUnsubscribe();
			this.storeChangeUnsubscribe = null;
		}
		if (this.mediaSignalListener?.stop) {
			this.mediaSignalListener.stop();
		}
		this.mediaSignalListener = null;
		this.attachedSession = null;
		this.controller.reset();
		this.controller = new MediaSessionController(userId);

		mediaSessionStore.setSendSignalFn((signal: ClientMediaSignal) => {
			sdk.methodCall('stream-notify-user', `${userId}/media-calls`, JSON.stringify(signal));
		});
		this.controller.configure();

		this.setupMediaSignalListener();
	}

	private attachNewCallListener(): void {
		const session = this.controller.getSession();
		if (!session || session === this.attachedSession) {
			return;
		}
		this.attachedSession = session;
		session.on('newCall', ({ call }: { call: IClientMediaCall }) => {
			if (call && !call.hidden) {
				call.emitter.on('stateChange', oldState => {
					console.log(`📊 ${oldState} → ${call.state}`);
					console.log('🤙 [VoIP] New call data:', call);
				});

				if (call.role === 'caller') {
					useCallStore.getState().setCall(call);
					this.onCallStarted();
					if (useCallStore.getState().roomId == null) {
						this.resolveRoomIdFromContact(call.contact).catch(error => {
							console.error('[VoIP] Error resolving room id from contact (newCall):', error);
						});
					}
				}

				call.emitter.on('ended', () => {
					RNCallKeep.endCall(call.callId);
					this.onCallEnded();
				});
			}
		});
	}

	private setupMediaSignalListener(): void {
		const { controller } = this;
		this.attachNewCallListener();
		this.storeChangeUnsubscribe = mediaSessionStore.onChange(() => {
			controller.refreshSession();
			this.attachNewCallListener();
		});

		this.mediaSignalListener = sdk.onStreamData('stream-notify-user', (ddpMessage: IDDPMessage) => {
			const instance = controller.getSession();
			if (!instance) {
				return;
			}
			const [, ev] = ddpMessage.fields.eventName.split('/');
			if (ev !== 'media-signal') {
				return;
			}
			const signal = ddpMessage.fields.args[0];
			instance.processSignal(signal);

			console.log('🤙 [VoIP] Processed signal:', signal);

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
	}

	public answerCall = async (callId: string): Promise<CallResult> => {
		const { call: existingCall } = useCallStore.getState();
		if (existingCall != null && existingCall.callId === callId) {
			console.log('[VoIP] answerCall skipped — call already bound in store:', callId);
			return { success: true, callId };
		}

		console.log('[VoIP] Answering call:', callId);
		const mainCall = this.controller.getSession()?.getMainCall();
		console.log('[VoIP] Main call:', mainCall);

		if (mainCall && mainCall.callId === callId) {
			console.log('[VoIP] Accepting call:', callId);
			await mainCall.accept();
			console.log('[VoIP] Setting current call active:', callId);
			RNCallKeep.setCurrentCallActive(callId);
			useCallStore.getState().setCall(mainCall);
			this.onCallStarted();
			this.resolveRoomIdFromContact(mainCall.contact).catch(error => {
				console.error('[VoIP] Error resolving room id from contact (answerCall):', error);
			});
			return { success: true, callId };
		}
		RNCallKeep.endCall(callId);
		const st = useCallStore.getState();
		if (st.nativeAcceptedCallId === callId) {
			st.resetNativeCallId();
		}
		console.warn('[VoIP] Call not found:', callId);
		return { success: false, error: 'Call not found' };
	};

	public startCallByRoom = (room: TSubscriptionModel | ISubscription) => {
		useCallStore.getState().setRoomId(room.rid ?? null);
		const otherUserId = getUidDirectMessage(room);
		if (otherUserId) {
			this.startCall(otherUserId, 'user');
		}
	};

	public startCall = (userId: string, actor: CallActorType): CallResult => {
		requestPhoneStatePermission();
		console.log('[VoIP] Starting call:', userId);
		const session = this.controller.getSession();
		if (!session) {
			return { success: false, error: 'Session not initialized' };
		}
		session.startCall(actor, userId);
		return { success: true };
	};

	public endCall = (callId: string) => {
		const mainCall = this.controller.getSession()?.getMainCall();
		let endedSynchronously = false;

		if (mainCall && mainCall.callId === callId) {
			try {
				if (mainCall.role === 'callee' && mainCall.state === 'ringing') {
					mainCall.reject();
				} else {
					mainCall.hangup();
				}
				endedSynchronously = mainCall.state === 'hangup';
			} catch (error) {
				console.error('[VoIP] Error ending call:', error);
			}
		}

		if (!endedSynchronously) {
			this.onCallEnded();
		}

		RNCallKeep.endCall(callId);
		RNCallKeep.setCurrentCallActive('');
		RNCallKeep.setAvailable(true);
		useCallStore.getState().resetNativeCallId();
		useCallStore.getState().reset();
	};

	private async resolveRoomIdFromContact(contact: IClientMediaCall['contact']): Promise<void> {
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

	public reset() {
		if (this.storeChangeUnsubscribe) {
			this.storeChangeUnsubscribe();
			this.storeChangeUnsubscribe = null;
		}
		if (this.mediaSignalListener?.stop) {
			this.mediaSignalListener.stop();
		}
		this.mediaSignalListener = null;
		this.attachedSession = null;
		this.controller.reset();
		useCallStore.getState().reset();
	}
}

export { CallOrchestrator, type CallOrchestratorConfig, type CallResult };
export const mediaSessionInstance = new CallOrchestrator();
