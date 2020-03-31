import prompt from 'react-native-prompt-android';
import { settings } from '@rocket.chat/sdk';

import I18n from '../i18n';

export const totp = ({ method }) => new Promise((resolve, reject) => {
	prompt(
		'title',
		'totp',
		[
			{
				text: I18n.t('Cancel'),
				onPress: reject,
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
