import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { usePanGesture } from 'react-native-gesture-handler';
import { createGestureController } from 'react-native-gesture-handler/jest-utils';

import CategoryOrderView from '..';
import { useCategoryOrder } from '../hooks/useCategoryOrder';

jest.mock('@react-navigation/native', () => ({
	...jest.requireActual('@react-navigation/native'),
	useNavigation: () => ({ setOptions: jest.fn() })
}));
jest.mock('~/containers/SafeAreaView', () => ({ __esModule: true, default: ({ children }: { children: unknown }) => children }));
jest.mock('../hooks/useCategoryOrder', () => ({ useCategoryOrder: jest.fn() }));
jest.mock('react-native-gesture-handler', () => {
	const actual = jest.requireActual('react-native-gesture-handler');
	return { ...actual, usePanGesture: jest.fn(actual.usePanGesture) };
});

const groups = [
	{ id: 'a', title: 'A' },
	{ id: 'b', title: 'B' },
	{ id: 'c', title: 'C' }
];

const mockSaveOrder = jest.fn();

const useReorderableGroups = () => {
	const [movableGroups, setMovableGroups] = useState(groups);
	const saveOrder = async (orderedIds: string[]) => {
		mockSaveOrder(orderedIds);
		setMovableGroups(orderedIds.map(id => groups.find(group => group.id === id) ?? groups[0]));
	};
	return { movableGroups, pinnedGroup: undefined, saveOrder };
};

const isScrollEnabled = () => screen.UNSAFE_getByType(ScrollView).props.scrollEnabled !== false;

beforeEach(() => {
	jest.mocked(useCategoryOrder).mockImplementation(useReorderableGroups);
});

afterEach(() => {
	jest.clearAllMocks();
});

it('keeps the moved row mounted so the screen reader keeps its focus', async () => {
	render(<CategoryOrderView />);
	const movedRow = screen.getByTestId('category-order-row-a');

	await act(async () => {
		fireEvent(movedRow, 'accessibilityAction', { nativeEvent: { actionName: 'moveDown' } });
	});

	expect(mockSaveOrder).toHaveBeenCalledWith(['b', 'a', 'c']);
	expect(screen.getByTestId('category-order-row-a')).toBe(movedRow);
});

it('stops the list from scrolling while a row is held', async () => {
	render(<CategoryOrderView />);
	const { results } = jest.mocked(usePanGesture).mock;
	const firstRowDrag = createGestureController(results[results.length - groups.length].value);

	await act(async () => {
		firstRowDrag.begin();
		firstRowDrag.activate();
	});
	expect(isScrollEnabled()).toBe(false);

	await act(async () => {
		firstRowDrag.end();
	});
	expect(isScrollEnabled()).toBe(true);
});

it('lets the list scroll again when the held row is cancelled', async () => {
	render(<CategoryOrderView />);
	const { results } = jest.mocked(usePanGesture).mock;
	const firstRowDrag = createGestureController(results[results.length - groups.length].value);

	await act(async () => {
		firstRowDrag.begin();
		firstRowDrag.activate();
		firstRowDrag.cancel();
	});

	expect(isScrollEnabled()).toBe(true);
});
