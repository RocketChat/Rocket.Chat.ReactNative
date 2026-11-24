import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
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
	fireEvent(screen.getByTestId('audio-seek'), 'layout', { nativeEvent: { layout: { width: TRACK_WIDTH } } });
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
