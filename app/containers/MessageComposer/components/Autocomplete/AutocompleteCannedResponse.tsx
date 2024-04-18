import React from 'react';
import { View, Text } from 'react-native';

import sharedStyles from '../../../../views/Styles';
import { IAutocompleteCannedResponse } from '../../interfaces';
import I18n from '../../../../i18n';
import { CustomIcon } from '../../../CustomIcon';
import { NO_CANNED_RESPONSES } from '../../constants';
import { useStyle } from './styles';

export const AutocompleteCannedResponse = ({ item }: { item: IAutocompleteCannedResponse }) => {
	const [styles] = useStyle();
	if (item.id === NO_CANNED_RESPONSES) {
		return (
			<View style={styles.canned}>
				<View style={styles.cannedTitle}>
					<Text style={styles.cannedTitleText}>
						{I18n.t('No_match_found')} <Text style={sharedStyles.textSemibold}>{I18n.t('Check_canned_responses')}</Text>
					</Text>
					<CustomIcon name='chevron-right' size={24} />
				</View>
			</View>
		);
	}
	return (
		<View style={styles.canned}>
			<View style={styles.cannedTitle}>
				<Text style={styles.cannedTitleText} numberOfLines={1}>
					{item.title}
				</Text>
			</View>
			{item.subtitle ? (
				<View style={styles.cannedSubtitle}>
					<Text style={styles.cannedSubtitleText}>{item.subtitle}</Text>
				</View>
			) : null}
		</View>
	);
};
