import { renderHook } from '@testing-library/react-hooks';

import useVerifyPassword from './useVerifyPassword';
import { useSetting } from './useSetting';

jest.mock('./useSetting');

type TPolicySettings =
	| 'Accounts_Password_Policy_MinLength'
	| 'Accounts_Password_Policy_MaxLength'
	| 'Accounts_Password_Policy_ForbidRepeatingCharactersCount'
	| 'Accounts_Password_Policy_ForbidRepeatingCharacters'
	| 'Accounts_Password_Policy_AtLeastOneUppercase'
	| 'Accounts_Password_Policy_AtLeastOneSpecialCharacter'
	| 'Accounts_Password_Policy_AtLeastOneLowercase'
	| 'Accounts_Password_Policy_Enabled'
	| 'Accounts_Password_Policy_AtLeastOneNumber';

const mockUseSetting = useSetting as jest.Mock;

describe('useVerifyPassword', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('disabled password policy', () => {
		it('should return null passwordPolicies when policy is disabled', () => {
			mockUseSetting.mockImplementation(key => {
				if (key === 'Accounts_Password_Policy_Enabled') return false;
				return null;
			});

			const { result } = renderHook(() => useVerifyPassword('password123', 'password123'));

			expect(result.current.passwordPolicies).toBeNull();
			expect(result.current.isPasswordValid()).toBe(true);
		});

		it('should return null passwordPolicies when policy is undefined', () => {
			mockUseSetting.mockImplementation(key => {
				if (key === 'Accounts_Password_Policy_Enabled') return false;
				return null;
			});

			const { result } = renderHook(() => useVerifyPassword('password123', 'password123'));

			expect(result.current.passwordPolicies).toBeNull();
			expect(result.current.isPasswordValid()).toBe(true);
		});

		it('should validate password based on policies', () => {
			mockUseSetting.mockImplementation((key: TPolicySettings) => {
				const settings: Partial<Record<TPolicySettings, boolean | number>> = {
					Accounts_Password_Policy_Enabled: true,
					Accounts_Password_Policy_AtLeastOneLowercase: true,
					Accounts_Password_Policy_AtLeastOneUppercase: true,
					Accounts_Password_Policy_AtLeastOneNumber: true,
					Accounts_Password_Policy_AtLeastOneSpecialCharacter: true,
					Accounts_Password_Policy_MinLength: 8,
					Accounts_Password_Policy_MaxLength: 16
				};
				return settings[key] ?? null;
			});

			const { result } = renderHook(() => useVerifyPassword('Passw0rd!', 'Passw0rd!'));

			expect(result.current.passwordPolicies).not.toBeNull();
			expect(result.current.isPasswordValid()).toBe(true);
		});

		it('should return false if passwords do not match', () => {
			const { result } = renderHook(() => useVerifyPassword('password123', 'differentPass'));
			expect(result.current.isPasswordValid()).toBe(false);
		});
	});

	describe('validate password policies', () => {
		it('should return false if password does not meet the Accounts_Password_Policy_AtLeastOneLowercase policy', () => {
			mockUseSetting.mockImplementation((key: TPolicySettings) => {
				const settings: Partial<Record<TPolicySettings, boolean | number>> = {
					Accounts_Password_Policy_Enabled: true,
					Accounts_Password_Policy_AtLeastOneLowercase: true
				};
				return settings[key] ?? null;
			});

			const { result } = renderHook(() => useVerifyPassword('UPPERCASEONLY', 'UPPERCASEONLY'));
			expect(result.current.isPasswordValid()).toBe(false);
		});

		it('should return false if password does not meet the Accounts_Password_Policy_AtLeastOneUppercase policy', () => {
			mockUseSetting.mockImplementation((key: TPolicySettings) => {
				const settings: Partial<Record<TPolicySettings, boolean | number>> = {
					Accounts_Password_Policy_Enabled: true,
					Accounts_Password_Policy_AtLeastOneUppercase: true
				};
				return settings[key] ?? null;
			});

			const { result } = renderHook(() => useVerifyPassword('lowercaseonly', 'lowercaseonly'));
			expect(result.current.isPasswordValid()).toBe(false);
		});

		it('should return false if password does not meet the Accounts_Password_Policy_AtLeastOneSpecialCharacter policy', () => {
			mockUseSetting.mockImplementation((key: TPolicySettings) => {
				const settings: Partial<Record<TPolicySettings, boolean | number>> = {
					Accounts_Password_Policy_Enabled: true,
					Accounts_Password_Policy_AtLeastOneSpecialCharacter: true
				};
				return settings[key] ?? null;
			});

			const { result } = renderHook(() => useVerifyPassword('NoSpecialCharacter', 'NoSpecialCharacter'));
			expect(result.current.isPasswordValid()).toBe(false);
		});

		it('should return false if password does not meet the Accounts_Password_Policy_AtLeastOneNumber policy', () => {
			mockUseSetting.mockImplementation((key: TPolicySettings) => {
				const settings: Partial<Record<TPolicySettings, boolean | number>> = {
					Accounts_Password_Policy_Enabled: true,
					Accounts_Password_Policy_AtLeastOneNumber: true
				};
				return settings[key] ?? null;
			});

			const { result } = renderHook(() => useVerifyPassword('NoNumber!', 'NoNumber!'));
			expect(result.current.isPasswordValid()).toBe(false);
		});

		it('should return false if password does not meet the Accounts_Password_Policy_ForbidRepeatingCharacters policy', () => {
			mockUseSetting.mockImplementation((key: TPolicySettings) => {
				const settings: Partial<Record<TPolicySettings, boolean | number>> = {
					Accounts_Password_Policy_Enabled: true,
					Accounts_Password_Policy_ForbidRepeatingCharacters: true,
					Accounts_Password_Policy_ForbidRepeatingCharactersCount: 3
				};
				return settings[key] ?? null;
			});

			const { result } = renderHook(() => useVerifyPassword('rrrrepeating', 'rrrrepeating'));
			expect(result.current.isPasswordValid()).toBe(false);
		});

		it('should return false if password does not meet the Accounts_Password_Policy_MinLength policy', () => {
			mockUseSetting.mockImplementation((key: TPolicySettings) => {
				const settings: Partial<Record<TPolicySettings, boolean | number>> = {
					Accounts_Password_Policy_Enabled: true,
					Accounts_Password_Policy_MinLength: 3
				};
				return settings[key] ?? null;
			});

			const { result } = renderHook(() => useVerifyPassword('12', '12'));
			expect(result.current.isPasswordValid()).toBe(false);
		});

		it('should return false if password does not meet the Accounts_Password_Policy_MaxLength policy', () => {
			mockUseSetting.mockImplementation((key: TPolicySettings) => {
				const settings: Partial<Record<TPolicySettings, boolean | number>> = {
					Accounts_Password_Policy_Enabled: true,
					Accounts_Password_Policy_MaxLength: 4
				};
				return settings[key] ?? null;
			});

			const { result } = renderHook(() => useVerifyPassword('12345', '12345'));
			expect(result.current.isPasswordValid()).toBe(false);
		});
	});
});
