import { renderHook } from '@testing-library/react-native';

import { useNativeBackButton } from '../useNativeBackButton';

const mockSetOptions = jest.fn();
const mockGoBack = jest.fn();
let mockCanGoBack = true;
let mockUnreads: number | null = null;
const mockUseUnreadsCount = jest.fn((_rid?: string) => mockUnreads);
let mockFontScale = 1;

// Stable across renders, so effects only re-run when their real dependencies change
const mockNavigation = { setOptions: mockSetOptions, goBack: mockGoBack, canGoBack: () => mockCanGoBack };

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => mockNavigation
}));
jest.mock('../useUnreadsCount', () => ({ useUnreadsCount: (rid?: string) => mockUseUnreadsCount(rid) }));
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockFontScale })
}));

const renderBackItem = (unreads: number | null) => {
	mockUnreads = unreads;
	renderHook(() => useNativeBackButton('rid'));
	const options = mockSetOptions.mock.lastCall[0];
	expect(options.headerBackVisible).toBe(false);
	const [backItem] = options.unstable_headerLeftItems({ tintColor: 'header-tint' });
	return backItem;
};

beforeEach(() => {
	jest.clearAllMocks();
	mockUnreads = null;
	mockCanGoBack = true;
	mockFontScale = 1;
});

it('replaces the back button with a chevron labelled with the unread count', () => {
	const backItem = renderBackItem(7);
	expect(mockUseUnreadsCount).toHaveBeenCalledWith('rid');
	expect(backItem).toMatchObject({
		label: '7',
		icon: { type: 'sfSymbol', name: 'chevron.backward' },
		showsLabelWithIcon: true,
		tintColor: 'header-tint'
	});
});

it('caps the count at +99', () => {
	expect(renderBackItem(150).label).toBe('+99');
});

it('shows only the chevron without unreads', () => {
	expect(renderBackItem(0).label).toBe('');
});

it('goes back when pressed', () => {
	renderBackItem(3).onPress();
	expect(mockGoBack).toHaveBeenCalledTimes(1);
});

it('recreates the back button when the font scale changes', () => {
	const { rerender } = renderHook(() => useNativeBackButton('rid'));
	const [before] = mockSetOptions.mock.lastCall[0].unstable_headerLeftItems({ tintColor: 'header-tint' });

	rerender({});
	expect(mockSetOptions).toHaveBeenCalledTimes(1);

	mockFontScale = 2;
	rerender({});
	const [after] = mockSetOptions.mock.lastCall[0].unstable_headerLeftItems({ tintColor: 'header-tint' });

	expect(mockSetOptions).toHaveBeenCalledTimes(2);
	expect(after.identifier).not.toBe(before.identifier);
});

it('clears custom left items when it cannot go back', () => {
	mockCanGoBack = false;
	renderHook(() => useNativeBackButton('rid'));
	expect(mockSetOptions).toHaveBeenCalledWith({ unstable_headerLeftItems: undefined });
});
