/* eslint-disable import/first */
jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: {
		current: undefined,
		onStreamData: jest.fn(),
		subscribeNotifyUser: jest.fn(() => [])
	}
}));

jest.mock('../../database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn(), write: jest.fn(), batch: jest.fn() } }
}));

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({ room: { subscribedRoom: undefined, rid: undefined, isDeleting: false } })),
		dispatch: jest.fn()
	}
}));

jest.mock('../helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../helpers/protectedFunction', () => ({
	__esModule: true,
	default: (fn: any) => fn
}));

jest.mock('../actions', () => ({
	handlePayloadUserInteraction: jest.fn()
}));

jest.mock('../../encryption', () => ({
	Encryption: {
		decryptPendingSubscriptions: jest.fn(),
		decryptPendingMessages: jest.fn(),
		getRoomInstance: jest.fn(),
		stopRoom: jest.fn(),
		provideRoomKeyToUser: jest.fn().mockResolvedValue(undefined),
		decryptMessage: jest.fn()
	}
}));

jest.mock('../updateMessages', () => ({
	__esModule: true,
	default: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../getRoom', () => ({
	getRoom: jest.fn()
}));

import subscribeRooms from './rooms';
import sdk from '../../services/sdk';
import { handlePayloadUserInteraction } from '../actions';
import { Encryption } from '../../encryption';
import * as roomsModule from './rooms';

describe('subscribeRooms', () => {
	let capturedHandler: (msg: any) => Promise<void> | void;
	const stopMock = jest.fn();
	const rawStop = jest.fn();

	beforeEach(async () => {
		// Clean up any prior subscription first (before resetting mocks, so its stop() doesn't pollute counts)
		const prior = roomsModule.roomsSubscription;
		if (prior) prior.stop();
		await Promise.resolve();
		stopMock.mockReset();
		rawStop.mockReset();
		(sdk.onStreamData as jest.Mock).mockReset().mockImplementation((_name: string, handler: (m: any) => void) => {
			capturedHandler = handler;
			return Promise.resolve({ stop: stopMock });
		});
		(sdk.subscribeNotifyUser as jest.Mock).mockReset().mockReturnValue([{ stop: rawStop }, { stop: rawStop }]);
		(sdk as any).current = { connection: { url: 'wss://example.com/websocket' } };
		(handlePayloadUserInteraction as jest.Mock).mockReset();
		(Encryption.provideRoomKeyToUser as jest.Mock).mockClear();
	});

	it('registers a stream-notify-user listener via sdk.onStreamData', () => {
		subscribeRooms();
		expect(sdk.onStreamData).toHaveBeenCalledWith('stream-notify-user', expect.any(Function));
	});

	it('registers per-user raw subscriptions via subscribeNotifyUser', () => {
		subscribeRooms();
		expect(sdk.subscribeNotifyUser).toHaveBeenCalledTimes(1);
	});

	it('exposes a roomsSubscription with a stop() function', () => {
		subscribeRooms();
		expect(roomsModule.roomsSubscription).not.toBeNull();
		expect(typeof roomsModule.roomsSubscription?.stop).toBe('function');
	});

	it('stop() unsubscribes the stream listener and stops raw handles', async () => {
		subscribeRooms();
		// Wait for the onStreamData promise to settle so streamListener is a Promise
		await Promise.resolve();
		roomsModule.roomsSubscription?.stop();
		await Promise.resolve();
		expect(stopMock).toHaveBeenCalled();
		expect(rawStop).toHaveBeenCalledTimes(2);
	});

	it('stop() clears roomsSubscription to null', () => {
		subscribeRooms();
		roomsModule.roomsSubscription?.stop();
		expect(roomsModule.roomsSubscription).toBeNull();
	});

	it('captures the server URL into subServer when subscribing', () => {
		subscribeRooms();
		// Drive a message that should be ignored because url matches (i.e. handler runs through)
		const handlerCallsBeforeMessage = (handlePayloadUserInteraction as jest.Mock).mock.calls.length;
		capturedHandler({
			msg: 'changed',
			fields: { eventName: 'u1/uiInteraction', args: [{ type: 'banner.open', payload: 'p' }] }
		});
		expect((handlePayloadUserInteraction as jest.Mock).mock.calls.length).toBeGreaterThan(handlerCallsBeforeMessage);
	});

	it('uiInteraction events dispatch via handlePayloadUserInteraction', async () => {
		subscribeRooms();
		await capturedHandler({
			msg: 'changed',
			fields: {
				eventName: 'u1/uiInteraction',
				args: [{ type: 'banner.open', extra: true }]
			}
		});
		expect(handlePayloadUserInteraction).toHaveBeenCalledWith('banner.open', { extra: true });
	});

	it('e2ekeyRequest events invoke Encryption.provideRoomKeyToUser with (keyId, roomId)', async () => {
		subscribeRooms();
		await capturedHandler({
			msg: 'changed',
			fields: { eventName: 'u1/e2ekeyRequest', args: ['rid-1', 'key-1'] }
		});
		expect(Encryption.provideRoomKeyToUser).toHaveBeenCalledWith('key-1', 'rid-1');
	});

	it('drops messages from a stale server (url mismatch)', async () => {
		subscribeRooms();
		// Change current server URL after subscription started
		(sdk as any).current = { connection: { url: 'wss://different.com/websocket' } };
		await capturedHandler({
			msg: 'changed',
			fields: { eventName: 'u1/uiInteraction', args: [{ type: 'banner.open', payload: 'p' }] }
		});
		expect(handlePayloadUserInteraction).not.toHaveBeenCalled();
	});
});
