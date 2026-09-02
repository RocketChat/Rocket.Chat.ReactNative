import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

import I18n from '../../../../i18n';
import { useIsAutocompleteVisible } from '../../store';

export const useAutocompleteA11yAnnounce = (): void => {
	const isAutocompleteVisible = useIsAutocompleteVisible();

	useEffect(() => {
		if (!isAutocompleteVisible) {
			return;
		}

		// timeout to prevent conflict with default keyboard announcement.
		const timeout = setTimeout(() => {
			AccessibilityInfo.announceForAccessibility(I18n.t('The_autocomplete_options_are_available_above_the_input_composer'));
		}, 800);

		return () => clearTimeout(timeout);
	}, [isAutocompleteVisible]);
};
