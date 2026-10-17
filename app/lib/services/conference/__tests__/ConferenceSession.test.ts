import {
	videoConferenceCallConfig,
	videoConferenceHeartbeat,
	videoConferenceJoin,
	videoConferenceLeave,
	videoConferenceStart
} from '../../restApi';
import log from '~/lib/methods/helpers/log';
import { showToast } from '~/lib/methods/helpers/showToast';
import { type CallDataMessage, encodeMessage, parseMessage } from '../callDataProtocol';
import { stopConferenceMicLevelMonitor } from '../conferenceMicLevel';
import { conferenceSession, HEARTBEAT_INTERVAL_MS } from '../ConferenceSession';
import { preflightCallId, useConferenceCallStore } from '../useConferenceCallStore';
import { useConferenceInteractionStore } from '../useConferenceInteractionStore';
import { useConferenceRoomStore } from '../useConferenceRoomStore';

jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/methods/helpers/showToast', () => ({ showToast: jest.fn() }));
jest.mock('../conferenceMicLevel', () => ({ stopConferenceMicLevelMonitor: jest.fn(() => Promise.resolve()) }));

jest.mock('../../restApi', () => ({
	videoConferenceStart: jest.fn(),
	videoConferenceJoin: jest.fn(),
	videoConferenceCallConfig: jest.fn(),
	videoConferenceHeartbeat: jest.fn(),
	videoConferenceLeave: jest.fn()
}));

jest.mock('../loadLiveKit', () => {
	class MockRoom {
		static instances: MockRoom[] = [];

		static failConnect = false;

		static holdConnect = false;

		rejectConnect?: (error: Error) => void;

		cameraTrack = { restartTrack: jest.fn(() => Promise.resolve()) };

		listeners: Record<string, (...args: unknown[]) => void> = {};

		localParticipant = {
			identity: 'me',
			setMicrophoneEnabled: jest.fn(() => Promise.resolve()),
			setCameraEnabled: jest.fn(() => Promise.resolve()),
			publishData: jest.fn(() => Promise.resolve()),
			getTrackPublication: jest.fn(() => ({ videoTrack: this.cameraTrack }))
		};

		connect = jest.fn(() => {
			if (MockRoom.holdConnect) {
				return new Promise<void>((_resolve, reject) => {
					this.rejectConnect = reject;
				});
			}
			return MockRoom.failConnect ? Promise.reject(new Error('could not connect')) : Promise.resolve();
		});

		disconnect = jest.fn(() => {
			this.rejectConnect?.(new Error('room connection has been cancelled'));
			return Promise.resolve();
		});

		constructor() {
			MockRoom.instances.push(this);
		}

		on(event: string, listener: (...args: unknown[]) => void) {
			this.listeners[event] = listener;
			return this;
		}

		emit(event: string, ...args: unknown[]) {
			this.listeners[event]?.(...args);
		}
	}

	const mockLiveKit = {
		Room: MockRoom,
		RoomEvent: {
			Disconnected: 'disconnected',
			ConnectionStateChanged: 'connectionStateChanged',
			DataReceived: 'dataReceived',
			ParticipantConnected: 'participantConnected',
			ParticipantDisconnected: 'participantDisconnected'
		},
		DisconnectReason: { DUPLICATE_IDENTITY: 'duplicateIdentity' },
		AndroidAudioTypePresets: { communication: { audioMode: 'inCommunication' } },
		Track: { Source: { Camera: 'camera' } },
		mediaDevices: {
			enumerateDevices: jest.fn(() =>
				Promise.resolve([
					{ kind: 'videoinput', deviceId: '1', facing: 'front', label: '1' },
					{ kind: 'videoinput', deviceId: '0', facing: 'environment', label: '0' },
					{ kind: 'audioinput', deviceId: 'audio-1', label: 'Audio' }
				])
			)
		},
		AudioSession: {
			configureAudio: jest.fn(() => Promise.resolve()),
			startAudioSession: jest.fn(() => Promise.resolve()),
			stopAudioSession: jest.fn(() => Promise.resolve()),
			getAudioOutputs: jest.fn(() => Promise.resolve(['speaker', 'earpiece'])),
			selectAudioOutput: jest.fn(() => Promise.resolve())
		}
	};

	return { loadLiveKit: jest.fn(() => mockLiveKit), mockLiveKit };
});

