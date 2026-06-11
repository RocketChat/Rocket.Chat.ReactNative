import { AccessibilityInfo } from 'react-native';

import I18n from '../../../i18n';

export const announceSearchResultsForAccessibility = (count: number): void => {
	if (count < 1) {
		AccessibilityInfo.announceForAccessibility(I18n.t('No_results_found'));
		return;
	}

	const message = count === 1 ? I18n.t('One_result_found') : I18n.t('Search_Results_found', { count: count.toString() });
	AccessibilityInfo.announceForAccessibility(message);
};
