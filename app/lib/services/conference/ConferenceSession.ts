import { AppState, type NativeEventSubscription } from 'react-native';

import I18n from '~/i18n';
import { captureOptionsFor, type VideoQuality } from '~/lib/methods/helpers/captureOptionsFor';
import { cameraSourceFor, type TCameraFacing } from '~/lib/methods/helpers/cameraSourceFor';
import { getCallConnectionState } from '~/lib/methods/helpers/getCallConnectionState';
import { getConferenceError } from '~/lib/methods/helpers/getConferenceError';
import { isHandNews } from '~/lib/methods/helpers/isHandNews';
import log from '~/lib/methods/helpers/log';
import { pickCameraDevices, type TCameraDevice } from '~/lib/methods/helpers/pickCameraDevices';
import { showToast } from '~/lib/methods/helpers/showToast';
import {
	videoConferenceCallConfig,
	videoConferenceHeartbeat,
	videoConferenceJoin,
	videoConferenceLeave,
	videoConferenceStart
} from '../restApi';
import { type CallDataMessage, createReaction, encodeMessage, parseMessage, reactionIdFor } from './callDataProtocol';
import { startConferenceForegroundService, stopConferenceForegroundService } from './conferenceForegroundService';
import { stopConferenceMicLevelMonitor } from './conferenceMicLevel';
import type { LocalVideoTrack, Room } from './livekit';
import { loadLiveKit, type TLiveKit } from './loadLiveKit';
import { playHandRaisedSound, releaseHandRaisedSound } from './playHandRaisedSound';
import { useConferenceInteractionStore } from './useConferenceInteractionStore';
import {
	isConferenceSessionActive,
	isPreflightCallId,
	type TConferenceError,
	useConferenceCallStore
} from './useConferenceCallStore';
import { useConferenceRoomStore } from './useConferenceRoomStore';

export const HEARTBEAT_INTERVAL_MS = 30_000;

export interface IConferenceJoinOptions {
	title?: string;
	mic: boolean;
	cam: boolean;
}

type TJoinContext = {
	callId?: string;
	room?: Room;
	audioStarted: boolean;
	leaveReported: boolean;
	lastHeartbeat: number;
	heartbeatTimer?: ReturnType<typeof setInterval>;
	appStateSubscription?: NativeEventSubscription;
};

class SupersededError extends Error {}

class ConferenceError extends Error {
	constructor(readonly code: TConferenceError) {
		super(code);
	}
}

class ConferenceSession {
	private context?: TJoinContext;

	private livekit?: TLiveKit;

	join = async (options: IConferenceJoinOptions): Promise<void> => {
		const { callId, rid, phase, setPhase } = useConferenceCallStore.getState();
		if (!callId || isConferenceSessionActive(phase)) {
			return;
		}

		const context: TJoinContext = { audioStarted: false, leaveReported: false, lastHeartbeat: 0 };
		this.context = context;
		useConferenceInteractionStore.getState().reset();
		setPhase('joining');

		try {
			const startedCallId = await this.ensureStarted(callId, rid, options);
			this.assertCurrent(context);
			if (startedCallId !== callId) {
				useConferenceCallStore.getState().assignCall(startedCallId, rid);
			}
			await this.joinCall(context, startedCallId, options);
			startConferenceForegroundService();
			setPhase('connecting');
			await this.connect(context, startedCallId, options);
			this.assertCurrent(context);
			this.startHeartbeat(context, startedCallId);
			setPhase('connected');
		} catch (error) {
			await this.handleJoinFailure(context, error);
		}
	};

	end = async (): Promise<void> => {
		const { context } = this;
		this.context = undefined;
		if (context) {
			await this.teardown(context);
		}
	};

	toggleHand = async (): Promise<void> => {
		const room = this.context?.room;
		if (room) {
			await this.setHand(room, !this.isHandRaised(room));
		}
	};

	lowerHand = async (): Promise<void> => {
		const room = this.context?.room;
		if (room && this.isHandRaised(room)) {
			await this.setHand(room, false);
		}
	};

	setMicrophone = async (enabled: boolean): Promise<void> => {
		const room = this.context?.room;
		if (!room) {
			return;
		}
		if (enabled) {
			await stopConferenceMicLevelMonitor();
		}
		await room.localParticipant.setMicrophoneEnabled(enabled);
	};

