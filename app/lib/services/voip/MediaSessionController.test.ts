import type { IClientMediaCall } from '@rocket.chat/media-signaling';

import { mediaSessionStore } from './MediaSessionStore';
import { MediaSessionController } from './MediaSessionController';

jest.mock('./MediaSessionStore', () => ({
	mediaSessionStore: {
		setWebRTCProcessorFactory: jest.fn(),
		getInstance: jest.fn(),
		dispose: jest.fn(),
		onChange: jest.fn(() => jest.fn())
	}
}));

jest.mock('../sdk', () => ({
	default: {
		onStreamData: jest.fn(() => ({ stop: jest.fn() }))
	}
}));

jest.mock('react-native-device-info', () => ({
	getUniqueIdSync: () => 'device-123'
}));

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: () => ({
			settings: {
				VoIP_TeamCollab_Ice_Servers: 'stun:stun.l.google.com:19302',
				VoIP_TeamCollab_Ice_Gathering_Timeout: 5000
			}
		}),
		subscribe: jest.fn(() => jest.fn())
	}
}));

type MockMediaSignalingSession = {
	userId: string;
	on: jest.Mock;
	setIceGatheringTimeout: jest.Mock;
};

jest.mock('@rocket.chat/media-signaling', () => ({
	MediaCallWebRTCProcessor: jest.fn().mockImplementation(function (this: unknown) {
		return this;
	}),
	MediaSignalingSession: jest
		.fn()
		.mockImplementation(function MockMediaSignalingSession(this: MockMediaSignalingSession, config: { userId: string }) {
			this.userId = config.userId;
			this.on = jest.fn();
			this.setIceGatheringTimeout = jest.fn();
		})
}));

jest.mock('react-native-webrtc', () => ({
	registerGlobals: jest.fn()
}));

describe('MediaSessionController', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('constructor', () => {
		it('should initialize with empty session', () => {
			const controller = new MediaSessionController('user-123');
			expect(controller.getSession()).toBeNull();
		});
	});

	describe('configure', () => {
		it('should set WebRTC processor factory with ICE servers', () => {
			const controller = new MediaSessionController('user-123');
			controller.configure();

			expect(mediaSessionStore.setWebRTCProcessorFactory).toHaveBeenCalledTimes(1);
			const factory = (mediaSessionStore.setWebRTCProcessorFactory as jest.Mock).mock.calls[0][0];
			const processor = factory({
				rtc: { iceServers: [] },
				iceGatheringTimeout: 5000
			});
			expect(processor).toBeDefined();
		});

		it('should create session via mediaSessionStore', () => {
			const mockInstance = { startCall: jest.fn() };
			(mediaSessionStore.getInstance as jest.Mock).mockReturnValue(mockInstance);

			const controller = new MediaSessionController('user-123');
			controller.configure();

			expect(mediaSessionStore.getInstance).toHaveBeenCalledWith('user-123');
		});
	});

	describe('getSession', () => {
		it('should return null before configure', () => {
			const controller = new MediaSessionController('user-123');
			expect(controller.getSession()).toBeNull();
		});

		it('should return session after configure', () => {
			const mockInstance = { startCall: jest.fn() };
			(mediaSessionStore.getInstance as jest.Mock).mockReturnValue(mockInstance);

			const controller = new MediaSessionController('user-123');
			controller.configure();

			expect(controller.getSession()).toBe(mockInstance);
		});
	});

	describe('reset', () => {
		it('should dispose mediaSessionStore and set session to null', () => {
			const mockInstance = { startCall: jest.fn() };
			(mediaSessionStore.getInstance as jest.Mock).mockReturnValue(mockInstance);

			const controller = new MediaSessionController('user-123');
			controller.configure();
			controller.reset();

			expect(mediaSessionStore.dispose).toHaveBeenCalled();
			expect(controller.getSession()).toBeNull();
		});
	});
});
