import { type ReactElement } from 'react';
import { Platform, Text } from 'react-native';

import { headerItems } from './headerItems';

jest.mock('~/containers/Header/components/HeaderButton', () => ({
	Container: 'HeaderButtonContainer',
	Item: 'HeaderButtonItem'
}));

const originalOS = Platform.OS;
const originalVersion = Object.getOwnPropertyDescriptor(Platform, 'Version');

afterEach(() => {
	Platform.OS = originalOS;
	if (originalVersion) {
		Object.defineProperty(Platform, 'Version', originalVersion);
	}
});

it('preserves omitted sides and clears previously configured items explicitly', () => {
	Platform.OS = 'ios';
	expect(headerItems({})).toEqual({});
	const hidden = headerItems({ left: [], right: [] });
	expect(hidden.headerBackVisible).toBe(false);
	expect(hidden.unstable_headerLeftItems?.({})).toEqual([]);
	expect(hidden.unstable_headerRightItems?.({})).toEqual([]);
	expect(hidden.headerLeft?.({ canGoBack: true })).toBeNull();
	expect(headerItems({ left: undefined, right: undefined })).toEqual({
		headerLeft: undefined,
		headerRight: undefined,
		headerBackVisible: true,
		unstable_headerLeftItems: undefined,
		unstable_headerRightItems: undefined
	});
});

it('maps iOS icons and retains live action state without Android-only fields', () => {
	Platform.OS = 'ios';
	Object.defineProperty(Platform, 'Version', { configurable: true, value: '26.0' });
	const onPress = jest.fn();
	const options = headerItems({
		right: [
			{
				type: 'button',
				label: 'Search',
				iconName: 'search',
				testID: 'search-button',
				androidBadge: () => <Text>!</Text>,
				badge: { value: 2 },
				disabled: true,
				onPress
			}
		]
	});
	const item = options.unstable_headerRightItems?.({})[0];
	expect(item).toEqual({
		type: 'button',
		label: 'Search',
		accessibilityLabel: 'Search',
		icon: { type: 'sfSymbol', name: 'magnifyingglass' },
		badge: { value: 2 },
		disabled: true,
		onPress
	});
});

it('keeps Android test selectors, callbacks, disabled state and badge rendering', () => {
	Platform.OS = 'android';
	const onPress = jest.fn();
	const androidBadge = () => <Text>!</Text>;
	const options = headerItems({
		right: [
			{ type: 'button', label: 'Search', iconName: 'search', testID: 'search-button', disabled: true, onPress, androidBadge }
		]
	});
	expect(options.unstable_headerRightItems).toBeUndefined();
	const container = options.headerRight?.({ canGoBack: false }) as ReactElement<{ children: ReactElement[] }>;
	expect(container.props.children[0].props).toMatchObject({
		iconName: 'search',
		testID: 'search-button',
		disabled: true,
		onPress,
		badge: androidBadge,
		accessibilityLabel: 'Search'
	});
});

it('preserves custom elements and uses the explicit Android fallback for native menus', () => {
	const element = <Text>Avatar</Text>;
	const androidElement = <Text>More</Text>;
	Platform.OS = 'ios';
	const options = headerItems({
		left: [{ type: 'custom', element }],
		right: [{ type: 'menu', label: 'More', menu: { items: [] }, androidElement }]
	});
	expect(options.unstable_headerLeftItems?.({})).toEqual([{ type: 'custom', element }]);
	expect(options.unstable_headerRightItems?.({})).toEqual([{ type: 'menu', label: 'More', menu: { items: [] } }]);
	const container = options.headerRight?.({ canGoBack: false }) as ReactElement<{
		children: ReactElement<{ children: ReactElement }>[];
	}>;
	expect(container.props.children[0].props.children).toBe(androidElement);
});

it('preserves button badges on iOS versions before native badges are supported', () => {
	Platform.OS = 'ios';
	Object.defineProperty(Platform, 'Version', { configurable: true, value: '18.5' });
	const onPress = jest.fn();
	const androidBadge = () => <Text>!</Text>;
	const options = headerItems({
		right: [{ type: 'button', label: 'Filter', iconName: 'filter', badge: { value: '' }, androidBadge, disabled: true, onPress }]
	});
	const item = options.unstable_headerRightItems?.({})[0];
	expect(item?.type).toBe('custom');
	if (item?.type !== 'custom') {
		throw new Error('Expected a custom item for the badge');
	}
	expect(item.element.props).toMatchObject({
		iconName: 'filter',
		badge: androidBadge,
		disabled: true,
		onPress,
		accessibilityLabel: 'Filter'
	});
});
