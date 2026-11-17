import { renderHook } from '@testing-library/react-native';

import { useNativeBackButton } from '../useNativeBackButton';

const mockSetOptions = jest.fn();
const mockGoBack = jest.fn();
let mockCanGoBack = true;
let mockUnreads: number | null = null;
const mockUseUnreadsCount = jest.fn((_rid?: string) => mockUnreads);

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ setOptions: mockSetOptions, goBack: mockGoBack, canGoBack: () => mockCanGoBack })
}));
jest.mock('../useUnreadsCount', () => ({ useUnreadsCount: (rid?: string) => mockUseUnreadsCount(rid) }));

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

it('clears custom left items when it cannot go back', () => {
	mockCanGoBack = false;
	renderHook(() => useNativeBackButton('rid'));
	expect(mockSetOptions).toHaveBeenCalledWith({ unstable_headerLeftItems: undefined });
});