const { mockLiveKit: livekit } = jest.requireMock('../loadLiveKit');
const rooms = () =>
	livekit.Room.instances as {
		connect: jest.Mock;
		disconnect: jest.Mock;
		cameraTrack: { restartTrack: jest.Mock };
		localParticipant: {
			identity: string;
			setMicrophoneEnabled: jest.Mock;
			setCameraEnabled: jest.Mock;
			publishData: jest.Mock;
			getTrackPublication: jest.Mock;
		};
		emit: (event: string, ...args: unknown[]) => void;
	}[];

const hands = () => useConferenceInteractionStore.getState().hands;
const reactions = () => useConferenceInteractionStore.getState().reactions;

const published = (room: ReturnType<typeof rooms>[number]) =>
	room.localParticipant.publishData.mock.calls.map(([payload, options]) => ({
		message: parseMessage(payload as Uint8Array),
		reliable: (options as { reliable: boolean }).reliable
	}));

const receive = (room: ReturnType<typeof rooms>[number], from: { identity: string; name?: string }, message: CallDataMessage) =>
	room.emit('dataReceived', encodeMessage(message), from);

const state = () => useConferenceCallStore.getState();
const mocked = (fn: unknown) => fn as jest.Mock;
const options = { mic: true, cam: false };

const flush = () => new Promise<void>(resolve => setImmediate(resolve));

const openCall = (callId = 'call1', rid = 'GENERAL') => state().open({ callId, rid });

