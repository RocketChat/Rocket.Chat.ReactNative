import { renderHook } from '@testing-library/react-native';

import { useMediaCallPermission } from './useMediaCallPermission';

const mockUseAppSelector = jest.fn();
const mockUsePermissions = jest.fn();

jest.mock('../useAppSelector', () => ({
	useAppSelector: (selector: (state: any) => any) => mockUseAppSelector(selector)
}));

jest.mock('../usePermissions', () => ({
	usePermissions: (permissions: string[]) => mockUsePermissions(permissions)
}));

describe('useMediaCallPermission', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return false when teams-voip is not in enterpriseModules', () => {
		mockUseAppSelector.mockReturnValue([]);
		mockUsePermissions.mockReturnValue([true, true]);

		const { result } = renderHook(() => useMediaCallPermission());

		expect(result.current).toBe(false);
		expect(mockUsePermissions).toHaveBeenCalledWith(['allow-internal-voice-calls', 'allow-external-voice-calls']);
	});

	it('should return false when voip module exists but no voice call permissions', () => {
		mockUseAppSelector.mockReturnValue(['teams-voip']);
		mockUsePermissions.mockReturnValue([false, false]);

		const { result } = renderHook(() => useMediaCallPermission());

		expect(result.current).toBe(false);
	});

	it('should return true when voip module exists and internal voice call allowed', () => {
		mockUseAppSelector.mockReturnValue(['teams-voip']);
		mockUsePermissions.mockReturnValue([true, false]);

		const { result } = renderHook(() => useMediaCallPermission());

		expect(result.current).toBe(true);
	});

	it('should return true when voip module exists and external voice call allowed', () => {
		mockUseAppSelector.mockReturnValue(['teams-voip']);
		mockUsePermissions.mockReturnValue([false, true]);

		const { result } = renderHook(() => useMediaCallPermission());

		expect(result.current).toBe(true);
	});

	it('should return true when voip module exists and both permissions allowed', () => {
		mockUseAppSelector.mockReturnValue(['teams-voip']);
		mockUsePermissions.mockReturnValue([true, true]);

		const { result } = renderHook(() => useMediaCallPermission());

		expect(result.current).toBe(true);
	});
});
