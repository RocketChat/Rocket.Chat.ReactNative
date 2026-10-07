import { usePexipCallStore } from './usePexipCallStore';

describe('usePexipCallStore', () => {
	beforeEach(() => usePexipCallStore.getState().leave());

	it('opens full and keeps the call across layouts', () => {
		usePexipCallStore.getState().open({ callId: 'call-1', url: 'https://pexip.example/call', rid: 'rid-1' });
		expect(usePexipCallStore.getState().layout).toBe('full');

		usePexipCallStore.getState().split();
		expect(usePexipCallStore.getState().layout).toBe('split');

		usePexipCallStore.getState().minimize();
		expect(usePexipCallStore.getState().layout).toBe('minimized');
		expect(usePexipCallStore.getState().call).toMatchObject({ callId: 'call-1', rid: 'rid-1' });

		usePexipCallStore.getState().expand();
		expect(usePexipCallStore.getState().layout).toBe('full');
	});

	it('clears the call on leave', () => {
		usePexipCallStore.getState().open({ callId: 'call-1', url: 'https://pexip.example/call' });
		usePexipCallStore.getState().split();
		usePexipCallStore.getState().leave();
		expect(usePexipCallStore.getState().call).toBeNull();
		expect(usePexipCallStore.getState().layout).toBe('full');
	});
});