	selectAudioOutput = async (output: string): Promise<void> => {
		const audioSession = this.livekit?.AudioSession;
		if (!audioSession) {
			return;
		}
		await audioSession.selectAudioOutput(output);
		useConferenceInteractionStore.getState().setAudioOutput(output);
	};

	setCamera = async (enabled: boolean): Promise<void> => {
		const room = this.context?.room;
		if (room) {
			await this.applyCamera(room, enabled);
		}
	};

	sendReaction = async (emoji: string): Promise<void> => {
		const room = this.context?.room;
		if (!room) {
			return;
		}
		const { identity } = room.localParticipant;
		const now = Date.now();
		const reactionId = reactionIdFor(identity, now);
		useConferenceInteractionStore.getState().addReaction(createReaction(identity, emoji, now, reactionId));
		await this.publish(room, { type: 'reaction', emoji, reactionId }, false);
	};

	requestMute = async (target: string): Promise<void> => {
		const room = this.context?.room;
		if (room) {
			await this.publish(room, { type: 'mute', target }, true);
		}
	};

	toggleScreenShare = async (): Promise<void> => {
		const localParticipant = this.context?.room?.localParticipant;
		if (!localParticipant) {
			return;
		}
		try {
			await localParticipant.setScreenShareEnabled(!localParticipant.isScreenShareEnabled);
		} catch (error) {
			log(error);
		}
	};

	setVideoQuality = async (quality: VideoQuality): Promise<void> => {
		const { cameraFacing, cameraDeviceId, setVideoQuality } = useConferenceInteractionStore.getState();
		if (await this.restartCamera(quality, cameraFacing, cameraDeviceId)) {
			setVideoQuality(quality);
		}
	};

	switchCamera = async (): Promise<void> => {
		if (!this.cameraTrack()) {
			return;
		}
		const { cameraFacing, videoQuality, setCameraSource } = useConferenceInteractionStore.getState();
		const facing = cameraFacing === 'user' ? 'environment' : 'user';
		if (await this.restartCamera(videoQuality, facing, undefined)) {
			setCameraSource(facing, undefined);
		}
	};

	selectCamera = async (deviceId: string, facing: TCameraFacing): Promise<void> => {
		const { videoQuality, setCameraSource } = useConferenceInteractionStore.getState();
		if (await this.restartCamera(videoQuality, facing, deviceId)) {
			setCameraSource(facing, deviceId);
		}
	};

	listCameras = async (): Promise<TCameraDevice[]> => {
		try {
			return pickCameraDevices(await this.livekit?.mediaDevices.enumerateDevices());
		} catch (error) {
			log(error);
			return [];
		}
	};

	private restartCamera = async (
		quality: VideoQuality,
		facing: TCameraFacing,
		deviceId: string | undefined
	): Promise<boolean> => {
		const track = this.cameraTrack();
		if (!track) {
			return true;
		}
		try {
			await track.restartTrack({ ...captureOptionsFor(quality), ...cameraSourceFor(facing, deviceId) });
			return true;
		} catch (error) {
			log(error);
			return false;
		}
	};

	private cameraTrack = (): LocalVideoTrack | undefined => {
		const room = this.context?.room;
		const source = this.livekit?.Track.Source.Camera;
		return room && source ? room.localParticipant.getTrackPublication(source)?.videoTrack : undefined;
	};

	private publish = async (room: Room, message: CallDataMessage, reliable: boolean): Promise<void> => {
		try {
			await room.localParticipant.publishData(encodeMessage(message), { reliable });
		} catch (error) {
			log(error);
		}
	};

	private isCurrent = (context: TJoinContext): boolean => this.context === context;

	private isSuperseded = (context: TJoinContext): boolean => this.context !== undefined && this.context !== context;

	private assertCurrent = (context: TJoinContext): void => {
		if (!this.isCurrent(context)) {
			throw new SupersededError();
		}
	};

	private ensureStarted = async (callId: string, rid: string | undefined, { title }: IConferenceJoinOptions): Promise<string> => {
		if (!isPreflightCallId(callId)) {
			return callId;
		}
		if (!rid) {
			throw new ConferenceError('join-failed');
		}
		const started = await videoConferenceStart(rid, { title });
		if (!started.success) {
			throw new ConferenceError('join-failed');
		}
		return started.data.callId;
	};

