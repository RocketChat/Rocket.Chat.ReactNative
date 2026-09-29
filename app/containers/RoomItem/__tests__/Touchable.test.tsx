import { act, fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { State, usePanGesture } from 'react-native-gesture-handler';
import { fireGestureHandler } from 'react-native-gesture-handler/jest-utils';
import { makeMutable } from 'react-native-reanimated';

import Touchable from '../Touchable';
import { settleSwipeRow, unregisterOpenSwipeItem } from '../openSwipeItem';
import { SubscriptionType } from '~/definitions';

jest.mock('~/lib/hooks/useAppSelector', () => ({ useAppSelector: () => '7.0.0' }));
jest.mock('react-native-gesture-handler', () => {
	const actual = jest.requireActual('react-native-gesture-handler');
	return { ...actual, usePanGesture: jest.fn(actual.usePanGesture) };
});

const setup = ({ swipeEnabled = true } = {}) => {
	const onPress = jest.fn();
	const { getByText } = render(
		<Touchable
			type={SubscriptionType.CHANNEL}
			onPress={onPress}
			width={300}
			favorite={false}
			isRead
			rid='roomB'
			isFocused={false}
			swipeEnabled={swipeEnabled}
			displayMode='expanded'>
			<Text>row</Text>
		</Touchable>
	);
	const { results } = jest.mocked(usePanGesture).mock;
	return { gesture: results[results.length - 1].value, onPress, pressRow: () => fireEvent.press(getByText('row')) };
};

const openOtherRow = () => settleSwipeRow({ rid: 'roomA', transX: makeMutable(0), rowOffSet: makeMutable(0) }, 80);

const touchWithoutSwipe = [
	{ state: State.BEGAN, translationX: 0, velocityX: 0 },
	{ state: State.FAILED, translationX: 0, velocityX: 0 }
];

afterEach(() => {
	unregisterOpenSwipeItem('roomA');
	jest.restoreAllMocks();
});

test('a tap after a touch that closed another row without pressing still opens the room', async () => {
	const { gesture, onPress, pressRow } = setup();
	openOtherRow();
	await act(() => fireGestureHandler(gesture, touchWithoutSwipe));

	await act(() => fireGestureHandler(gesture, touchWithoutSwipe));
	pressRow();

	expect(onPress).toHaveBeenCalledTimes(1);
});

test('a tap that closed another row does not open the room', async () => {
	const { gesture, onPress, pressRow } = setup();
	openOtherRow();

	await act(() => fireGestureHandler(gesture, touchWithoutSwipe));
	pressRow();

	expect(onPress).not.toHaveBeenCalled();
});

test('a tap on a swiped-open row closes it instead of opening the room', async () => {
	const { gesture, onPress, pressRow } = setup();
	await act(() =>
		fireGestureHandler(gesture, [
			{ state: State.BEGAN, translationX: 0, velocityX: 0 },
			{ state: State.ACTIVE, translationX: 60, velocityX: 0 },
			{ state: State.END, translationX: 60, velocityX: 0 }
		])
	);

	pressRow();
	expect(onPress).not.toHaveBeenCalled();

	pressRow();
	expect(onPress).toHaveBeenCalledTimes(1);
});

test('a tap on a row that cannot swipe closes the open row instead of opening the room', () => {
	const { onPress, pressRow } = setup({ swipeEnabled: false });
	openOtherRow();

	pressRow();
	expect(onPress).not.toHaveBeenCalled();

	pressRow();
	expect(onPress).toHaveBeenCalledTimes(1);
});
