import { renderHook } from '@testing-library/react-native';

import { useEmptyRoomHeader } from '../useEmptyRoomHeader';

const mockHelpers = { hasNativeHeaderBar: false };
jest.mock('~/lib/methods/helpers', () => ({
	get hasNativeHeaderBar() {
		return mockHelpers.hasNativeHeaderBar;
	}
}));

const mockSetOptions = jest.fn();
jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ setOptions: mockSetOptions })
}));

describe('useEmptyRoomHeader', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('sets only the headerLeft spacer on the JS header', () => {
		mockHelpers.hasNativeHeaderBar = false;
		renderHook(() => useEmptyRoomHeader());

		expect(mockSetOptions).toHaveBeenCalledTimes(1);
		const options = mockSetOptions.mock.calls[0][0];
		expect(typeof options.headerLeft).toBe('function');
		expect(options).not.toHaveProperty('headerTitle');
		expect(options).not.toHaveProperty('headerRight');
	});

	it('leaves the native header bar untouched', () => {
		mockHelpers.hasNativeHeaderBar = true;
		renderHook(() => useEmptyRoomHeader());

		expect(mockSetOptions).not.toHaveBeenCalled();
	});
});
