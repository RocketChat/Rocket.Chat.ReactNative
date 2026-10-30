import { type AccessibilityProps } from 'react-native';

import i18n from '~/i18n';

export const useMessageAccessibilityActions = (isDisabled: boolean): AccessibilityProps['accessibilityActions'] => {
	if (isDisabled) {
		return undefined;
	}
	return [{ name: 'showActions', label: i18n.t('Show_message_actions') }];
};
