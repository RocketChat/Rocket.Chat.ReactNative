import { isConferenceSessionActive, isPreflightCallId, preflightCallId, useConferenceCallStore } from '../useConferenceCallStore';

const state = () => useConferenceCallStore.getState();

describe('useConferenceCallStore', () => {
	beforeEach(() => {
		state().close();
	});

	test('starts with no call', () => {
		expect(state().callId).toBeUndefined();
		expect(state().expanded).toBe(false);
		expect(state().phase).toBe('preflight');
	});

	test('opening a call shows its preflight', () => {
		state().open({ callId: 'call1', rid: 'GENERAL' });

		expect(state().callId).toEqual('call1');
		expect(state().rid).toEqual('GENERAL');
		expect(state().expanded).toBe(true);
		expect(state().phase).toBe('preflight');
	});

	test('minimizing keeps the call alive', () => {
		state().open({ callId: 'call1' });
		state().setPhase('connected');

		state().minimize();

		expect(state().callId).toEqual('call1');
		expect(state().expanded).toBe(false);
		expect(state().phase).toBe('connected');
	});

	test('expanding brings a minimized call back', () => {
		state().open({ callId: 'call1' });
		state().minimize();

		state().expand();

		expect(state().expanded).toBe(true);
	});

	test('re-opening a live call only brings it back, it does not restart it', () => {
		state().open({ callId: 'call1' });
		state().setPhase('connected');
		state().minimize();

		state().open({ callId: 'call1' });

		expect(state().phase).toBe('connected');
		expect(state().expanded).toBe(true);
	});

	test('re-opening a call that ended starts over at its preflight', () => {
		state().open({ callId: 'call1' });
		state().setPhase('ended');

		state().open({ callId: 'call1' });

		expect(state().phase).toBe('preflight');
		expect(state().error).toBeUndefined();
	});

	test('re-opening a call that failed clears the failure', () => {
		state().open({ callId: 'call1' });
		state().setPhase('error', 'not-licensed');

		state().open({ callId: 'call1' });

		expect(state().phase).toBe('preflight');
		expect(state().error).toBeUndefined();
	});

	test('opening a different call replaces the one showing', () => {
		state().open({ callId: 'call1', rid: 'GENERAL' });
		state().setPhase('connected');

		state().open({ callId: 'call2', rid: 'other' });

		expect(state().callId).toEqual('call2');
		expect(state().rid).toEqual('other');
		expect(state().phase).toBe('preflight');
	});

	test('the same call id on another server is a different call', () => {
		state().open({ callId: 'call1', server: 'https://a.rocket.chat' });
		state().setPhase('connected');

		state().open({ callId: 'call1', server: 'https://b.rocket.chat' });

		expect(state().server).toEqual('https://b.rocket.chat');
		expect(state().phase).toBe('preflight');
	});

	test('assigning the started call keeps the room it was started in', () => {
		state().open({ callId: preflightCallId('GENERAL'), rid: 'GENERAL' });

		state().assignCall('call1');

		expect(state().callId).toEqual('call1');
		expect(state().rid).toEqual('GENERAL');
	});

	test('setting the phase records why a call failed', () => {
		state().open({ callId: 'call1' });

		state().setPhase('error', 'not-configured');

		expect(state().phase).toBe('error');
		expect(state().error).toBe('not-configured');
	});

	test('records when the call connected, once, so a reconnect does not restart the timer', () => {
		jest.useFakeTimers().setSystemTime(1_000);
		state().open({ callId: 'call1' });
		state().setPhase('connected');
		jest.setSystemTime(5_000);
		state().setPhase('reconnecting');
		state().setPhase('connected');
		jest.useRealTimers();

		expect(state().connectedAt).toBe(1_000);
	});

	test('a call opened afresh has not connected yet', () => {
		state().open({ callId: 'call1' });
		state().setPhase('connected');

		state().open({ callId: 'call2' });

		expect(state().connectedAt).toBeUndefined();
	});

	test('closing clears the call and the owning server', () => {
		state().open({ callId: 'call1', rid: 'GENERAL', server: 'https://open.rocket.chat' });
		state().setPhase('connected');

		state().close();

		expect(state().callId).toBeUndefined();
		expect(state().rid).toBeUndefined();
		expect(state().server).toBeUndefined();
		expect(state().expanded).toBe(false);
		expect(state().phase).toBe('preflight');
	});

	test('is not in picture in picture to begin with, and can be put in and taken out of it', () => {
		expect(state().pictureInPicture).toBe(false);

		state().setPictureInPicture(true);
		expect(state().pictureInPicture).toBe(true);

		state().setPictureInPicture(false);
		expect(state().pictureInPicture).toBe(false);
	});

	test('closing the call takes it out of picture in picture', () => {
		state().open({ callId: 'call1' });
		state().setPictureInPicture(true);

		state().close();

		expect(state().pictureInPicture).toBe(false);
	});

	test('expanding with no call does nothing', () => {
		state().expand();

		expect(state().expanded).toBe(false);
	});
});

describe('preflightCallId', () => {
	test('names a call that has not been started yet by its room', () => {
		expect(isPreflightCallId(preflightCallId('GENERAL'))).toBe(true);
		expect(isPreflightCallId('6ad084066ee569342ac48a4d')).toBe(false);
	});
});

describe('isConferenceSessionActive', () => {
	test.each([
		['preflight', false],
		['joining', true],
		['connecting', true],
		['connected', true],
		['reconnecting', true],
		['ended', false],
		['error', false]
	] as const)('%s -> %s', (phase, expected) => {
		expect(isConferenceSessionActive(phase)).toBe(expected);
	});
});
