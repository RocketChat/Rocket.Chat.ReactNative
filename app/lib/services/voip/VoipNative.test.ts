import { InMemoryVoipNative } from './VoipNative';

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

	it('attach throws not yet implemented', () => {
		expect(() => adapter.attach({ onEvent: () => undefined })).toThrow('not yet implemented');
	});
});
