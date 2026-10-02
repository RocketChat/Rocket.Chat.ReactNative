import { fireEvent, render, screen } from '@testing-library/react-native';
import { type NativeStackHeaderItemButton, type NativeStackHeaderItemMenu } from '@react-navigation/native-stack';

import { showActionSheetRef, type TActionSheetOptionsItem } from '~/containers/ActionSheet';
import { HeaderActions, type IHeaderAction, nativeHeaderItems } from '../headerActions';

jest.mock('../headerIcon', () => ({ headerIcon: (name: string) => ({ type: 'image', source: name }) }));
jest.mock('~/containers/ActionSheet', () => ({ showActionSheetRef: jest.fn() }));

const filterAction: IHeaderAction = {
	label: 'Filter',
	icon: 'filter',
	testID: 'filter',
	menu: [
		{ label: 'All', checked: true, onPress: jest.fn() },
		{ label: 'Close', destructive: true, onPress: jest.fn() }
	]
};
const searchAction: IHeaderAction = {
	label: 'Search',
	icon: 'search',
	testID: 'search',
	legacyHeaderOnly: true,
	onPress: jest.fn()
};

const openedSheetOptions = () => (showActionSheetRef as jest.Mock).mock.calls[0][0].options as TActionSheetOptionsItem[];

describe('nativeHeaderItems', () => {
	it('leaves out actions that only exist on the legacy header', () => {
		const items = nativeHeaderItems([filterAction, searchAction]) as NativeStackHeaderItemMenu[];

		expect(items.map(item => item.label)).toEqual(['Filter']);
	});

	it('turns a menu into native menu actions with radio state only on checkable items', () => {
		const [menu] = nativeHeaderItems([filterAction]) as NativeStackHeaderItemMenu[];

		expect(menu.type).toBe('menu');
		expect(menu.icon).toEqual({ type: 'image', source: 'filter' });
		expect(menu.menu.items).toEqual([
			expect.objectContaining({ type: 'action', label: 'All', state: 'on' }),
			expect.objectContaining({ type: 'action', label: 'Close', state: undefined, destructive: true })
		]);
	});

	it('renders a badge without a value as a dot in the given color', () => {
		const [button] = nativeHeaderItems([{ label: 'Menu', icon: 'hamburguer', badge: { color: 'red' }, onPress: jest.fn() }]);

		expect((button as NativeStackHeaderItemButton).badge).toEqual({ value: '', style: { backgroundColor: 'red' } });
	});
});

describe('HeaderActions', () => {
	beforeEach(() => jest.clearAllMocks());

	it('renders nothing without actions', () => {
		render(<HeaderActions actions={[]} />);

		expect(screen.toJSON()).toBeNull();
	});

	it('shows legacy-only actions and uses the label as text when there is no icon', () => {
		render(<HeaderActions actions={[searchAction, { label: 'Next', testID: 'next', onPress: jest.fn() }]} />);

		expect(screen.getByTestId('search')).toBeOnTheScreen();
		expect(screen.getByText('Next')).toBeOnTheScreen();
	});

	it('opens the menu in an action sheet, marking checkable items with a radio', () => {
		render(<HeaderActions actions={[filterAction]} />);

		fireEvent.press(screen.getByTestId('filter'));

		const [all, close] = openedSheetOptions();
		expect(all.title).toBe('All');
		expect(all.right).toBeDefined();
		expect(close.right).toBeUndefined();
		expect(close.danger).toBe(true);
	});

	it('caps a numeric badge at +99', () => {
		render(
			<HeaderActions
				actions={[{ label: 'Threads', icon: 'threads', badge: { value: 150, color: 'blue' }, onPress: jest.fn() }]}
			/>
		);

		expect(screen.getByText('+99')).toBeOnTheScreen();
	});
});
