import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { InteractionManager } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { useNavigation } from '@react-navigation/native';

import AudioPlayer from '.';
import AudioManager from '../../lib/methods/AudioManager';
import { emitter } from '../../lib/methods/helpers/emitter';

jest.mock('../../lib/methods/AudioManager', () => ({
	__esModule: true,
	default: {
		loadAudio: jest.fn(),
		setOnPlaybackStatusUpdate: jest.fn(),
		setRateAsync: jest.fn(),
		addAudioRendered: jest.fn(),
		removeAudioRendered: jest.fn(),
		pauseAudio: jest.fn(),
		playAudio: jest.fn(),
		setPositionAsync: jest.fn()
	}
}));

jest.mock('../../lib/methods/userPreferences', () => ({
	useUserPreferences: () => [1.0]
}));

jest.mock('expo-keep-awake', () => ({
	activateKeepAwake: jest.fn(),
	deactivateKeepAwake: jest.fn()
}));

jest.mock('../../lib/methods/helpers/emitter', () => ({
	emitter: { on: jest.fn(), off: jest.fn(), emit: jest.fn() }
}));

jest.mock('../../theme', () => ({
	useTheme: () => ({ theme: 'light', colors: { surfaceLight: '#ffffff', strokeExtraLight: '#eeeeee' } })
}));

jest.mock('@react-navigation/native', () => ({
	useNavigation: jest.fn()
}));


const mockTaskCancel = jest.fn();
let capturedFocusCb: Function | undefined;
let capturedBlurCb: Function | undefined;
let mockUnsubscribe: jest.Mock;
let capturedAudioFocusedCb: Function | undefined;

const defaultProps = {
	fileUri: 'file:///audio.mp3',
	downloadState: 'downloaded' as const,
	rid: 'room-1',
	msgId: 'msg-1'
};

