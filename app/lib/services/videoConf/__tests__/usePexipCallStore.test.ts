import { focusActivePexipCall, usePexipCallStore } from '../usePexipCallStore';

const call = { callId: 'call-1', url: 'https://pexip.example/call', rid: 'rid-1', server: 'https://open.rocket.chat' };

describe('usePexipCallStore', () => {
	beforeEach(() => usePexipCallStore.getState().leave());

	it('opens full and keeps the call across layouts', () => {
		usePexipCallStore.getState().open(call);
		expect(usePexipCallStore.getState().layout).toBe('full');

		usePexipCallStore.getState().split();
		expect(usePexipCallStore.getState().layout).toBe('split');
		expect(usePexipCallStore.getState().call).toMatchObject({ callId: 'call-1', rid: 'rid-1' });

		usePexipCallStore.getState().expand();
		expect(usePexipCallStore.getState().layout).toBe('full');
	});

	it('clears the call on leave', () => {
		usePexipCallStore.getState().open(call);
		usePexipCallStore.getState().split();
		usePexipCallStore.getState().leave();
		expect(usePexipCallStore.getState().call).toBeNull();
		expect(usePexipCallStore.getState().layout).toBe('full');
	});

	describe('focusActivePexipCall', () => {
		it('is false without an active call', () => {
			expect(focusActivePexipCall('call-1')).toBe(false);
		});

		it('expands the active call when it is the requested one', () => {
			usePexipCallStore.getState().open(call);
			usePexipCallStore.getState().split();

			expect(focusActivePexipCall('call-1')).toBe(true);
			expect(usePexipCallStore.getState().layout).toBe('full');
		});

		it('keeps another active call untouched', () => {
			usePexipCallStore.getState().open(call);
			usePexipCallStore.getState().split();

			expect(focusActivePexipCall('call-2')).toBe(true);
			expect(usePexipCallStore.getState()).toMatchObject({ layout: 'split', call: { callId: 'call-1' } });
		});
	});
});
