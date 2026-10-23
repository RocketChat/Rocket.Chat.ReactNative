import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import CategoryOrderView from '..';
import { useCategoryOrder } from '../hooks/useCategoryOrder';

jest.mock('@react-navigation/native', () => ({
	...jest.requireActual('@react-navigation/native'),
	useNavigation: () => ({ setOptions: jest.fn() })
}));
jest.mock('~/containers/SafeAreaView', () => ({ __esModule: true, default: ({ children }: { children: unknown }) => children }));
jest.mock('../hooks/useCategoryOrder', () => ({ useCategoryOrder: jest.fn() }));

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

beforeEach(() => {
	jest.mocked(useCategoryOrder).mockImplementation(useReorderableGroups);
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