	private joinCall = async (context: TJoinContext, callId: string, { cam, mic }: IConferenceJoinOptions): Promise<void> => {
		const joined = await videoConferenceJoin(callId, cam, mic);
		if (!joined.success) {
			throw new ConferenceError('join-failed');
		}
		context.callId = callId;
		this.assertCurrent(context);
		if (joined.providerName !== 'livekit' || joined.url !== '') {
			throw new ConferenceError('unsupported');
		}
	};

	private connect = async (context: TJoinContext, callId: string, options: IConferenceJoinOptions): Promise<void> => {
		const config = await videoConferenceCallConfig(callId);
		this.assertCurrent(context);
		if (!config.success) {
			throw new ConferenceError('join-failed');
		}
		if (config.providerName !== 'livekit' || !config.livekit) {
			throw new ConferenceError('unsupported');
		}

		const livekit = loadLiveKit();
		this.livekit = livekit;
		this.assertCurrent(context);

		const room = new livekit.Room();
		context.room = room;
		this.listen(context, room, livekit);

		await livekit.AudioSession.configureAudio({
			android: {
				preferredOutputList: ['bluetooth', 'headset', 'speaker', 'earpiece'],
				audioTypeOptions: livekit.AndroidAudioTypePresets.communication
			},
			ios: { defaultOutput: 'speaker' }
		});
		await livekit.AudioSession.startAudioSession();
		context.audioStarted = true;
		this.assertCurrent(context);

		await room.connect(config.livekit.serverUrl, config.livekit.token);
		this.assertCurrent(context);

		useConferenceRoomStore.getState().setRoom(room);
		await this.publishInitialTracks(room, options);
	};

	private publishInitialTracks = async (room: Room, { mic, cam }: IConferenceJoinOptions): Promise<void> => {
		await room.localParticipant.setMicrophoneEnabled(mic).catch(log);
		await this.applyCamera(room, cam).catch(log);
	};

	private applyCamera = async (room: Room, enabled: boolean): Promise<void> => {
		const { videoQuality, cameraFacing, cameraDeviceId } = useConferenceInteractionStore.getState();
		await room.localParticipant.setCameraEnabled(
			enabled,
			enabled ? { ...captureOptionsFor(videoQuality), ...cameraSourceFor(cameraFacing, cameraDeviceId) } : undefined
		);
	};

	private listen = (context: TJoinContext, room: Room, livekit: TLiveKit): void => {
		room.on(livekit.RoomEvent.Disconnected, reason =>
			this.onDisconnected(context, reason === livekit.DisconnectReason.DUPLICATE_IDENTITY)
		);
		room.on(livekit.RoomEvent.ConnectionStateChanged, state => this.onConnectionStateChanged(context, state));
		room.on(livekit.RoomEvent.DataReceived, (payload, participant) => this.onDataReceived(context, payload, participant));
		room.on(livekit.RoomEvent.ParticipantConnected, () => this.rebroadcastHand(context));
		room.on(livekit.RoomEvent.ParticipantDisconnected, participant =>
			useConferenceInteractionStore.getState().dropParticipantHand(participant.identity)
		);
	};

	private onDataReceived = (
		context: TJoinContext,
		payload: Uint8Array,
		participant?: { identity: string; name?: string }
	): void => {
		const message = parseMessage(payload);
		if (!this.isCurrent(context) || !participant || !message) {
			return;
		}
		const interactions = useConferenceInteractionStore.getState();
		const now = Date.now();
		switch (message.type) {
			case 'hand':
				if (isHandNews(message, (interactions.hands[participant.identity] ?? 0) > 0)) {
					playHandRaisedSound();
				}
				interactions.applyHandMessage(participant.identity, message, now);
				break;
			case 'reaction':
				interactions.addReaction(createReaction(participant.identity, message.emoji, now, message.reactionId));
				break;
			case 'mute':
				this.onMuteRequest(context, message.target, participant.name);
				break;
		}
	};

	private onMuteRequest = (context: TJoinContext, target: string | undefined, requester?: string): void => {
		const room = context.room;
		if (!room || !target || target !== room.localParticipant.identity) {
			return;
		}
		room.localParticipant.setMicrophoneEnabled(false).catch(log);
		showToast(I18n.t('Conference_muted_by', { name: requester ?? '' }));
	};

