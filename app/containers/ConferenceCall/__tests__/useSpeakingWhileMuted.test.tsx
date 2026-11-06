import { act, renderHook } from '@testing-library/react-native';
import { type ReactNode } from 'react';
import { Platform } from 'react-native';
import { Provider } from 'react-redux';

import { APP_STATE } from '~/actions/actionsTypes';
import { MUTED_SPEECH_TIMING, SPEECH_LEVEL_THRESHOLD } from '~/lib/methods/helpers/stepSpeech';
import {
	onConferenceMicLevel,
	startConferenceMicLevelMonitor,
	stopConferenceMicLevelMonitor
} from '~/lib/services/conference/conferenceMicLevel';
import { mockedStore } from '~/reducers/mockedStore';
import { useSpeakingWhileMuted } from '../useSpeakingWhileMuted';

const mockLevels = { remove: jest.fn() };

jest.mock('~/lib/methods/helpers', () => {
	const { Platform: MockPlatform } = jest.requireActual('react-native');
	const proxy: Record<string, unknown> = { ...jest.requireActual('~/lib/methods/helpers') };
	Object.defineProperty(proxy, 'isAndroid', {
		get() {
			return MockPlatform.OS !== 'ios';
		},
		enumerable: true,
		configurable: true
	});
	return proxy;
});
jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/services/conference/conferenceMicLevel', () => ({
	startConferenceMicLevelMonitor: jest.fn(),
	stopConferenceMicLevelMonitor: jest.fn(),
	onConferenceMicLevel: jest.fn(() => mockLevels)
}));

const start = startConferenceMicLevelMonitor as jest.Mock;
const stop = stopConferenceMicLevelMonitor as jest.Mock;
const subscribe = onConferenceMicLevel as jest.Mock;
const LOUD = SPEECH_LEVEL_THRESHOLD * 4;
const QUIET = SPEECH_LEVEL_THRESHOLD / 4;
const TICK = 100;
const originalOS = Platform.OS;
const setPlatform = (os: 'ios' | 'android') => {
	(Platform as { OS: string }).OS = os;
};

afterAll(() => {
	setPlatform(originalOS as 'ios' | 'android');
});

const wrapper = ({ children }: { children: ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

const level = (value: number) => act(() => subscribe.mock.calls[subscribe.mock.calls.length - 1][0](value));

const feed = (value: number, ms: number) => {
	for (let elapsed = 0; elapsed <= ms; elapsed += TICK) {
		level(value);
		act(() => {
			jest.advanceTimersByTime(TICK);
		});
	}
};

describe('useSpeakingWhileMuted', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers().setSystemTime(1_000_000);
		setPlatform('android');
		start.mockResolvedValue(true);
		stop.mockResolvedValue(undefined);
		mockedStore.dispatch({ type: APP_STATE.FOREGROUND });
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('listens to the microphone while it is enabled, and says nothing until there is speech', () => {
		const { result } = renderHook(() => useSpeakingWhileMuted(true), { wrapper });

		expect(start).toHaveBeenCalledTimes(1);
		expect(result.current).toBe(false);
	});

	it('does not listen when it is not enabled', () => {
		renderHook(() => useSpeakingWhileMuted(false), { wrapper });

		expect(start).not.toHaveBeenCalled();
		expect(subscribe).not.toHaveBeenCalled();
	});

	it('says the user is speaking once their voice has lasted', () => {
		const { result } = renderHook(() => useSpeakingWhileMuted(true), { wrapper });

		feed(LOUD, MUTED_SPEECH_TIMING.sustainedMs);

		expect(result.current).toBe(true);
	});

	it('does not say it for a short noise', () => {
		const { result } = renderHook(() => useSpeakingWhileMuted(true), { wrapper });

		level(LOUD);

		expect(result.current).toBe(false);
	});

	it('keeps saying it through a pause between words', () => {
		const { result } = renderHook(() => useSpeakingWhileMuted(true), { wrapper });
		feed(LOUD, MUTED_SPEECH_TIMING.sustainedMs);

		feed(QUIET, MUTED_SPEECH_TIMING.releaseMs / 2);

		expect(result.current).toBe(true);
	});

	it('stops saying it a while after the user stops speaking', () => {
		const { result } = renderHook(() => useSpeakingWhileMuted(true), { wrapper });
		feed(LOUD, MUTED_SPEECH_TIMING.sustainedMs);

		feed(QUIET, MUTED_SPEECH_TIMING.releaseMs + TICK);

		expect(result.current).toBe(false);
	});

	it('stops listening and stops saying it the moment it is no longer enabled', () => {
		const { result, rerender } = renderHook(({ enabled }: { enabled: boolean }) => useSpeakingWhileMuted(enabled), {
			wrapper,
			initialProps: { enabled: true }
		});
		feed(LOUD, MUTED_SPEECH_TIMING.sustainedMs);

		rerender({ enabled: false });

		expect(result.current).toBe(false);
		expect(stop).toHaveBeenCalledTimes(1);
		expect(mockLevels.remove).toHaveBeenCalledTimes(1);
	});

	it('stops listening while the app is in the background, and starts again when it returns', () => {
		renderHook(() => useSpeakingWhileMuted(true), { wrapper });

		act(() => {
			mockedStore.dispatch({ type: APP_STATE.BACKGROUND });
		});
		expect(stop).toHaveBeenCalledTimes(1);

		act(() => {
			mockedStore.dispatch({ type: APP_STATE.FOREGROUND });
		});
		expect(start).toHaveBeenCalledTimes(2);
	});

	it('stops listening when the call screen goes away', () => {
		const { unmount } = renderHook(() => useSpeakingWhileMuted(true), { wrapper });

		unmount();

		expect(stop).toHaveBeenCalledTimes(1);
	});

	it('does nothing on iOS, where the microphone cannot be listened to while it is muted', () => {
		setPlatform('ios');

		const { result } = renderHook(() => useSpeakingWhileMuted(true), { wrapper });

		expect(result.current).toBe(false);
		expect(start).not.toHaveBeenCalled();
	});
});
