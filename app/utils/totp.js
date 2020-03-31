import prompt from 'react-native-prompt-android';
import { settings } from '@rocket.chat/sdk';

import I18n from '../i18n';

export const totp = ({ method }) => new Promise((resolve, reject) => {
	const isEmail = method === 'email';
	prompt(
		I18n.t('Two_Factor_Authentication'),
		I18n.t(
			isEmail
				? 'Verify_your_email_for_the_code_we_sent'
				: 'Open_your_authentication_app_and_enter_the_code'
		),
		[
			{
				text: I18n.t('Cancel'),
				onPress: () => reject(),
				style: 'cancel'
			},
			{
				text: 'Verify',
				onPress: (code) => {
					settings.customHeaders = {
						...settings.customHeaders,
						'x-2fa-code': code,
						'x-2fa-method': method
					};
					resolve(code);
				}
			}
		],
		{
			type: 'plain-text',
			cancelable: false
		}
	);
});
