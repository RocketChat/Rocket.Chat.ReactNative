import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

import I18n from '../../../../i18n';
import { useIsAutocompleteVisible } from '../../../../views/RoomView/stores/ComposerStore';

const DELAY_TO_AVOID_KEYBOARD_ANNOUNCEMENT_CONFLICT = 800;

export const useAutocompleteA11yAnnounce = (): void => {
	const isAutocompleteVisible = useIsAutocompleteVisible();

	useEffect(() => {
		if (!isAutocompleteVisible) {
			return;
		}

		const timeout = setTimeout(() => {
			AccessibilityInfo.announceForAccessibility(I18n.t('The_autocomplete_options_are_available_above_the_input_composer'));
		}, DELAY_TO_AVOID_KEYBOARD_ANNOUNCEMENT_CONFLICT);

		return () => clearTimeout(timeout);
	}, [isAutocompleteVisible]);
};
