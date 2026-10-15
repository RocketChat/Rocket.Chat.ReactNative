import { act, renderHook } from '@testing-library/react-native';

import { ACTIVE_SPEAKER_HOLD_MS, ACTIVE_SPEAKER_SAMPLE_INTERVAL_MS } from '~/lib/methods/helpers/pickActiveSpeaker';
import { useActiveSpeakerId } from '../useActiveSpeakerId';

const TICK = ACTIVE_SPEAKER_SAMPLE_INTERVAL_MS;

const speaker = (identity: string, audioLevel = 0.5) => ({ identity, audioLevel });

describe('useActiveSpeakerId', () => {
	beforeEach(() => {
		jest.useFakeTimers().setSystemTime(1_000_000);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('names nobody before anyone speaks', () => {
		const { result } = renderHook(() => useActiveSpeakerId([], true));

		act(() => {
			jest.advanceTimersByTime(TICK * 3);
		});

		expect(result.current).toBeNull();
	});

	it('names the person who is speaking', () => {
		const { result } = renderHook(() => useActiveSpeakerId([speaker('ada')], true));

		act(() => {
			jest.advanceTimersByTime(TICK);
		});

		expect(result.current).toBe('ada');
	});

	it('picks the loudest when several are speaking', () => {
		const { result } = renderHook(() => useActiveSpeakerId([speaker('ada', 0.3), speaker('bob', 0.9)], true));

		act(() => {
			jest.advanceTimersByTime(TICK);
		});

		expect(result.current).toBe('bob');
	});

	it('keeps the speaker on for a moment after they stop, so the stage does not flicker', () => {
		const { result, rerender } = renderHook(
			({ speakers }: { speakers: ReturnType<typeof speaker>[] }) => useActiveSpeakerId(speakers, true),
			{
				initialProps: { speakers: [speaker('ada')] }
			}
		);
		act(() => {
			jest.advanceTimersByTime(TICK);
		});

		rerender({ speakers: [] });
		act(() => {
			jest.advanceTimersByTime(ACTIVE_SPEAKER_HOLD_MS - TICK * 2);
		});
		expect(result.current).toBe('ada');

		act(() => {
			jest.advanceTimersByTime(TICK * 4);
		});

		expect(result.current).toBeNull();
	});

	it('does no work, and names nobody, while the stage has no use for it', () => {
		const { result } = renderHook(() => useActiveSpeakerId([speaker('ada')], false));

		act(() => {
			jest.advanceTimersByTime(TICK * 5);
		});

		expect(result.current).toBeNull();
		expect(jest.getTimerCount()).toBe(0);
	});

	it('leaves no timer running once the screen is gone', () => {
		const { unmount } = renderHook(() => useActiveSpeakerId([speaker('ada')], true));
		expect(jest.getTimerCount()).toBe(1);

		unmount();

		expect(jest.getTimerCount()).toBe(0);
	});
});
