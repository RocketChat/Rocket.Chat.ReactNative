import { act, render } from '@testing-library/react-native';
import { usePanGesture } from 'react-native-gesture-handler';
import { createGestureController } from 'react-native-gesture-handler/jest-utils';
import { withTiming } from 'react-native-reanimated';

import { ROW_HEIGHT } from '~/containers/NativeListRow/constants';
import SortableList from '../SortableList';

jest.mock('react-native-gesture-handler', () => {
	const actual = jest.requireActual('react-native-gesture-handler');
	return { ...actual, usePanGesture: jest.fn(actual.usePanGesture) };
});

type SettleCallback = (finished?: boolean) => void;

const groups = [
	{ id: 'a', title: 'A' },
	{ id: 'b', title: 'B' },
	{ id: 'c', title: 'C' }
];

const renderList = () => {
	const onReorder = jest.fn();
	render(<SortableList groups={groups} onReorder={onReorder} />);
	const { results } = jest.mocked(usePanGesture).mock;
	const [a, b] = results.slice(-groups.length).map(({ value }) => createGestureController(value));
	return { a, b, onReorder };
};

const deferSettleAnimations = () => {
	const pendingSettles: SettleCallback[] = [];
	jest.mocked(withTiming).mockImplementation(((value: number, _config: unknown, callback?: SettleCallback) => {
		if (callback) {
			pendingSettles.push(callback);
		}
		return value;
	}) as typeof withTiming);
	return () => pendingSettles.splice(0).forEach(settle => settle(true));
};

afterEach(() => {
	jest.clearAllMocks();
	jest.mocked(withTiming).mockImplementation((value => value) as typeof withTiming);
});

it('saves the dropped order even when the settle animation is interrupted', async () => {
	jest.mocked(withTiming).mockImplementation(((value: number, _config: unknown, callback?: SettleCallback) => {
		callback?.(false);
		return value;
	}) as typeof withTiming);
	const { a, onReorder } = renderList();

	await act(async () => {
		a.begin();
		a.activate();
		a.update({ translationY: ROW_HEIGHT });
		a.end();
	});

	expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c']);
});

it('saves only the dropped order when another row is grabbed while the first one settles', async () => {
	const finishSettles = deferSettleAnimations();
	const { a, b, onReorder } = renderList();

	await act(async () => {
		a.begin();
		a.activate();
		a.update({ translationY: ROW_HEIGHT });
		a.end();
		b.begin();
		b.activate();
		b.update({ translationY: ROW_HEIGHT });
		finishSettles();
	});

	expect(onReorder.mock.calls).toEqual([[['b', 'a', 'c']]]);
});

it('ignores a second row dragged while the first one is held', async () => {
	const finishSettles = deferSettleAnimations();
	const { a, b, onReorder } = renderList();

	await act(async () => {
		a.begin();
		a.activate();
		b.begin();
		b.activate();
		b.update({ translationY: 2 * ROW_HEIGHT });
		a.update({ translationY: ROW_HEIGHT });
		a.end();
		b.end();
		finishSettles();
	});

	expect(onReorder.mock.calls).toEqual([[['b', 'a', 'c']]]);
});
