import { usePexipCallStore } from './usePexipCallStore';

describe('usePexipCallStore', () => {
	beforeEach(() => usePexipCallStore.getState().leave());

	it('opens expanded and keeps the call while minimized', () => {
		usePexipCallStore.getState().open({ callId: 'call-1', url: 'https://pexip.example/call', rid: 'rid-1' });
		expect(usePexipCallStore.getState().minimized).toBe(false);

		usePexipCallStore.getState().minimize();
		expect(usePexipCallStore.getState().minimized).toBe(true);
		expect(usePexipCallStore.getState().call).toMatchObject({ callId: 'call-1', rid: 'rid-1' });

		usePexipCallStore.getState().expand();
		expect(usePexipCallStore.getState().minimized).toBe(false);
	});

	it('clears the call on leave', () => {
		usePexipCallStore.getState().open({ callId: 'call-1', url: 'https://pexip.example/call' });
		usePexipCallStore.getState().leave();
		expect(usePexipCallStore.getState().call).toBeNull();
	});
});
