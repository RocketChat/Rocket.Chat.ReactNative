import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { I18nManager } from 'react-native';
import { State, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import { fireGestureHandler } from 'react-native-gesture-handler/jest-utils';
import { useSharedValue } from 'react-native-reanimated';

import Seek from '../Seek';

jest.mock('~/theme', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-native-gesture-handler', () => {
	const actual = jest.requireActual('react-native-gesture-handler');
	return { ...actual, usePanGesture: jest.fn(actual.usePanGesture), useTapGesture: jest.fn(actual.useTapGesture) };
});

const TRACK_WIDTH = 200;
const DURATION = 120;

const lastGesture = (hook: jest.Mock) => {
	const { results } = hook.mock;
	return results[results.length - 1].value;
};

const setup = () => {
	const { result } = renderHook(() => ({ currentTime: useSharedValue(30), duration: useSharedValue(DURATION) }));
	const { currentTime, duration } = result.current;
	const onChangeTime = jest.fn();
	render(<Seek currentTime={currentTime} duration={duration} loaded onChangeTime={onChangeTime} />);
	fireEvent(screen.getByTestId('audio-seek-track'), 'layout', { nativeEvent: { layout: { width: TRACK_WIDTH } } });
	return {
		pan: lastGesture(jest.mocked(usePanGesture)),
		tap: lastGesture(jest.mocked(useTapGesture)),
		currentTime,
		onChangeTime
	};
};

afterEach(() => jest.clearAllMocks());

test('a tap seeks to where it lands on the track', async () => {
	const { tap, onChangeTime } = setup();
	await act(() =>
		fireGestureHandler(tap, [
			{ state: State.BEGAN, x: 150 },
			{ state: State.ACTIVE, x: 150 },
			{ state: State.END, x: 150 }
		])
	);
	expect(onChangeTime).toHaveBeenCalledWith(90);
});

test('in a right-to-left layout a tap seeks from the right edge, where the audio starts', async () => {
	jest.replaceProperty(I18nManager, 'isRTL', true);
	const { tap, onChangeTime } = setup();
	await act(() =>
		fireGestureHandler(tap, [
			{ state: State.BEGAN, x: 150 },
			{ state: State.ACTIVE, x: 150 },
			{ state: State.END, x: 150 }
		])
	);
	expect(onChangeTime).toHaveBeenCalledWith(30);
	jest.restoreAllMocks();
});

test('a drag seeks once, on release, to where the finger left the track', async () => {
	const { pan, onChangeTime } = setup();
	await act(() =>
		fireGestureHandler(pan, [
			{ state: State.BEGAN, x: 20 },
			{ state: State.ACTIVE, x: 20 },
			{ state: State.ACTIVE, x: 80 },
			{ state: State.END, x: 100 }
		])
	);
	expect(onChangeTime).toHaveBeenCalledTimes(1);
	expect(onChangeTime).toHaveBeenCalledWith(60);
});

test('a drag past the end of the track seeks to the end', async () => {
	const { pan, onChangeTime } = setup();
	await act(() =>
		fireGestureHandler(pan, [
			{ state: State.BEGAN, x: 20 },
			{ state: State.ACTIVE, x: 20 },
			{ state: State.END, x: 500 }
		])
	);
	expect(onChangeTime).toHaveBeenCalledWith(DURATION);
});

test('a cancelled drag does not seek and leaves the position alone', async () => {
	const { pan, currentTime, onChangeTime } = setup();
	await act(() =>
		fireGestureHandler(pan, [
			{ state: State.BEGAN, x: 20 },
			{ state: State.ACTIVE, x: 80 },
			{ state: State.CANCELLED, x: 80 }
		])
	);
	expect(onChangeTime).not.toHaveBeenCalled();
	expect(currentTime.value).toBe(30);
});

test('a touch that never becomes a drag does not seek through the pan', async () => {
	const { pan, onChangeTime } = setup();
	await act(() =>
		fireGestureHandler(pan, [
			{ state: State.BEGAN, x: 20 },
			{ state: State.FAILED, x: 20 }
		])
	);
	expect(onChangeTime).not.toHaveBeenCalled();
});

const adjust = (actionName: 'increment' | 'decrement') =>
	fireEvent(screen.getByTestId('audio-seek'), 'accessibilityAction', { nativeEvent: { actionName } });

test('the seek bar is an adjustable control named for the audio position', () => {
	setup();
	const seekBar = screen.getByTestId('audio-seek');
	expect(seekBar.props.accessibilityRole).toBe('adjustable');
	expect(seekBar.props.accessibilityLabel).toBe('Audio position');
});

test('adjusting up seeks forward a few seconds and announces the new position', () => {
	const { onChangeTime } = setup();
	adjust('increment');
	expect(onChangeTime).toHaveBeenCalledWith(35);
	expect(screen.getByTestId('audio-seek').props.accessibilityValue).toEqual({ text: '0:35 of 2:00' });
	expect(screen.getByText('0:35 / 2:00')).toBeOnTheScreen();
});

test('adjusting down seeks back a few seconds, not past the start', () => {
	const { currentTime, onChangeTime } = setup();
	adjust('decrement');
	expect(onChangeTime).toHaveBeenLastCalledWith(25);

	currentTime.value = 2;
	adjust('decrement');
	expect(onChangeTime).toHaveBeenLastCalledWith(0);
});

test('before the audio loads, the seek bar reads as disabled and offers no seek actions', () => {
	const { result } = renderHook(() => ({ currentTime: useSharedValue(0), duration: useSharedValue(0) }));
	render(
		<Seek currentTime={result.current.currentTime} duration={result.current.duration} loaded={false} onChangeTime={jest.fn()} />
	);
	const seekBar = screen.getByTestId('audio-seek');
	expect(seekBar.props.accessibilityState).toEqual({ disabled: true });
	expect(seekBar.props.accessibilityActions).toBeUndefined();
});
