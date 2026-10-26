import { act, render, renderHook } from '@testing-library/react-native';
import { State, usePanGesture } from 'react-native-gesture-handler';
import { fireGestureHandler } from 'react-native-gesture-handler/jest-utils';
import { useSharedValue } from 'react-native-reanimated';

import Seek from './Seek';

jest.mock('~/theme', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-native-gesture-handler', () => {
	const actual = jest.requireActual('react-native-gesture-handler');
	return { ...actual, usePanGesture: jest.fn(actual.usePanGesture) };
});

const setup = () => {
	const { result } = renderHook(() => ({ currentTime: useSharedValue(30), duration: useSharedValue(120) }));
	const { currentTime, duration } = result.current;
	const onChangeTime = jest.fn();
	render(<Seek currentTime={currentTime} duration={duration} loaded onChangeTime={onChangeTime} />);
	const { results } = jest.mocked(usePanGesture).mock;
	return { gesture: results[results.length - 1].value, currentTime, onChangeTime };
};

afterEach(() => jest.clearAllMocks());

test('a tap that never starts dragging preserves the paused position', async () => {
	const { gesture, currentTime, onChangeTime } = setup();
	await act(() => fireGestureHandler(gesture, [{ state: State.BEGAN }, { state: State.FAILED }]));
	expect(currentTime.value).toBe(30);
	expect(onChangeTime).not.toHaveBeenCalled();
});

test('a cancelled drag restores its starting position without seeking', async () => {
	const { gesture, currentTime, onChangeTime } = setup();
	await act(() => fireGestureHandler(gesture, [{ state: State.BEGAN }, { state: State.ACTIVE }, { state: State.CANCELLED }]));
	expect(currentTime.value).toBe(30);
	expect(onChangeTime).not.toHaveBeenCalled();

	currentTime.value = 45;
	await act(() => fireGestureHandler(gesture, [{ state: State.BEGAN }, { state: State.FAILED }]));
	expect(currentTime.value).toBe(45);
});

test('a completed drag seeks in seconds', async () => {
	const { gesture, onChangeTime } = setup();
	await act(() => fireGestureHandler(gesture, [{ state: State.BEGAN }, { state: State.ACTIVE }, { state: State.END }]));
	expect(onChangeTime).toHaveBeenCalledTimes(1);
	expect(onChangeTime).toHaveBeenCalledWith(30);
});
