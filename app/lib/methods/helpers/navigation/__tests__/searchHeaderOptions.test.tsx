import { render, screen } from '@testing-library/react-native';
import { createRef, type ReactElement } from 'react';
import { type SearchBarCommands } from 'react-native-screens';

import { searchHeaderOptions } from '../searchHeaderOptions';

let mockHasNativeHeaderBar = false;
jest.mock('~/lib/methods/helpers/deviceInfo', () =>
	Object.defineProperties(
		{ ...jest.requireActual('~/lib/methods/helpers/deviceInfo') },
		{ hasNativeHeaderBar: { get: () => mockHasNativeHeaderBar, configurable: true } }
	)
);
jest.mock('../headerIcon', () => ({ headerIcon: (name: string) => ({ type: 'image', source: name }) }));

const onSearchPress = jest.fn();
const onChangeText = jest.fn();
const onCancel = jest.fn();
const filterAction = { label: 'Filter', icon: 'filter' as const, onPress: jest.fn() };

const buildOptions = (isSearching: boolean) =>
	searchHeaderOptions({
		isSearching,
		searchBarRef: createRef<SearchBarCommands>(),
		onSearchPress,
		onChangeText,
		onCancel,
		testIDPrefix: 'threads-view',
		options: { headerTitle: 'Threads' },
		rightActions: [filterAction]
	});

describe('searchHeaderOptions', () => {
	beforeEach(() => jest.clearAllMocks());

	it('adds a system search bar and keeps only the screen actions with the native bar', () => {
		mockHasNativeHeaderBar = true;

		const options = buildOptions(false);

		expect(options.headerTitle).toBe('Threads');
		options.headerSearchBarOptions?.onFocus?.({} as never);
		expect(onSearchPress).toHaveBeenCalledTimes(1);
		const labels = (options.unstable_headerRightItems?.({} as never) ?? []).map(item => 'label' in item && item.label);
		expect(labels).toEqual(['Filter']);
	});

	it('clears the system search bar after cancelling', () => {
		mockHasNativeHeaderBar = true;
		const clearText = jest.fn();
		const searchBarRef = { current: { clearText } as unknown as SearchBarCommands };

		const options = searchHeaderOptions({
			isSearching: true,
			searchBarRef,
			onSearchPress,
			onChangeText,
			onCancel,
			options: { headerTitle: 'Threads' }
		});
		options.headerSearchBarOptions?.onCancelButtonPress?.({} as never);

		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(clearText).toHaveBeenCalledTimes(1);
	});

	it('adds a search action to the JS header', () => {
		mockHasNativeHeaderBar = false;

		const options = buildOptions(false);

		expect(options.headerTitle).toBe('Threads');
		expect(options.headerSearchBarOptions).toBeUndefined();
		render(options.headerRight?.({} as never) as ReactElement);
		expect(screen.getByTestId('threads-view-search')).toBeOnTheScreen();
	});

	it('replaces the JS header with the search input while searching', () => {
		mockHasNativeHeaderBar = false;

		const options = buildOptions(true);

		expect(options.headerTitle).toEqual(expect.any(Function));
		expect(options.headerRight?.({} as never)).toBeNull();
	});
});