describe('AudioPlayer', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		(useSharedValue as jest.Mock).mockImplementation((init: any) => {
			const { useRef } = require('react');
			const ref = useRef({ value: init });
			return ref.current;
		});

		jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation((cb: any) => {
			cb();
			return { cancel: mockTaskCancel };
		});

		(AudioManager.loadAudio as jest.Mock).mockResolvedValue('mock-audio-key');
		(AudioManager.playAudio as jest.Mock).mockResolvedValue(undefined);
		(AudioManager.pauseAudio as jest.Mock).mockResolvedValue(undefined);

		capturedFocusCb = undefined;
		capturedBlurCb = undefined;
		mockUnsubscribe = jest.fn();
		const mockAddListener = jest.fn((event: string, cb: Function) => {
			if (event === 'focus') capturedFocusCb = cb;
			if (event === 'blur') capturedBlurCb = cb;
			return mockUnsubscribe;
		});
		(useNavigation as jest.Mock).mockReturnValue({ navigate: jest.fn(), addListener: mockAddListener });

		capturedAudioFocusedCb = undefined;
		(emitter.on as jest.Mock).mockImplementation((event: string, cb: Function) => {
			if (event === 'audioFocused') capturedAudioFocusedCb = cb;
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('audio loading', () => {
		it('calls AudioManager.loadAudio with correct params when fileUri is set and downloadState is downloaded', async () => {
			render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => {
				expect(AudioManager.loadAudio).toHaveBeenCalledWith({
					msgId: 'msg-1',
					rid: 'room-1',
					uri: 'file:///audio.mp3'
				});
			});
		});

		it('registers playback status callback and rate after audio is loaded', async () => {
			render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => {
				expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalledWith('mock-audio-key', expect.any(Function));
				expect(AudioManager.setRateAsync).toHaveBeenCalledWith('mock-audio-key', 1.0);
			});
		});

		it('does not load audio when downloadState is not downloaded', async () => {
			render(<AudioPlayer {...defaultProps} downloadState='loading' />);

			await act(async () => {});

			expect(InteractionManager.runAfterInteractions).not.toHaveBeenCalled();
			expect(AudioManager.loadAudio).not.toHaveBeenCalled();
		});

		it('does not load audio when fileUri is empty', async () => {
			render(<AudioPlayer {...defaultProps} fileUri='' />);

			await act(async () => {});

			expect(InteractionManager.runAfterInteractions).not.toHaveBeenCalled();
			expect(AudioManager.loadAudio).not.toHaveBeenCalled();
		});

		it('re-runs loadAudio when downloadState transitions to downloaded', async () => {
			const { rerender } = render(<AudioPlayer {...defaultProps} fileUri='' downloadState='to-download' />);

			expect(AudioManager.loadAudio).not.toHaveBeenCalled();

			rerender(<AudioPlayer {...defaultProps} downloadState='downloaded' />);

			await waitFor(() => {
				expect(AudioManager.loadAudio).toHaveBeenCalledWith({
					msgId: 'msg-1',
					rid: 'room-1',
					uri: 'file:///audio.mp3'
				});
			});
		});

		it('re-runs loadAudio when fileUri transitions from empty to populated', async () => {
			const { rerender } = render(<AudioPlayer {...defaultProps} fileUri='' downloadState='downloaded' />);

			expect(AudioManager.loadAudio).not.toHaveBeenCalled();

			rerender(<AudioPlayer {...defaultProps} />);

			await waitFor(() => {
				expect(AudioManager.loadAudio).toHaveBeenCalledWith({
					msgId: 'msg-1',
					rid: 'room-1',
					uri: 'file:///audio.mp3'
				});
			});
		});
	});

	describe('error handling (try-catch)', () => {
		it('silently catches loadAudio errors without crashing the component', async () => {
			(AudioManager.loadAudio as jest.Mock).mockRejectedValue(new Error('load failed'));

			const { getByTestId } = render(<AudioPlayer {...defaultProps} />);

			await act(async () => {});

			expect(() => getByTestId('play-button')).not.toThrow();
		});

		it('skips setOnPlaybackStatusUpdate and setRateAsync (with loaded key) when loadAudio throws', async () => {
			(AudioManager.loadAudio as jest.Mock).mockRejectedValue(new Error('load failed'));

			render(<AudioPlayer {...defaultProps} />);

			await act(async () => {});

			expect(AudioManager.setOnPlaybackStatusUpdate).not.toHaveBeenCalled();
			expect(AudioManager.setRateAsync).not.toHaveBeenCalledWith('mock-audio-key', expect.any(Number));
		});
	});

	describe('InteractionManager task cleanup', () => {
		it('cancels the InteractionManager task when the component unmounts', async () => {
			const { unmount } = render(<AudioPlayer {...defaultProps} />);

			act(() => unmount());

			expect(mockTaskCancel).toHaveBeenCalled();
		});

		it('does not create a task (and therefore never cancels) when conditions are not met', async () => {
			const { unmount } = render(<AudioPlayer {...defaultProps} fileUri='' />);

			act(() => unmount());

			expect(InteractionManager.runAfterInteractions).not.toHaveBeenCalled();
			expect(mockTaskCancel).not.toHaveBeenCalled();
		});

		it('cancels previous InteractionManager task when effect re-runs due to dependency change', async () => {
			mockTaskCancel.mockClear();

			const { rerender } = render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.loadAudio).toHaveBeenCalled());

			rerender(<AudioPlayer {...defaultProps} fileUri='file:///audio2.mp3' />);

			await waitFor(() => {
				expect(mockTaskCancel).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('onPress handler', () => {
		it('always calls onPlayButtonPress callback regardless of downloadState', () => {
			const onPlayButtonPress = jest.fn();
			const { getByTestId } = render(
				<AudioPlayer {...defaultProps} downloadState='loading' onPlayButtonPress={onPlayButtonPress} />
			);

			fireEvent.press(getByTestId('play-button'));

			expect(onPlayButtonPress).toHaveBeenCalledTimes(1);
		});

		it('does not call AudioManager when downloadState is loading', () => {
			const { getByTestId } = render(<AudioPlayer {...defaultProps} downloadState='loading' />);

			fireEvent.press(getByTestId('play-button'));

			expect(AudioManager.playAudio).not.toHaveBeenCalled();
			expect(AudioManager.pauseAudio).not.toHaveBeenCalled();
		});

		it('does not call AudioManager when downloadState is to-download', async () => {
			const { getByTestId } = render(<AudioPlayer {...defaultProps} downloadState='to-download' />);

			fireEvent.press(getByTestId('play-button'));

			await act(async () => {});

			expect(AudioManager.playAudio).not.toHaveBeenCalled();
			expect(AudioManager.pauseAudio).not.toHaveBeenCalled();
		});

		it('triggers playback when downloaded and play button is pressed', async () => {
			const { getByTestId } = render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.loadAudio).toHaveBeenCalled());

			fireEvent.press(getByTestId('play-button'));

			await waitFor(() => expect(AudioManager.playAudio).toHaveBeenCalledWith('mock-audio-key'));
		});
	});

	describe('togglePlayPause', () => {
		it('calls AudioManager.playAudio with loaded key when initially paused', async () => {
			const { getByTestId } = render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.loadAudio).toHaveBeenCalled());

			fireEvent.press(getByTestId('play-button'));

			await waitFor(() => expect(AudioManager.playAudio).toHaveBeenCalledWith('mock-audio-key'));
		});

		it('calls AudioManager.pauseAudio when audio is currently playing', async () => {
			const { getByTestId } = render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalled());
			const statusCb = (AudioManager.setOnPlaybackStatusUpdate as jest.Mock).mock.calls[0][1] as Function;

			act(() => statusCb({ isLoaded: true, isPlaying: true }));

			fireEvent.press(getByTestId('play-button'));

			await waitFor(() => expect(AudioManager.pauseAudio).toHaveBeenCalled());
		});

		it('swallows errors from AudioManager.playAudio', async () => {
			(AudioManager.playAudio as jest.Mock).mockRejectedValue(new Error('play failed'));
			const { getByTestId } = render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.loadAudio).toHaveBeenCalled());

			fireEvent.press(getByTestId('play-button'));

			await act(async () => {});
		});
	});

	describe('UI feedback: play/pause button label and timing', () => {
		it('play button shows Pause label while audio is playing', async () => {
			const { getByTestId } = render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalled());
			const statusCb = (AudioManager.setOnPlaybackStatusUpdate as jest.Mock).mock.calls[0][1] as Function;

			act(() => statusCb({ isLoaded: true, isPlaying: true }));

			await waitFor(() => expect(getByTestId('play-button').props.accessibilityLabel).toBe('Pause'));
		});

		it('play button shows Play label after audio is paused', async () => {
			const { getByTestId } = render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalled());
			const statusCb = (AudioManager.setOnPlaybackStatusUpdate as jest.Mock).mock.calls[0][1] as Function;

			act(() => statusCb({ isLoaded: true, isPlaying: true }));
			await waitFor(() => expect(getByTestId('play-button').props.accessibilityLabel).toBe('Pause'));

			act(() => statusCb({ isLoaded: true, isPlaying: false }));
			await waitFor(() => expect(getByTestId('play-button').props.accessibilityLabel).toBe('Play'));
		});

		it('currentTime.value advances as audio plays', async () => {
			render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalled());
			const statusCb = (AudioManager.setOnPlaybackStatusUpdate as jest.Mock).mock.calls[0][1] as Function;
			const currentTimeValue = (useSharedValue as jest.Mock).mock.results[1].value as { value: number };

			act(() => statusCb({ isLoaded: true, isPlaying: true, durationMillis: 30000, positionMillis: 1000 }));
			expect(currentTimeValue.value).toBe(1);

			act(() => statusCb({ isLoaded: true, isPlaying: true, durationMillis: 30000, positionMillis: 2000 }));
			expect(currentTimeValue.value).toBe(2);

			act(() => statusCb({ isLoaded: true, isPlaying: true, durationMillis: 30000, positionMillis: 3000 }));
			expect(currentTimeValue.value).toBe(3);
		});
	});

	describe('audioState computation and conditional rendering', () => {
		it('does not render PlaybackSpeed when downloadState is to-download', () => {
			const { queryByTestId } = render(<AudioPlayer {...defaultProps} downloadState='to-download' />);

			expect(queryByTestId('playback-speed')).toBeNull();
		});

		it('does not render PlaybackSpeed when downloaded and paused', async () => {
			const { queryByTestId } = render(<AudioPlayer {...defaultProps} />);

			await act(async () => {});

			expect(queryByTestId('playback-speed')).toBeNull();
		});

		it('renders PlaybackSpeed when downloaded and playing', async () => {
			const { queryByTestId } = render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalled());
			const statusCb = (AudioManager.setOnPlaybackStatusUpdate as jest.Mock).mock.calls[0][1] as Function;

			act(() => statusCb({ isLoaded: true, isPlaying: true }));

			await waitFor(() => expect(queryByTestId('playback-speed')).not.toBeNull());
		});

		it('does not render PlaybackSpeed when downloadState is loading', () => {
			const { queryByTestId } = render(<AudioPlayer {...defaultProps} downloadState='loading' />);

			expect(queryByTestId('playback-speed')).toBeNull();
		});
	});

	describe('keep-awake effect', () => {
		it('calls deactivateKeepAwake on mount (initial paused state is true)', async () => {
			render(<AudioPlayer {...defaultProps} />);

			await act(async () => {});

			expect(deactivateKeepAwake).toHaveBeenCalled();
		});

		it('calls activateKeepAwake when playback starts', async () => {
			render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalled());
			const statusCb = (AudioManager.setOnPlaybackStatusUpdate as jest.Mock).mock.calls[0][1] as Function;

			act(() => statusCb({ isLoaded: true, isPlaying: true }));

			await waitFor(() => expect(activateKeepAwake).toHaveBeenCalled());
		});
	});

	describe('navigation focus/blur listeners', () => {
		it('registers focus and blur listeners on mount', () => {
			render(<AudioPlayer {...defaultProps} />);

			const addListener = (useNavigation as jest.Mock).mock.results[0].value.addListener;
			expect(addListener).toHaveBeenCalledWith('focus', expect.any(Function));
			expect(addListener).toHaveBeenCalledWith('blur', expect.any(Function));
		});

		it('calls setOnPlaybackStatusUpdate and addAudioRendered when screen is focused', async () => {
			render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.loadAudio).toHaveBeenCalled());
			jest.clearAllMocks();

			act(() => capturedFocusCb!());

			expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalled();
			expect(AudioManager.addAudioRendered).toHaveBeenCalled();
		});

		it('calls removeAudioRendered when screen is blurred', () => {
			render(<AudioPlayer {...defaultProps} />);

			act(() => capturedBlurCb!());

			expect(AudioManager.removeAudioRendered).toHaveBeenCalled();
		});

		it('calls both unsubscribe functions on unmount', () => {
			const { unmount } = render(<AudioPlayer {...defaultProps} />);

			act(() => unmount());

			expect(mockUnsubscribe).toHaveBeenCalledTimes(2);
		});
	});

	describe('audioFocused emitter', () => {
		it('subscribes to the audioFocused event on mount', () => {
			render(<AudioPlayer {...defaultProps} />);

			expect(emitter.on).toHaveBeenCalledWith('audioFocused', expect.any(Function));
		});

		it('unsubscribes from the audioFocused event on unmount', () => {
			const { unmount } = render(<AudioPlayer {...defaultProps} />);

			act(() => unmount());

			expect(emitter.off).toHaveBeenCalledWith('audioFocused', expect.any(Function));
		});

		it("renders PlaybackSpeed when emitter fires with this component's audio key", async () => {
			const { queryByTestId } = render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.loadAudio).toHaveBeenCalled());

			act(() => capturedAudioFocusedCb!('mock-audio-key'));

			await waitFor(() => expect(queryByTestId('playback-speed')).not.toBeNull());
		});

		it('does not render PlaybackSpeed when emitter fires with a different audio key', async () => {
			const { queryByTestId } = render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.loadAudio).toHaveBeenCalled());

			act(() => capturedAudioFocusedCb!('some-other-audio-key'));

			await act(async () => {});

			expect(queryByTestId('playback-speed')).toBeNull();
		});
	});

	describe('onPlaybackStatusUpdate callback chain', () => {
		it('sets paused to false (audioState: playing) when status has isPlaying: true', async () => {
			const { queryByTestId } = render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalled());
			const statusCb = (AudioManager.setOnPlaybackStatusUpdate as jest.Mock).mock.calls[0][1] as Function;

			act(() => statusCb({ isLoaded: true, isPlaying: true }));

			await waitFor(() => expect(queryByTestId('playback-speed')).not.toBeNull());
		});

		it('keeps paused true when status has isPlaying: false', async () => {
			const { queryByTestId } = render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalled());
			const statusCb = (AudioManager.setOnPlaybackStatusUpdate as jest.Mock).mock.calls[0][1] as Function;

			act(() => statusCb({ isLoaded: true, isPlaying: false }));

			await act(async () => {});

			expect(queryByTestId('playback-speed')).toBeNull();
		});

		it('updates duration.value and currentTime.value from the status object', async () => {
			render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalled());
			const statusCb = (AudioManager.setOnPlaybackStatusUpdate as jest.Mock).mock.calls[0][1] as Function;

			const sharedValueMock = useSharedValue as jest.Mock;
			const durationValue = sharedValueMock.mock.results[0].value as { value: number };
			const currentTimeValue = sharedValueMock.mock.results[1].value as { value: number };

			act(() => statusCb({ isLoaded: true, durationMillis: 10000, positionMillis: 3000, isPlaying: false }));

			expect(durationValue.value).toBe(10);
			expect(currentTimeValue.value).toBe(3);
		});

		it('does not update currentTime.value when positionMillis exceeds durationMillis', async () => {
			render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalled());
			const statusCb = (AudioManager.setOnPlaybackStatusUpdate as jest.Mock).mock.calls[0][1] as Function;

			const currentTimeValue = (useSharedValue as jest.Mock).mock.results[1].value as { value: number };

			act(() => statusCb({ isLoaded: true, durationMillis: 5000, positionMillis: 2000, isPlaying: false }));
			expect(currentTimeValue.value).toBe(2);

			act(() => statusCb({ isLoaded: true, durationMillis: 5000, positionMillis: 9000, isPlaying: false }));
			expect(currentTimeValue.value).toBe(2);
		});

		it('does not update shared values when durationMillis is absent', async () => {
			render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalled());
			const statusCb = (AudioManager.setOnPlaybackStatusUpdate as jest.Mock).mock.calls[0][1] as Function;

			const durationValue = (useSharedValue as jest.Mock).mock.results[0].value as { value: number };

			act(() => statusCb({ isLoaded: true, isPlaying: false }));

			expect(durationValue.value).toBe(0);
		});

		it('resets paused to true and currentTime to 0 when audio finishes (didJustFinish)', async () => {
			const { queryByTestId } = render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalled());
			const statusCb = (AudioManager.setOnPlaybackStatusUpdate as jest.Mock).mock.calls[0][1] as Function;

			const currentTimeValue = (useSharedValue as jest.Mock).mock.results[1].value as { value: number };

			act(() => statusCb({ isLoaded: true, isPlaying: true, durationMillis: 5000, positionMillis: 4000 }));

			act(() => statusCb({ isLoaded: true, isPlaying: false, didJustFinish: true }));

			await waitFor(() => {
				expect(queryByTestId('playback-speed')).toBeNull();
				expect(currentTimeValue.value).toBe(0);
			});
		});

		it('advances currentTime through multiple playback status updates during playback', async () => {
			render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalled());
			const statusCb = (AudioManager.setOnPlaybackStatusUpdate as jest.Mock).mock.calls[0][1] as Function;

			const currentTimeValue = (useSharedValue as jest.Mock).mock.results[1].value as { value: number };

			act(() => statusCb({ isLoaded: true, isPlaying: true, durationMillis: 10000, positionMillis: 0 }));
			expect(currentTimeValue.value).toBe(0);

			act(() => statusCb({ isLoaded: true, isPlaying: true, durationMillis: 10000, positionMillis: 2500 }));
			expect(currentTimeValue.value).toBe(2.5);

			act(() => statusCb({ isLoaded: true, isPlaying: true, durationMillis: 10000, positionMillis: 5000 }));
			expect(currentTimeValue.value).toBe(5);

			act(() => statusCb({ isLoaded: true, isPlaying: true, durationMillis: 10000, positionMillis: 7500 }));
			expect(currentTimeValue.value).toBe(7.5);
		});

		it('sets duration.value from the first status update', async () => {
			render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalled());
			const statusCb = (AudioManager.setOnPlaybackStatusUpdate as jest.Mock).mock.calls[0][1] as Function;
			const durationValue = (useSharedValue as jest.Mock).mock.results[0].value as { value: number };

			act(() => statusCb({ isLoaded: true, isPlaying: true, durationMillis: 10000, positionMillis: 0 }));

			expect(durationValue.value).toBe(10);
		});

		it('updates currentTime.value as position advances', async () => {
			render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalled());
			const statusCb = (AudioManager.setOnPlaybackStatusUpdate as jest.Mock).mock.calls[0][1] as Function;
			const currentTimeValue = (useSharedValue as jest.Mock).mock.results[1].value as { value: number };

			act(() => statusCb({ isLoaded: true, isPlaying: false, durationMillis: 10000, positionMillis: 3500 }));

			expect(currentTimeValue.value).toBe(3.5);
		});

		it('resets currentTime.value to 0 after audio finishes', async () => {
			render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalled());
			const statusCb = (AudioManager.setOnPlaybackStatusUpdate as jest.Mock).mock.calls[0][1] as Function;
			const currentTimeValue = (useSharedValue as jest.Mock).mock.results[1].value as { value: number };

			act(() => statusCb({ isLoaded: true, isPlaying: true, durationMillis: 10000, positionMillis: 7777 }));
			act(() => statusCb({ isLoaded: true, isPlaying: false, didJustFinish: true }));

			expect(currentTimeValue.value).toBe(0);
		});

		it('does not crash when status is null', async () => {
			render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalled());
			const statusCb = (AudioManager.setOnPlaybackStatusUpdate as jest.Mock).mock.calls[0][1] as Function;

			act(() => statusCb(null));

			await act(async () => {});
		});
	});

	describe('integration: play and seek', () => {
		it('currentTime reaches 5 s after pressing play and a status update at 5 s', async () => {
			const { getByTestId } = render(<AudioPlayer {...defaultProps} />);

			await waitFor(() => expect(AudioManager.setOnPlaybackStatusUpdate).toHaveBeenCalled());
			const statusCb = (AudioManager.setOnPlaybackStatusUpdate as jest.Mock).mock.calls[0][1] as Function;
			const currentTimeValue = (useSharedValue as jest.Mock).mock.results[1].value as { value: number };

			fireEvent.press(getByTestId('play-button'));
			await waitFor(() => expect(AudioManager.playAudio).toHaveBeenCalledWith('mock-audio-key'));

			act(() => {
				statusCb({ isLoaded: true, isPlaying: true, positionMillis: 5000, durationMillis: 30000 });
			});

			expect(currentTimeValue.value).toBe(5);
		});
	});
});
