/**
 * CallNavRouter.test.ts
 *
 * Tests for CallNavRouter:
 *   - On callEnded when current route is CallView → Navigation.back() called
 *   - On callEnded when current route is NOT CallView → Navigation.back() NOT called
 *   - Subscription happens only after navigationReady emits
 *   - Multiple mount() calls are idempotent
 */

// Mock navigation BEFORE importing the module under test.
const mockGetCurrentRoute = jest.fn();
const mockBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../navigation/appNavigation', () => ({
	__esModule: true,
	default: {
		back: (...args: unknown[]) => mockBack(...args),
		navigate: (...args: unknown[]) => mockNavigate(...args),
		getCurrentRoute: (...args: unknown[]) => mockGetCurrentRoute(...args),
		// Start with no navigation ref (not ready).
		navigationRef: { current: null }
	},
	waitForNavigationReady: jest.fn().mockResolvedValue(undefined)
}));

// Import after mocks are set up.
import { callLifecycle } from './CallLifecycle';
import { CallNavRouter } from './CallNavRouter';
import { emitter } from '../../methods/helpers';
import Navigation from '../../navigation/appNavigation';

// ── Helpers ───────────────────────────────────────────────────────────────────

function setNavigationRef(ready: boolean): void {
	(Navigation.navigationRef as any).current = ready ? {} : null;
}

function emitNavigationReady(): void {
	emitter.emit('navigationReady', undefined);
}

function emitCallEnded(callId: string | null = 'test-call'): void {
	callLifecycle.emitter.emit('callEnded', { callId, reason: 'local' });
}

function emitCallBegan(callId = 'test-call', direction: 'incoming' | 'outgoing' = 'incoming', roomId?: string): void {
	callLifecycle.emitter.emit('callBegan', { callId, direction, roomId });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CallNavRouter', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Reset the router between tests.
		CallNavRouter.unmount();
		// Default: navigation not yet ready.
		setNavigationRef(false);
	});

	afterEach(() => {
		CallNavRouter.unmount();
	});

	describe('subscription after navigationReady', () => {
		it('does not call back before navigationReady fires', () => {
			mockGetCurrentRoute.mockReturnValue({ name: 'CallView' });
			CallNavRouter.mount();

			// Emit callEnded before nav is ready — should be ignored.
			emitCallEnded();

			expect(mockBack).not.toHaveBeenCalled();
		});

		it('calls back when callEnded fires AFTER navigationReady (on CallView route)', () => {
			mockGetCurrentRoute.mockReturnValue({ name: 'CallView' });
			CallNavRouter.mount();

			// Navigation becomes ready.
			emitNavigationReady();

			// callEnded fires.
			emitCallEnded();

			expect(mockBack).toHaveBeenCalledTimes(1);
		});

		it('subscribes immediately if navigationRef.current is already set at mount time', () => {
			mockGetCurrentRoute.mockReturnValue({ name: 'CallView' });
			setNavigationRef(true);

			CallNavRouter.mount();

			// No navigationReady needed — should already be subscribed.
			emitCallEnded();

			expect(mockBack).toHaveBeenCalledTimes(1);
		});
	});

	describe('navigation guard on callEnded', () => {
		beforeEach(() => {
			CallNavRouter.mount();
			emitNavigationReady();
		});

		it('calls Navigation.back() when current route is CallView', () => {
			mockGetCurrentRoute.mockReturnValue({ name: 'CallView' });

			emitCallEnded();

			expect(mockBack).toHaveBeenCalledTimes(1);
		});

		it('does NOT call Navigation.back() when current route is NOT CallView', () => {
			mockGetCurrentRoute.mockReturnValue({ name: 'RoomsListView' });

			emitCallEnded();

			expect(mockBack).not.toHaveBeenCalled();
		});

		it('does NOT call Navigation.back() when getCurrentRoute returns undefined', () => {
			mockGetCurrentRoute.mockReturnValue(undefined);

			emitCallEnded();

			expect(mockBack).not.toHaveBeenCalled();
		});

		it('does NOT call Navigation.back() when getCurrentRoute returns null', () => {
			mockGetCurrentRoute.mockReturnValue(null);

			emitCallEnded();

			expect(mockBack).not.toHaveBeenCalled();
		});

		it('calls back once per callEnded event', () => {
			mockGetCurrentRoute.mockReturnValue({ name: 'CallView' });

			emitCallEnded('call-a');
			emitCallEnded('call-b');

			// Two callEnded events → two back() calls (different calls).
			expect(mockBack).toHaveBeenCalledTimes(2);
		});
	});

	describe('mount() idempotency', () => {
		it('multiple mount() calls do not cause duplicate back() calls', () => {
			mockGetCurrentRoute.mockReturnValue({ name: 'CallView' });

			CallNavRouter.mount();
			CallNavRouter.mount();
			CallNavRouter.mount();

			emitNavigationReady();
			emitCallEnded();

			// Only one back() call despite multiple mount() calls.
			expect(mockBack).toHaveBeenCalledTimes(1);
		});
	});

	describe('unmount()', () => {
		it('stops responding to callEnded after unmount()', () => {
			mockGetCurrentRoute.mockReturnValue({ name: 'CallView' });
			CallNavRouter.mount();
			emitNavigationReady();

			CallNavRouter.unmount();

			emitCallEnded();

			expect(mockBack).not.toHaveBeenCalled();
		});

		it('can be re-mounted after unmount', () => {
			mockGetCurrentRoute.mockReturnValue({ name: 'CallView' });

			CallNavRouter.mount();
			emitNavigationReady();
			CallNavRouter.unmount();

			// Re-mount and re-subscribe.
			CallNavRouter.mount();
			emitNavigationReady();
			emitCallEnded();

			expect(mockBack).toHaveBeenCalledTimes(1);
		});
	});

	describe('navigation to CallView on callBegan', () => {
		beforeEach(() => {
			CallNavRouter.mount();
			emitNavigationReady();
		});

		it('navigates to CallView when callBegan fires (incoming)', () => {
			emitCallBegan('call-in-1', 'incoming');
			expect(mockNavigate).toHaveBeenCalledWith('CallView');
		});

		it('navigates to CallView when callBegan fires (outgoing)', () => {
			emitCallBegan('call-out-1', 'outgoing');
			expect(mockNavigate).toHaveBeenCalledWith('CallView');
		});

		it('navigates exactly once per callBegan event', () => {
			emitCallBegan('call-once-1', 'incoming');
			expect(mockNavigate).toHaveBeenCalledTimes(1);
		});

		it('navigates once per callBegan when multiple events fired', () => {
			emitCallBegan('call-a', 'incoming');
			emitCallBegan('call-b', 'outgoing');
			expect(mockNavigate).toHaveBeenCalledTimes(2);
			expect(mockNavigate).toHaveBeenNthCalledWith(1, 'CallView');
			expect(mockNavigate).toHaveBeenNthCalledWith(2, 'CallView');
		});

		it('does NOT navigate to CallView before navigationReady fires', () => {
			// Mount fresh router — navigation not yet ready
			CallNavRouter.unmount();
			setNavigationRef(false);
			CallNavRouter.mount();

			emitCallBegan('call-early', 'incoming');

			expect(mockNavigate).not.toHaveBeenCalled();
		});

		it('navigates after unmount does NOT fire (no listener after unmount)', () => {
			CallNavRouter.unmount();

			emitCallBegan('call-after-unmount', 'incoming');

			expect(mockNavigate).not.toHaveBeenCalled();
		});
	});
});
