import { useMemo } from 'react';

import { useSetting } from './useSetting';
import i18n from '../../i18n';

export interface IPasswordPolicy {
	name: string;
	label: string;
	regex: RegExp;
}

const useVerifyPassword = (password: string, confirmPassword: string) => {
	const Accounts_Password_Policy_AtLeastOneLowercase = useSetting('Accounts_Password_Policy_AtLeastOneLowercase');
	const Accounts_Password_Policy_Enabled = useSetting('Accounts_Password_Policy_Enabled');
	const Accounts_Password_Policy_AtLeastOneNumber = useSetting('Accounts_Password_Policy_AtLeastOneNumber');
	const Accounts_Password_Policy_AtLeastOneSpecialCharacter = useSetting('Accounts_Password_Policy_AtLeastOneSpecialCharacter');
	const Accounts_Password_Policy_AtLeastOneUppercase = useSetting('Accounts_Password_Policy_AtLeastOneUppercase');
	const Accounts_Password_Policy_ForbidRepeatingCharacters = useSetting('Accounts_Password_Policy_ForbidRepeatingCharacters');
	const Accounts_Password_Policy_ForbidRepeatingCharactersCount = useSetting(
		'Accounts_Password_Policy_ForbidRepeatingCharactersCount'
	);
	const Accounts_Password_Policy_MaxLength = useSetting('Accounts_Password_Policy_MaxLength');
	const Accounts_Password_Policy_MinLength = useSetting('Accounts_Password_Policy_MinLength');

	const passwordPolicies: IPasswordPolicy[] | null = useMemo(() => {
		if (!Accounts_Password_Policy_Enabled) return null;

		const policies = [];

		if (Accounts_Password_Policy_AtLeastOneLowercase) {
			policies.push({
				name: 'AtLeastOneLowercase',
				label: i18n.t('At_Least_1_Lowercase_Letter'),
				regex: new RegExp('[a-z]')
			});
		}

		if (Accounts_Password_Policy_AtLeastOneUppercase) {
			policies.push({
				name: 'AtLeastOneUppercase',
				label: i18n.t('At_Least_1_Uppercase_Letter'),
				regex: new RegExp('[A-Z]')
			});
		}

		if (Accounts_Password_Policy_AtLeastOneNumber) {
			policies.push({
				name: 'AtLeastOneNumber',
				label: i18n.t('At_Least_1_Number'),
				regex: new RegExp('[0-9]')
			});
		}

		if (Accounts_Password_Policy_AtLeastOneSpecialCharacter) {
			policies.push({
				name: 'AtLeastOneSpecialCharacter',
				label: i18n.t('At_Least_1_Symbol'),
				regex: new RegExp('[^A-Za-z0-9 ]')
			});
		}

		if (Accounts_Password_Policy_ForbidRepeatingCharacters) {
			policies.push({
				name: 'ForbidRepeatingCharacters',
				label: i18n.t('Max_Repeating_Characters', { quantity: Accounts_Password_Policy_ForbidRepeatingCharactersCount }),
				regex: new RegExp(`(.)\\1{${Accounts_Password_Policy_ForbidRepeatingCharactersCount},}`)
			});
		}

		if (Accounts_Password_Policy_MaxLength && Accounts_Password_Policy_MaxLength !== -1) {
			policies.push({
				name: 'MaxLength',
				label: i18n.t('At_Most_Characters', { quantity: Accounts_Password_Policy_MaxLength }),
				regex: new RegExp(`^.{1,${Accounts_Password_Policy_MaxLength}}$`)
			});
		}

		if (Accounts_Password_Policy_MinLength && Accounts_Password_Policy_MinLength !== -1) {
			policies.push({
				name: 'MinLength',
				label: i18n.t('At_Least_Characters', { quantity: Accounts_Password_Policy_MinLength }),
				regex: new RegExp(`.{${Accounts_Password_Policy_MinLength},}`)
			});
		}

		return policies;
	}, [
		Accounts_Password_Policy_AtLeastOneLowercase,
		Accounts_Password_Policy_Enabled,
		Accounts_Password_Policy_AtLeastOneNumber,
		Accounts_Password_Policy_AtLeastOneSpecialCharacter,
		Accounts_Password_Policy_AtLeastOneUppercase,
		Accounts_Password_Policy_ForbidRepeatingCharacters,
		Accounts_Password_Policy_ForbidRepeatingCharactersCount,
		Accounts_Password_Policy_MaxLength,
		Accounts_Password_Policy_MinLength
	]);

	const isPasswordValid = () => {
		if (password !== confirmPassword) return false;

		if (!passwordPolicies) return true;

		return passwordPolicies.every(policy => {
			if (policy.name === 'ForbidRepeatingCharacters') {
				return !policy.regex.test(password);
			}
			return policy.regex.test(password);
		});
	};

	return {
		passwordPolicies,
		isPasswordValid
	};
};

export default useVerifyPassword;