describe('ConferenceSession', () => {
	beforeEach(async () => {
		await conferenceSession.end();
		jest.clearAllMocks();
		livekit.Room.instances.length = 0;
		livekit.Room.failConnect = false;
		livekit.Room.holdConnect = false;
		state().close();
		useConferenceInteractionStore.getState().reset();
		useConferenceRoomStore.getState().setRoom(undefined);

		mocked(videoConferenceStart).mockResolvedValue({
			success: true,
			data: { type: 'videoconference', callId: 'started1', rid: 'GENERAL', providerName: 'livekit' }
		});
		mocked(videoConferenceJoin).mockResolvedValue({ success: true, url: '', providerName: 'livekit' });
		mocked(videoConferenceCallConfig).mockResolvedValue({
			success: true,
			providerName: 'livekit',
			livekit: { serverUrl: 'wss://lk.example.com', token: 'jwt', roomName: 'mc-call1' }
		});
		mocked(videoConferenceHeartbeat).mockResolvedValue({ success: true });
		mocked(videoConferenceLeave).mockResolvedValue({ success: true });
	});

	afterEach(async () => {
		jest.useRealTimers();
		await conferenceSession.end();
	});

	describe('joining', () => {
		test('joins an existing call without starting a new one', async () => {
			openCall();

			await conferenceSession.join(options);

			expect(videoConferenceStart).not.toHaveBeenCalled();
			expect(videoConferenceJoin).toHaveBeenCalledWith('call1', false, true);
		});

		test('starts a call from a room, with the name chosen, before joining it', async () => {
			state().open({ callId: preflightCallId('GENERAL'), rid: 'GENERAL' });

			await conferenceSession.join({ ...options, title: 'Standup' });

			expect(videoConferenceStart).toHaveBeenCalledWith('GENERAL', { title: 'Standup' });
			expect(videoConferenceJoin).toHaveBeenCalledWith('started1', false, true);
			expect(state().callId).toBe('started1');
			expect(state().rid).toBe('GENERAL');
		});

		test('connects with the credentials the Workspace issued, after starting audio', async () => {
			openCall();

			await conferenceSession.join(options);

			const [room] = rooms();
			expect(room.connect).toHaveBeenCalledWith('wss://lk.example.com', 'jwt');
			expect(mocked(livekit.AudioSession.startAudioSession).mock.invocationCallOrder[0]).toBeLessThan(
				room.connect.mock.invocationCallOrder[0]
			);
		});

		test('publishes the mic and camera the user chose', async () => {
			openCall();

			await conferenceSession.join({ mic: true, cam: true });

			const [room] = rooms();
			expect(room.localParticipant.setMicrophoneEnabled).toHaveBeenCalledWith(true);
			expect(room.localParticipant.setCameraEnabled).toHaveBeenCalledWith(true, { facingMode: 'user' });
		});

		test('is connected only once the room is, and exposes the room to the UI', async () => {
			openCall();

			await conferenceSession.join(options);

			expect(state().phase).toBe('connected');
			expect(useConferenceRoomStore.getState().room).toBe(rooms()[0]);
		});

		test('ignores a second join while one is running', async () => {
			openCall();

			await conferenceSession.join(options);
			await conferenceSession.join(options);

			expect(videoConferenceJoin).toHaveBeenCalledTimes(1);
			expect(rooms()).toHaveLength(1);
		});

		test('can join again after the call ended', async () => {
			openCall();
			await conferenceSession.join(options);
			rooms()[0].emit('disconnected');
			await flush();

			openCall();
			await conferenceSession.join(options);

			expect(rooms()).toHaveLength(2);
			expect(state().phase).toBe('connected');
		});
	});

	describe('presence', () => {
		test('sends a heartbeat on joining and then every 30 seconds', async () => {
			jest.useFakeTimers();
			openCall();
			await conferenceSession.join(options);
			expect(videoConferenceHeartbeat).toHaveBeenCalledTimes(1);

			jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS);
			expect(videoConferenceHeartbeat).toHaveBeenCalledTimes(2);

			jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 2);
			expect(videoConferenceHeartbeat).toHaveBeenCalledTimes(4);
		});

		test('stops heartbeating once the call is over', async () => {
			jest.useFakeTimers();
			openCall();
			await conferenceSession.join(options);

			await conferenceSession.end();
			jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 3);

			expect(videoConferenceHeartbeat).toHaveBeenCalledTimes(1);
		});
	});

	describe('leaving', () => {
		test('reports leaving exactly once and disconnects, however many times it ends', async () => {
			openCall();
			await conferenceSession.join(options);
			const [room] = rooms();

			await conferenceSession.end();
			await conferenceSession.end();

			expect(videoConferenceLeave).toHaveBeenCalledTimes(1);
			expect(videoConferenceLeave).toHaveBeenCalledWith('call1');
			expect(room.disconnect).toHaveBeenCalled();
			expect(livekit.AudioSession.stopAudioSession).toHaveBeenCalledTimes(1);
			expect(useConferenceRoomStore.getState().room).toBeUndefined();
		});

		test('a call dropped from the other side ends here too, and is reported once', async () => {
			openCall();
			await conferenceSession.join(options);

			rooms()[0].emit('disconnected');
			await flush();
			await conferenceSession.end();

			expect(state().phase).toBe('ended');
			expect(videoConferenceLeave).toHaveBeenCalledTimes(1);
			expect(livekit.AudioSession.stopAudioSession).toHaveBeenCalledTimes(1);
			expect(useConferenceRoomStore.getState().room).toBeUndefined();
		});

		test('being signed in on another device does not report a leave, which the server would never undo', async () => {
			openCall();
			await conferenceSession.join(options);

			rooms()[0].emit('disconnected', 'duplicateIdentity');
			await flush();
			await conferenceSession.end();

			expect(state().phase).toBe('ended');
			expect(videoConferenceLeave).not.toHaveBeenCalled();
			expect(showToast).toHaveBeenCalledWith('You joined this call on another device');
			expect(livekit.AudioSession.stopAudioSession).toHaveBeenCalledTimes(1);
		});

		test('any other reason for being disconnected still reports the leave', async () => {
			openCall();
			await conferenceSession.join(options);

			rooms()[0].emit('disconnected', 'serverShutdown');
			await flush();

			expect(videoConferenceLeave).toHaveBeenCalledTimes(1);
			expect(showToast).not.toHaveBeenCalledWith('You joined this call on another device');
		});

		test('leaving while the join is still in flight reports it and never connects', async () => {
			let finishJoin!: () => void;
			mocked(videoConferenceJoin).mockImplementationOnce(
				() =>
					new Promise(resolve => {
						finishJoin = () => resolve({ success: true, url: '', providerName: 'livekit' });
					})
			);
			openCall();

			const joining = conferenceSession.join(options);
			await flush();
			await conferenceSession.end();
			finishJoin();
			await joining;

			expect(videoConferenceLeave).toHaveBeenCalledTimes(1);
			expect(videoConferenceCallConfig).not.toHaveBeenCalled();
			expect(rooms()).toHaveLength(0);
		});
	});

	describe('failures', () => {
		test('a Workspace without the LiveKit licence ends the join with its own error and leaves the call', async () => {
			mocked(videoConferenceCallConfig).mockRejectedValue({ data: { error: 'error-videoconf-livekit-not-licensed' } });
			openCall();

			await conferenceSession.join(options);

			expect(state().phase).toBe('error');
			expect(state().error).toBe('not-licensed');
			expect(videoConferenceLeave).toHaveBeenCalledWith('call1');
			expect(rooms()).toHaveLength(0);
			expect(livekit.AudioSession.startAudioSession).not.toHaveBeenCalled();
		});

		test('a provider the app cannot render is unsupported, and the join is undone', async () => {
			mocked(videoConferenceJoin).mockResolvedValue({ success: true, url: 'https://meet.example.com/x', providerName: 'jitsi' });
			openCall();

			await conferenceSession.join(options);

			expect(state().error).toBe('unsupported');
			expect(videoConferenceLeave).toHaveBeenCalledTimes(1);
			expect(videoConferenceCallConfig).not.toHaveBeenCalled();
		});

		test('a join the Workspace refuses fails without reporting a leave nobody joined', async () => {
			mocked(videoConferenceJoin).mockRejectedValue(new Error('Network request failed'));
			openCall();

			await conferenceSession.join(options);

			expect(state().phase).toBe('error');
			expect(state().error).toBe('join-failed');
			expect(videoConferenceLeave).not.toHaveBeenCalled();
		});

		test('a response that reports failure is a failed join even though nothing was thrown', async () => {
			mocked(videoConferenceJoin).mockResolvedValue({ success: false });
			openCall();

			await conferenceSession.join(options);

			expect(state().error).toBe('join-failed');
			expect(videoConferenceLeave).not.toHaveBeenCalled();
			expect(videoConferenceCallConfig).not.toHaveBeenCalled();
		});

		test('a connection that cannot be made fails, undoes the join and releases audio', async () => {
			livekit.Room.failConnect = true;
			openCall();

			await conferenceSession.join(options);

			expect(state().phase).toBe('error');
			expect(state().error).toBe('join-failed');
			expect(videoConferenceLeave).toHaveBeenCalledTimes(1);
			expect(livekit.AudioSession.stopAudioSession).toHaveBeenCalledTimes(1);
		});
	});

	describe('hands, reactions and mute requests', () => {
		const join = async () => {
			openCall();
			await conferenceSession.join(options);
			return rooms()[0];
		};

		test('raising the hand shows it for us at once and tells the others reliably', async () => {
			const room = await join();

			await conferenceSession.toggleHand();

			expect(hands().me).toBeGreaterThan(0);
			expect(published(room)).toEqual([{ message: expect.objectContaining({ type: 'hand', raised: true }), reliable: true }]);
		});

		test('lowering the hand clears it and says so', async () => {
			const room = await join();
			await conferenceSession.toggleHand();

			await conferenceSession.toggleHand();

			expect(hands().me).toBe(0);
			expect(published(room)[1].message).toMatchObject({ type: 'hand', raised: false });
		});

		test('shows a hand somebody else raised', async () => {
			const room = await join();

			receive(room, { identity: 'ada' }, { type: 'hand', raised: true, raisedAt: 42 });

			expect(hands().ada).toBe(42);
		});

		test('repeats a raised hand to someone who joins later, marked as a repeat', async () => {
			const room = await join();
			await conferenceSession.toggleHand();
			room.localParticipant.publishData.mockClear();

			room.emit('participantConnected');

			expect(published(room)).toEqual([
				{ message: expect.objectContaining({ type: 'hand', raised: true, rebroadcast: true }), reliable: true }
			]);
		});

		test('has nothing to repeat to a new arrival while the hand is down', async () => {
			const room = await join();

			room.emit('participantConnected');

			expect(room.localParticipant.publishData).not.toHaveBeenCalled();
		});

		test('forgets the hand of someone who left', async () => {
			const room = await join();
			receive(room, { identity: 'ada' }, { type: 'hand', raised: true, raisedAt: 42 });

			room.emit('participantDisconnected', { identity: 'ada' });

			expect(hands()).toEqual({});
		});

		test('a reaction we send shows for us and goes out without being guaranteed', async () => {
			const room = await join();

			await conferenceSession.sendReaction('🎉');

			expect(reactions()).toEqual([expect.objectContaining({ participantId: 'me', emoji: '🎉' })]);
			expect(published(room)).toEqual([{ message: expect.objectContaining({ type: 'reaction', emoji: '🎉' }), reliable: false }]);
		});

		test('shows a reaction from somebody else under the id they gave it', async () => {
			const room = await join();

			receive(room, { identity: 'ada' }, { type: 'reaction', emoji: '👍', reactionId: 'r1' });

			expect(reactions()).toEqual([expect.objectContaining({ id: 'r1', participantId: 'ada', emoji: '👍' })]);
		});

		test('a mute request aimed at us turns the microphone off and says who asked', async () => {
			const room = await join();

			receive(room, { identity: 'ada', name: 'Ada' }, { type: 'mute', target: 'me' });

			expect(room.localParticipant.setMicrophoneEnabled).toHaveBeenLastCalledWith(false);
			expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Ada'));
		});

		test('a mute request aimed at somebody else leaves our microphone alone', async () => {
			const room = await join();
			room.localParticipant.setMicrophoneEnabled.mockClear();

			receive(room, { identity: 'ada', name: 'Ada' }, { type: 'mute', target: 'bob' });

			expect(room.localParticipant.setMicrophoneEnabled).not.toHaveBeenCalled();
			expect(showToast).not.toHaveBeenCalled();
		});

		test('asking someone to mute sends them a reliable request', async () => {
			const room = await join();

			await conferenceSession.requestMute('bob');

			expect(published(room)).toEqual([{ message: { type: 'mute', target: 'bob' }, reliable: true }]);
		});

		test('ignores anything that arrives after the call ended', async () => {
			const room = await join();
			await conferenceSession.end();

			receive(room, { identity: 'ada' }, { type: 'hand', raised: true, raisedAt: 42 });

			expect(hands()).toEqual({});
		});

		test('clears hands and reactions when the call ends', async () => {
			const room = await join();
			await conferenceSession.toggleHand();
			receive(room, { identity: 'ada' }, { type: 'reaction', emoji: '👍' });

			await conferenceSession.end();

			expect(hands()).toEqual({});
			expect(reactions()).toEqual([]);
		});

		test('has nobody to tell before there is a call', async () => {
			await expect(conferenceSession.toggleHand()).resolves.toBeUndefined();
			await expect(conferenceSession.sendReaction('👍')).resolves.toBeUndefined();
			await expect(conferenceSession.requestMute('bob')).resolves.toBeUndefined();
		});
	});

	describe('cancelling', () => {
		test('cancelling while connecting ends quietly instead of reporting a failure', async () => {
			livekit.Room.holdConnect = true;
			openCall();
			const joining = conferenceSession.join(options);
			await flush();

			state().close();
			await conferenceSession.end();
			await joining;

			expect(log).not.toHaveBeenCalled();
			expect(state().phase).toBe('preflight');
			expect(state().callId).toBeUndefined();
		});

		test('cancelling before the call has started does not bring the call back', async () => {
			let resolveStart: (value: unknown) => void = () => {};
			mocked(videoConferenceStart).mockReturnValue(
				new Promise(resolve => {
					resolveStart = resolve;
				})
			);
			state().open({ callId: preflightCallId('GENERAL'), rid: 'GENERAL' });
			const joining = conferenceSession.join(options);
			await flush();

			state().close();
			await conferenceSession.end();
			resolveStart({
				success: true,
				data: { type: 'videoconference', callId: 'started1', rid: 'GENERAL', providerName: 'livekit' }
			});
			await joining;

			expect(state().callId).toBeUndefined();
			expect(videoConferenceJoin).not.toHaveBeenCalled();
		});

		test('a call that is quickly joined again keeps its audio when the old one finishes closing', async () => {
			openCall();
			await conferenceSession.join(options);

			const ending = conferenceSession.end();
			state().close();
			openCall('call2');
			const joiningAgain = conferenceSession.join(options);
			await Promise.all([ending, joiningAgain]);

			expect(livekit.AudioSession.stopAudioSession).not.toHaveBeenCalled();
			expect(state().phase).toBe('connected');
		});
	});

	describe('leaving', () => {
		test('frees the microphone and audio without waiting for the Workspace to hear about it', async () => {
			let resolveLeave: (value: unknown) => void = () => {};
			mocked(videoConferenceLeave).mockReturnValue(
				new Promise(resolve => {
					resolveLeave = resolve;
				})
			);
			openCall();
			await conferenceSession.join(options);
			const [room] = rooms();

			const ending = conferenceSession.end();
			await flush();

			expect(room.disconnect).toHaveBeenCalled();
			expect(livekit.AudioSession.stopAudioSession).toHaveBeenCalled();

			resolveLeave({ success: true });
			await ending;
		});
	});

	describe('video quality', () => {
		const joinWithoutCamera = async () => {
			openCall();
			await conferenceSession.join(options);
			return rooms()[0];
		};

		test('every call starts at automatic quality', async () => {
			useConferenceInteractionStore.getState().setVideoQuality('h180');

			await joinWithoutCamera();

			expect(useConferenceInteractionStore.getState().videoQuality).toBe('auto');
		});

		test('a choice made with the camera off is used when the camera is turned on', async () => {
			const room = await joinWithoutCamera();

			await conferenceSession.setVideoQuality('h720');
			await conferenceSession.setCamera(true);

			expect(useConferenceInteractionStore.getState().videoQuality).toBe('h720');
			expect(room.localParticipant.setCameraEnabled).toHaveBeenLastCalledWith(
				true,
				expect.objectContaining({ resolution: expect.objectContaining({ width: 1280, height: 720 }), facingMode: 'user' })
			);
		});

		test('turning the camera off asks for no capture options', async () => {
			const room = await joinWithoutCamera();

			await conferenceSession.setCamera(false);

			expect(room.localParticipant.setCameraEnabled).toHaveBeenLastCalledWith(false, undefined);
		});

		test('restarts a running camera at the new quality', async () => {
			const room = await joinWithoutCamera();

			await conferenceSession.setVideoQuality('h360');

			expect(room.cameraTrack.restartTrack).toHaveBeenCalledWith(
				expect.objectContaining({ resolution: expect.objectContaining({ width: 640 }) })
			);
			expect(useConferenceInteractionStore.getState().videoQuality).toBe('h360');
		});

		test('keeps showing the old quality when the camera could not be restarted', async () => {
			const room = await joinWithoutCamera();
			room.cameraTrack.restartTrack.mockRejectedValueOnce(new Error('device busy'));

			await conferenceSession.setVideoQuality('h360');

			expect(useConferenceInteractionStore.getState().videoQuality).toBe('auto');
		});
	});

	describe('microphone', () => {
		const joinWithMicrophone = async () => {
			openCall();
			await conferenceSession.join(options);
			return rooms()[0];
		};

		test('muting just mutes, with no recorder to let go of', async () => {
			const room = await joinWithMicrophone();

			await conferenceSession.setMicrophone(false);

			expect(room.localParticipant.setMicrophoneEnabled).toHaveBeenLastCalledWith(false);
			expect(stopConferenceMicLevelMonitor).not.toHaveBeenCalled();
		});

		test('unmuting lets go of the microphone the muted-speech monitor was listening to first', async () => {
			const room = await joinWithMicrophone();
			const order: string[] = [];
			mocked(stopConferenceMicLevelMonitor).mockImplementationOnce(async () => {
				order.push('monitor stopped');
			});
			room.localParticipant.setMicrophoneEnabled.mockImplementationOnce(async () => {
				order.push('microphone on');
			});

			await conferenceSession.setMicrophone(true);

			expect(order).toEqual(['monitor stopped', 'microphone on']);
		});

		test('does nothing before the call has a room', async () => {
			await expect(conferenceSession.setMicrophone(true)).resolves.toBeUndefined();
			expect(stopConferenceMicLevelMonitor).not.toHaveBeenCalled();
		});
	});

	describe('camera', () => {
		const joinWithoutCamera = async () => {
			openCall();
			await conferenceSession.join(options);
			return rooms()[0];
		};

		test('lists the cameras the device has, without its microphone', async () => {
			await joinWithoutCamera();

			const cameras = await conferenceSession.listCameras();

			expect(cameras.map(({ deviceId, facing }) => [deviceId, facing])).toEqual([
				['1', 'user'],
				['0', 'environment']
			]);
		});

		test('moves a running camera to the one that was picked, asking for it by id', async () => {
			const room = await joinWithoutCamera();

			await conferenceSession.selectCamera('0', 'environment');

			expect(room.cameraTrack.restartTrack).toHaveBeenCalledWith({ deviceId: { exact: '0' } });
			expect(useConferenceInteractionStore.getState()).toMatchObject({ cameraDeviceId: '0', cameraFacing: 'environment' });
		});

		test('keeps the old camera when the one that was picked could not be started', async () => {
			const room = await joinWithoutCamera();
			room.cameraTrack.restartTrack.mockRejectedValueOnce(new Error('device busy'));

			await conferenceSession.selectCamera('0', 'environment');

			expect(useConferenceInteractionStore.getState()).toMatchObject({ cameraDeviceId: undefined, cameraFacing: 'user' });
		});

		test('uses a camera picked with the camera off when the camera is turned on', async () => {
			const room = await joinWithoutCamera();
			room.localParticipant.getTrackPublication.mockReturnValueOnce(undefined);

			await conferenceSession.selectCamera('0', 'environment');
			await conferenceSession.setCamera(true);

			expect(room.cameraTrack.restartTrack).not.toHaveBeenCalled();
			expect(room.localParticipant.setCameraEnabled).toHaveBeenLastCalledWith(true, { deviceId: { exact: '0' } });
		});

		test('keeps the picked camera when the quality changes', async () => {
			const room = await joinWithoutCamera();
			await conferenceSession.selectCamera('0', 'environment');

			await conferenceSession.setVideoQuality('h360');

			expect(room.cameraTrack.restartTrack).toHaveBeenLastCalledWith(
				expect.objectContaining({ deviceId: { exact: '0' }, resolution: expect.objectContaining({ width: 640 }) })
			);
		});

		test('forgets the picked camera when the user flips the camera, which asks only for the other side', async () => {
			const room = await joinWithoutCamera();
			await conferenceSession.selectCamera('0', 'environment');

			await conferenceSession.switchCamera();

			expect(room.cameraTrack.restartTrack).toHaveBeenLastCalledWith({ facingMode: 'user' });
			expect(useConferenceInteractionStore.getState()).toMatchObject({ cameraDeviceId: undefined, cameraFacing: 'user' });
		});

		test('every call starts on the front camera again', async () => {
			await joinWithoutCamera();
			await conferenceSession.selectCamera('0', 'environment');
			await conferenceSession.end();

			await joinWithoutCamera();

			expect(useConferenceInteractionStore.getState()).toMatchObject({ cameraDeviceId: undefined, cameraFacing: 'user' });
		});
	});

	describe('audio output', () => {
		const join = async () => {
			openCall();
			await conferenceSession.join(options);
		};

		test('starts on the speaker', async () => {
			await join();

			expect(useConferenceInteractionStore.getState().audioOutput).toBe('speaker');
		});

		test('moves the call audio to the output that was chosen and remembers it', async () => {
			await join();

			await conferenceSession.selectAudioOutput('earpiece');

			expect(livekit.AudioSession.selectAudioOutput).toHaveBeenCalledWith('earpiece');
			expect(useConferenceInteractionStore.getState().audioOutput).toBe('earpiece');
		});

		test('can move to a headset and back to the speaker', async () => {
			await join();

			await conferenceSession.selectAudioOutput('bluetooth');
			expect(useConferenceInteractionStore.getState().audioOutput).toBe('bluetooth');

			await conferenceSession.selectAudioOutput('speaker');
			expect(useConferenceInteractionStore.getState().audioOutput).toBe('speaker');
		});

		test('keeps showing the old output when the new one could not be selected', async () => {
			await join();
			mocked(livekit.AudioSession.selectAudioOutput).mockRejectedValueOnce(new Error('no such output'));

			await expect(conferenceSession.selectAudioOutput('bluetooth')).rejects.toThrow('no such output');

			expect(useConferenceInteractionStore.getState().audioOutput).toBe('speaker');
		});

		test('every call starts on the speaker again', async () => {
			await join();
			await conferenceSession.selectAudioOutput('earpiece');
			await conferenceSession.end();

			await join();

			expect(useConferenceInteractionStore.getState().audioOutput).toBe('speaker');
		});
	});

	describe('connection changes', () => {
		test('shows reconnecting while the link drops and connected again when it is back', async () => {
			openCall();
			await conferenceSession.join(options);
			const [room] = rooms();

			room.emit('connectionStateChanged', 'reconnecting');
			expect(state().phase).toBe('reconnecting');

			room.emit('connectionStateChanged', 'connected');
			expect(state().phase).toBe('connected');
		});

		test('a connection state that arrives after the call ended changes nothing', async () => {
			openCall();
			await conferenceSession.join(options);
			const [room] = rooms();
			await conferenceSession.end();
			state().setPhase('ended');

			room.emit('connectionStateChanged', 'connected');

			expect(state().phase).toBe('ended');
		});
	});
});
