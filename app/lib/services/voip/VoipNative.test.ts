jest.mock('react-native-webrtc', () => ({ registerGlobals: jest.fn() }));
jest.mock('react-native-callkeep', () => ({
	__esModule: true,
	default: {
		addEventListener: jest.fn(() => ({ remove: jest.fn() })),
		clearInitialEvents: jest.fn(),
		getInitialEvents: jest.fn(() => Promise.resolve([]))
	}
}));
jest.mock('react-native-incall-manager', () => ({
	__esModule: true,
	default: { start: jest.fn(), stop: jest.fn(), setForceSpeakerphoneOn: jest.fn() }
}));
jest.mock('../../native/NativeVoip', () => ({
	__esModule: true,
	default: {
		registerVoipToken: jest.fn(),
		getInitialEvents: jest.fn(() => null),
		clearInitialEvents: jest.fn(),
		getLastVoipToken: jest.fn(() => ''),
		stopNativeDDPClient: jest.fn(),
		stopVoipCallService: jest.fn(),
		addListener: jest.fn(),
		removeListeners: jest.fn()
	}
}));

import type { VoipPayload } from '../../../definitions/Voip';
import { InMemoryVoipNative, type VoipNativeEvent } from './VoipNative';

function buildPayload(callId = 'call-1'): VoipPayload {
	return {
		callId,
		caller: 'id',
		username: 'user',
		host: 'https://x.example.com',
		hostName: 'X',
		type: 'incoming_call',
		notificationId: 1
	};
}

describe('InMemoryVoipNative', () => {
	let adapter: InMemoryVoipNative;

	beforeEach(() => {
		adapter = new InMemoryVoipNative();
	});

	it('starts with empty recorded list', () => {
		expect(adapter.recorded).toEqual([]);
	});

	it('call.end records end command with callUuid', () => {
		adapter.call.end('abc-123');
		expect(adapter.recorded).toEqual([{ cmd: 'end', callUuid: 'abc-123' }]);
	});

	it('two call.end calls produce two ordered records', () => {
		adapter.call.end('first');
		adapter.call.end('second');
		expect(adapter.recorded).toEqual([
			{ cmd: 'end', callUuid: 'first' },
			{ cmd: 'end', callUuid: 'second' }
		]);
	});

	it('call.markActive records markActive command', () => {
		adapter.call.markActive('uuid-1');
		expect(adapter.recorded).toEqual([{ cmd: 'markActive', callUuid: 'uuid-1' }]);
	});

	it('call.markAvailable records markAvailable command', () => {
		adapter.call.markAvailable('uuid-1');
		expect(adapter.recorded).toEqual([{ cmd: 'markAvailable', callUuid: 'uuid-1' }]);
	});

	it('call.setSpeaker(true) records setSpeaker on:true', async () => {
		await adapter.call.setSpeaker(true);
		expect(adapter.recorded).toEqual([{ cmd: 'setSpeaker', on: true }]);
	});

	it('call.setSpeaker(false) records setSpeaker on:false', async () => {
		await adapter.call.setSpeaker(false);
		expect(adapter.recorded).toEqual([{ cmd: 'setSpeaker', on: false }]);
	});

	it('call.startAudio records startAudio', () => {
		adapter.call.startAudio();
		expect(adapter.recorded).toEqual([{ cmd: 'startAudio' }]);
	});

	it('call.stopAudio records stopAudio', () => {
		adapter.call.stopAudio();
		expect(adapter.recorded).toEqual([{ cmd: 'stopAudio' }]);
	});

	it('mixed commands preserve insertion order', async () => {
		adapter.call.startAudio();
		adapter.call.markActive('u1');
		await adapter.call.setSpeaker(true);
		adapter.call.end('u1');
		adapter.call.stopAudio();
		expect(adapter.recorded).toEqual([
			{ cmd: 'startAudio' },
			{ cmd: 'markActive', callUuid: 'u1' },
			{ cmd: 'setSpeaker', on: true },
			{ cmd: 'end', callUuid: 'u1' },
			{ cmd: 'stopAudio' }
		]);
	});

	it('attach resolves', async () => {
		await expect(adapter.attach({ onEvent: () => undefined })).resolves.toBeDefined();
	});

	it('attach returns { detach fn, pushToken string }', async () => {
		const result = await adapter.attach({ onEvent: () => undefined });
		expect(typeof result.detach).toBe('function');
		expect(typeof result.pushToken).toBe('string');
	});
});

describe('InMemoryVoipNative — __emit', () => {
	let adapter: InMemoryVoipNative;
	let received: VoipNativeEvent[];

	beforeEach(() => {
		adapter = new InMemoryVoipNative();
		received = [];
	});

	it('__emit before attach is a no-op', () => {
		expect(() => adapter.__emit({ type: 'endCall', callUuid: 'cold' })).not.toThrow();
	});

	it('__emit after attach fires onEvent', async () => {
		await adapter.attach({ onEvent: e => received.push(e) });
		const event: VoipNativeEvent = { type: 'endCall', callUuid: 'uuid-1' };
		adapter.__emit(event);
		expect(received).toEqual([event]);
	});

	it('detach stops __emit from calling onEvent', async () => {
		const { detach } = await adapter.attach({ onEvent: e => received.push(e) });
		detach();
		adapter.__emit({ type: 'endCall', callUuid: 'uuid-2' });
		expect(received).toHaveLength(0);
	});

	it('detach is idempotent', async () => {
		const { detach } = await adapter.attach({ onEvent: () => undefined });
		expect(() => {
			detach();
			detach();
		}).not.toThrow();
	});
});

describe('InMemoryVoipNative — __seedColdStart', () => {
	let adapter: InMemoryVoipNative;
	let received: VoipNativeEvent[];

	beforeEach(() => {
		adapter = new InMemoryVoipNative();
		received = [];
	});

	it('seeds fire through onEvent during attach', async () => {
		const events: VoipNativeEvent[] = [{ type: 'acceptSucceeded', payload: buildPayload(), fromColdStart: true }];
		adapter.__seedColdStart(events);
		await adapter.attach({ onEvent: e => received.push(e) });
		expect(received).toEqual(events);
	});

	it('seeds cleared after first attach — not replayed on second attach', async () => {
		adapter.__seedColdStart([{ type: 'endCall', callUuid: 'cold-uuid' }]);
		await adapter.attach({ onEvent: e => received.push(e) });
		expect(received).toHaveLength(1);
		const received2: VoipNativeEvent[] = [];
		await adapter.attach({ onEvent: e => received2.push(e) });
		expect(received2).toHaveLength(0);
	});

	it('seeds fire before live __emit events', async () => {
		const order: string[] = [];
		adapter.__seedColdStart([{ type: 'acceptSucceeded', payload: buildPayload('seed-call'), fromColdStart: true }]);
		await adapter.attach({
			onEvent: e => {
				if (e.type === 'acceptSucceeded') order.push(`seed:${e.payload.callId}`);
				else if (e.type === 'endCall') order.push(`live:${e.callUuid}`);
			}
		});
		adapter.__emit({ type: 'endCall', callUuid: 'live-1' });
		expect(order).toEqual(['seed:seed-call', 'live:live-1']);
	});
});
