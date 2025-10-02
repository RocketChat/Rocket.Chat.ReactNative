import { IPasswordPolicy } from '../../lib/hooks/useVerifyPassword';
import I18n from '../../i18n';

export const E2E_PASSWORD_POLICIES: IPasswordPolicy[] = [
	{
		name: 'MinLength',
		label: I18n.t('At_Least_Characters', { quantity: 30 }),
		regex: /.{30,}/
	},
	{
		name: 'AtLeastOneLowercase',
		label: I18n.t('At_Least_1_Lowercase_Letter'),
		regex: /[a-z]/
	},
	{
		name: 'AtLeastOneUppercase',
		label: I18n.t('At_Least_1_Uppercase_Letter'),
		regex: /[A-Z]/
	},
	{
		name: 'AtLeastOneNumber',
		label: I18n.t('At_Least_1_Number'),
		regex: /[0-9]/
	},
	{
		name: 'AtLeastOneSpecialCharacter',
		label: I18n.t('At_Least_1_Symbol'),
		regex: /[^A-Za-z0-9]/
	}
];

export const validateE2EPassword = (password: string): boolean =>
	E2E_PASSWORD_POLICIES.every(policy => policy.regex.test(password));
