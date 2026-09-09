import { useConferenceCallStore } from './useConferenceCallStore';

const state = () => useConferenceCallStore.getState();

describe('useConferenceCallStore', () => {
	beforeEach(() => {
		state().close();
	});

	test('starts with no call', () => {
		expect(state().callId).toBeUndefined();
		expect(state().url).toBeUndefined();
		expect(state().expanded).toBe(false);
	});

	test('opening a call shows it', () => {
		state().open({ callId: 'call1', url: 'https://open.rocket.chat/conference/call1' });

		expect(state().callId).toEqual('call1');
		expect(state().url).toEqual('https://open.rocket.chat/conference/call1');
		expect(state().expanded).toBe(true);
	});

	test('minimizing keeps the call alive', () => {
		state().open({ callId: 'call1', url: 'https://open.rocket.chat/conference/call1' });

		state().minimize();

		expect(state().callId).toEqual('call1');
		expect(state().url).toEqual('https://open.rocket.chat/conference/call1');
		expect(state().expanded).toBe(false);
	});

	test('expanding brings a minimized call back', () => {
		state().open({ callId: 'call1', url: 'https://open.rocket.chat/conference/call1' });
		state().minimize();

		state().expand();

		expect(state().expanded).toBe(true);
	});

	test('re-opening the call already loaded does not change its url', () => {
		state().open({ callId: 'call1', url: 'https://open.rocket.chat/conference/call1' });
		state().minimize();

		state().open({ callId: 'call1', url: 'https://open.rocket.chat/conference/call1?rejoined=1' });

		expect(state().url).toEqual('https://open.rocket.chat/conference/call1');
		expect(state().expanded).toBe(true);
	});

	test('opening a different call replaces the one showing', () => {
		state().open({ callId: 'call1', url: 'https://open.rocket.chat/conference/call1' });

		state().open({ callId: 'call2', url: 'https://open.rocket.chat/conference/call2' });

		expect(state().callId).toEqual('call2');
		expect(state().url).toEqual('https://open.rocket.chat/conference/call2');
	});

	test('joining the assigned call keeps the room preflight page instead of reloading it', () => {
		state().open({ callId: 'new:GENERAL', url: 'https://open.rocket.chat/conference/new?rid=GENERAL' });

		state().open({ callId: 'call1', url: 'https://open.rocket.chat/conference/call1' });

		expect(state().callId).toEqual('call1');
		expect(state().url).toEqual('https://open.rocket.chat/conference/new?rid=GENERAL');
		expect(state().expanded).toBe(true);
	});

	test('starting another room still replaces the preflight', () => {
		state().open({ callId: 'new:room1', url: 'https://open.rocket.chat/conference/new?rid=room1' });

		state().open({ callId: 'new:room2', url: 'https://open.rocket.chat/conference/new?rid=room2' });

		expect(state().callId).toEqual('new:room2');
		expect(state().url).toEqual('https://open.rocket.chat/conference/new?rid=room2');
	});

	test('closing clears the call', () => {
		state().open({ callId: 'call1', url: 'https://open.rocket.chat/conference/call1' });

		state().close();

		expect(state().callId).toBeUndefined();
		expect(state().url).toBeUndefined();
		expect(state().expanded).toBe(false);
	});

	test('expanding with no call does nothing', () => {
		state().expand();

		expect(state().expanded).toBe(false);
	});
});
