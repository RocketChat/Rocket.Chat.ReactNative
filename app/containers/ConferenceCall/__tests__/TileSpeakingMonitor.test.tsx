import { act, render } from '@testing-library/react-native';

import { SPEAKING_RING_TIMING, SPEECH_LEVEL_THRESHOLD } from '~/lib/methods/helpers/stepSpeech';
import TileSpeakingMonitor from '../TileSpeakingMonitor';
import { type TTrackRef } from '../useConferenceTiles';

const mockUseTrackVolume = jest.fn();

jest.mock('@livekit/react-native', () => ({ useTrackVolume: (...args: unknown[]) => mockUseTrackVolume(...args) }));

const LOUD = SPEECH_LEVEL_THRESHOLD * 4;
const QUIET = SPEECH_LEVEL_THRESHOLD / 4;
const TICK = 40;
const LONG_ENOUGH_TO_BE_SPEECH_MS = SPEAKING_RING_TIMING.sustainedMs + TICK;
const track = { publication: {} } as unknown as TTrackRef;

const setup = (trackRef: TTrackRef | undefined = track) => {
	const onChange = jest.fn();
	const view = render(<TileSpeakingMonitor identity='ada' trackRef={trackRef} onChange={onChange} />);
	const hear = (level: number) => {
		mockUseTrackVolume.mockReturnValue(level);
		view.rerender(<TileSpeakingMonitor identity='ada' trackRef={trackRef} onChange={onChange} />);
	};
	const talkFor = (ms: number, level = LOUD) => {
		for (let elapsed = 0; elapsed <= ms; elapsed += TICK) {
			hear(level + elapsed / 1_000_000);
			act(() => {
				jest.advanceTimersByTime(TICK);
			});
		}
	};
	return { ...view, onChange, hear, talkFor };
};

describe('TileSpeakingMonitor', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers().setSystemTime(1_000_000);
		mockUseTrackVolume.mockReturnValue(0);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('listens to the track it was given', () => {
		setup();

		expect(mockUseTrackVolume).toHaveBeenCalledWith(track);
	});

	it('says nothing while nobody speaks', () => {
		const { onChange } = setup();

		expect(onChange).not.toHaveBeenCalled();
	});

	it('says the person is speaking as soon as their voice has lasted a moment, without waiting for the server', () => {
		const { onChange, talkFor } = setup();

		talkFor(LONG_ENOUGH_TO_BE_SPEECH_MS);

		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith('ada', true);
	});

	it('does not call a single noise speaking', () => {
		const { onChange, hear } = setup();

		hear(LOUD);

		expect(onChange).not.toHaveBeenCalled();
	});

	it('says the person stopped once they have been quiet for a while', () => {
		const { onChange, talkFor } = setup();
		talkFor(LONG_ENOUGH_TO_BE_SPEECH_MS);
		onChange.mockClear();

		act(() => {
			jest.advanceTimersByTime(SPEAKING_RING_TIMING.releaseMs + TICK);
		});

		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith('ada', false);
	});

	it('keeps saying they are speaking through a short pause', () => {
		const { onChange, talkFor, hear } = setup();
		talkFor(LONG_ENOUGH_TO_BE_SPEECH_MS);
		onChange.mockClear();

		hear(QUIET);
		act(() => {
			jest.advanceTimersByTime(SPEAKING_RING_TIMING.releaseMs / 2);
		});

		expect(onChange).not.toHaveBeenCalled();
	});

	it('says the person stopped the moment there is no track to listen to, such as when they mute', () => {
		const { onChange, talkFor, rerender } = setup();
		talkFor(LONG_ENOUGH_TO_BE_SPEECH_MS);
		onChange.mockClear();

		rerender(<TileSpeakingMonitor identity='ada' trackRef={undefined} onChange={onChange} />);

		expect(onChange).toHaveBeenCalledWith('ada', false);
	});

	it('says the person stopped when the tile goes away', () => {
		const { onChange, talkFor, unmount } = setup();
		talkFor(LONG_ENOUGH_TO_BE_SPEECH_MS);
		onChange.mockClear();

		unmount();

		expect(onChange).toHaveBeenCalledWith('ada', false);
	});

	it('is not reset when the screen redraws with a new callback', () => {
		const { onChange, talkFor, rerender } = setup();
		talkFor(LONG_ENOUGH_TO_BE_SPEECH_MS);
		onChange.mockClear();

		rerender(<TileSpeakingMonitor identity='ada' trackRef={track} onChange={jest.fn()} />);

		expect(onChange).not.toHaveBeenCalled();
	});
});