	private isHandRaised = (room: Room): boolean =>
		useConferenceInteractionStore.getState().hands[room.localParticipant.identity] > 0;

	private setHand = async (room: Room, raised: boolean): Promise<void> => {
		const { identity } = room.localParticipant;
		const now = Date.now();
		const message: CallDataMessage = { type: 'hand', raised, raisedAt: raised ? now : undefined };
		useConferenceInteractionStore.getState().applyHandMessage(identity, message, now);
		if (raised) {
			playHandRaisedSound();
		}
		await this.publish(room, message, true);
	};

	private rebroadcastHand = (context: TJoinContext): void => {
		const room = context.room;
		if (!room || !this.isCurrent(context)) {
			return;
		}
		const raisedAt = useConferenceInteractionStore.getState().hands[room.localParticipant.identity];
		if (raisedAt > 0) {
			this.publish(room, { type: 'hand', raised: true, raisedAt, rebroadcast: true }, true).catch(log);
		}
	};

	private onConnectionStateChanged = (context: TJoinContext, state: string): void => {
		if (!this.isCurrent(context)) {
			return;
		}
		const { phase, setPhase } = useConferenceCallStore.getState();
		const connection = getCallConnectionState(state);
		if (connection === 'reconnecting' && phase === 'connected') {
			setPhase('reconnecting');
		} else if (connection === 'connected' && phase === 'reconnecting') {
			setPhase('connected');
		}
	};

	private onDisconnected = (context: TJoinContext, joinedElsewhere: boolean): void => {
		if (!this.isCurrent(context)) {
			return;
		}
		if (joinedElsewhere) {
			context.leaveReported = true;
			showToast(I18n.t('Conference_joined_on_another_device'));
		}
		this.context = undefined;
		useConferenceCallStore.getState().setPhase('ended');
		this.teardown(context).catch(log);
	};

	private handleJoinFailure = async (context: TJoinContext, error: unknown): Promise<void> => {
		if (!this.isCurrent(context)) {
			await this.teardown(context);
			return;
		}
		log(error);
		const code = error instanceof ConferenceError ? error.code : getConferenceError(error, 'join-failed');
		this.context = undefined;
		await this.teardown(context);
		useConferenceCallStore.getState().setPhase('error', code);
	};

	private startHeartbeat = (context: TJoinContext, callId: string): void => {
		const beat = () => {
			context.lastHeartbeat = Date.now();
			videoConferenceHeartbeat(callId).catch(log);
		};
		beat();
		context.heartbeatTimer = setInterval(beat, HEARTBEAT_INTERVAL_MS);
		context.appStateSubscription = AppState.addEventListener('change', state => {
			if (state === 'active' && Date.now() - context.lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
				beat();
			}
		});
	};

	private stopHeartbeat = (context: TJoinContext): void => {
		clearInterval(context.heartbeatTimer);
		context.heartbeatTimer = undefined;
		context.appStateSubscription?.remove();
		context.appStateSubscription = undefined;
	};

	private reportLeave = async (context: TJoinContext): Promise<void> => {
		if (!context.callId || context.leaveReported) {
			return;
		}
		context.leaveReported = true;
		try {
			await videoConferenceLeave(context.callId);
		} catch (error) {
			log(error);
		}
	};

	private teardown = async (context: TJoinContext): Promise<void> => {
		this.stopHeartbeat(context);
		if (!this.isSuperseded(context)) {
			stopConferenceForegroundService();
			useConferenceInteractionStore.getState().reset();
			releaseHandRaisedSound();
		}
		const { room } = context;
		const roomStore = useConferenceRoomStore.getState();
		if (room && roomStore.room === room) {
			roomStore.setRoom(undefined);
		}
		await Promise.all([this.reportLeave(context), this.releaseMedia(context)]);
	};

	private releaseMedia = async (context: TJoinContext): Promise<void> => {
		await context.room?.disconnect().catch(log);
		if (context.audioStarted) {
			context.audioStarted = false;
			if (!this.isSuperseded(context)) {
				await this.livekit?.AudioSession.stopAudioSession().catch(log);
			}
		}
	};
}

export const conferenceSession = new ConferenceSession();
