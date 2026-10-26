import { fireEvent, render, screen } from '@testing-library/react-native';
import { type NativeStackHeaderItemButton, type NativeStackHeaderItemMenu } from '@react-navigation/native-stack';

import { showActionSheetRef, type TActionSheetOptionsItem } from '~/containers/ActionSheet';
import { HeaderActions, headerLeftActions, headerRightActions, type IHeaderAction, nativeHeaderItems } from '../headerActions';

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
	onPress: jest.fn()
};

const openedSheetOptions = () => (showActionSheetRef as jest.Mock).mock.calls[0][0].options as TActionSheetOptionsItem[];

describe('nativeHeaderItems', () => {
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

	it('caps a numeric native badge at +99', () => {
		const [button] = nativeHeaderItems([
			{ label: 'Threads', icon: 'threads', badge: { value: 150, color: 'blue' }, onPress: jest.fn() }
		]);

		expect((button as NativeStackHeaderItemButton).badge).toEqual({ value: '+99', style: { backgroundColor: 'blue' } });
	});

	it('tints items with the header tint unless the action sets its own', () => {
		const [plain, tinted] = nativeHeaderItems(
			[
				{ label: 'Menu', icon: 'hamburguer', onPress: jest.fn() },
				{ label: 'Create', icon: 'add', tintColor: 'blue', onPress: jest.fn() }
			],
			'gray'
		) as NativeStackHeaderItemButton[];

		expect(plain.tintColor).toBe('gray');
		expect(tinted.tintColor).toBe('blue');
	});
});

describe('HeaderActions', () => {
	beforeEach(() => jest.clearAllMocks());

	it('renders nothing without actions', () => {
		render(<HeaderActions actions={[]} />);

		expect(screen.toJSON()).toBeNull();
	});

	it('shows icon actions and uses the label as text when there is no icon', () => {
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

	it('runs the picked item only after the menu sheet closes', () => {
		render(<HeaderActions actions={[filterAction]} />);
		fireEvent.press(screen.getByTestId('filter'));
		const { options, onClose } = (showActionSheetRef as jest.Mock).mock.calls[0][0];

		options[1].onPress();
		expect(filterAction.menu?.[1].onPress).not.toHaveBeenCalled();

		onClose();
		expect(filterAction.menu?.[1].onPress).toHaveBeenCalledTimes(1);
		expect(filterAction.menu?.[0].onPress).not.toHaveBeenCalled();
	});

	it('runs nothing when the menu sheet closes without a pick', () => {
		render(<HeaderActions actions={[filterAction]} />);
		fireEvent.press(screen.getByTestId('filter'));

		(showActionSheetRef as jest.Mock).mock.calls[0][0].onClose();

		filterAction.menu?.forEach(({ onPress }) => expect(onPress).not.toHaveBeenCalled());
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

describe('JS header action options', () => {
	it('leaves the header slots unset without actions so the default back button shows', () => {
		expect(headerLeftActions([]).headerLeft).toBeUndefined();
		expect(headerRightActions([]).headerRight).toBeUndefined();
	});

	it('renders the actions in the header slots', () => {
		render(<>{headerLeftActions([searchAction]).headerLeft?.({ canGoBack: false })}</>);

		expect(screen.getByTestId('search')).toBeOnTheScreen();
	});
});
