import { type AccessibilityActionInfo } from 'react-native';

import i18n from '~/i18n';
import { useIsScreenReaderEnabled } from '~/lib/hooks/useIsScreenReaderEnabled';
import { isExternalKeyboardConnected } from '~/lib/methods/helpers/externalInput';

export const useRoomItemAccessibilityActions = (): AccessibilityActionInfo[] | undefined => {
	const isScreenReaderEnabled = useIsScreenReaderEnabled();
	if (!isScreenReaderEnabled || isExternalKeyboardConnected()) {
		return undefined;
	}
	return [{ name: 'showActions', label: i18n.t('Show_room_actions') }];
};
