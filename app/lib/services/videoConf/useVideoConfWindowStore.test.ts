import { useVideoConfWindowStore } from './useVideoConfWindowStore';

describe('useVideoConfWindowStore', () => {
	beforeEach(() => {
		useVideoConfWindowStore.getState().closeWindow();
	});

	it('starts closed', () => {
		expect(useVideoConfWindowStore.getState()).toMatchObject({ open: false, minimized: false });
	});

	it('opens in the foreground', () => {
		useVideoConfWindowStore.getState().openWindow();
		expect(useVideoConfWindowStore.getState()).toMatchObject({ open: true, minimized: false });
	});

	it('tracks minimize and restore without closing', () => {
		useVideoConfWindowStore.getState().openWindow();

		useVideoConfWindowStore.getState().setMinimized(true);
		expect(useVideoConfWindowStore.getState()).toMatchObject({ open: true, minimized: true });

		useVideoConfWindowStore.getState().setMinimized(false);
		expect(useVideoConfWindowStore.getState()).toMatchObject({ open: true, minimized: false });
	});

	it('clears minimized when the conference closes', () => {
		useVideoConfWindowStore.getState().openWindow();
		useVideoConfWindowStore.getState().setMinimized(true);

		useVideoConfWindowStore.getState().closeWindow();

		expect(useVideoConfWindowStore.getState()).toMatchObject({ open: false, minimized: false });
	});

	it('re-opening a conference clears a stale minimized flag', () => {
		useVideoConfWindowStore.getState().openWindow();
		useVideoConfWindowStore.getState().setMinimized(true);

		useVideoConfWindowStore.getState().openWindow();

		expect(useVideoConfWindowStore.getState().minimized).toBe(false);
	});
});
