import { act, render, renderHook } from '@testing-library/react-native';
import { Gesture, State } from 'react-native-gesture-handler';
import { fireGestureHandler } from 'react-native-gesture-handler/jest-utils';
import { useSharedValue } from 'react-native-reanimated';

import Seek from './Seek';

jest.mock('~/theme', () => ({ useTheme: () => ({ colors: {} }) }));

const setup = () => {
	const pan = jest.spyOn(Gesture, 'Pan');
	const { result } = renderHook(() => ({ currentTime: useSharedValue(30), duration: useSharedValue(120) }));
	const { currentTime, duration } = result.current;
	const onChangeTime = jest.fn();
	render(<Seek currentTime={currentTime} duration={duration} loaded onChangeTime={onChangeTime} />);
	return { gesture: pan.mock.results[0].value, currentTime, onChangeTime };
};

afterEach(() => jest.restoreAllMocks());

test('a tap that never starts dragging preserves the paused position', () => {
	const { gesture, currentTime, onChangeTime } = setup();
	act(() => fireGestureHandler(gesture, [{ state: State.BEGAN }, { state: State.FAILED }]));
	expect(currentTime.value).toBe(30);
	expect(onChangeTime).not.toHaveBeenCalled();
});

test('a cancelled drag restores its starting position without seeking', () => {
	const { gesture, currentTime, onChangeTime } = setup();
	act(() => fireGestureHandler(gesture, [{ state: State.BEGAN }, { state: State.ACTIVE }, { state: State.CANCELLED }]));
	expect(currentTime.value).toBe(30);
	expect(onChangeTime).not.toHaveBeenCalled();

	currentTime.value = 45;
	act(() => fireGestureHandler(gesture, [{ state: State.BEGAN }, { state: State.FAILED }]));
	expect(currentTime.value).toBe(45);
});

test('a completed drag seeks in seconds', () => {
	const { gesture, onChangeTime } = setup();
	act(() => fireGestureHandler(gesture, [{ state: State.BEGAN }, { state: State.ACTIVE }, { state: State.END }]));
	expect(onChangeTime).toHaveBeenCalledTimes(1);
	expect(onChangeTime).toHaveBeenCalledWith(30);
});
