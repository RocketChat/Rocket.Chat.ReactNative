import React from 'react';
import { View, Text } from 'react-native';

import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import { IAutocompleteCannedResponse } from '../../interfaces';
import I18n from '../../../../i18n';
import { CustomIcon } from '../../../CustomIcon';
import { NO_CANNED_RESPONSES } from '../../constants';

export const AutocompleteCannedResponse = ({ item }: { item: IAutocompleteCannedResponse }) => {
	const { colors } = useTheme();
	if (item.id === NO_CANNED_RESPONSES) {
		return (
			<>
				<View style={{ flex: 1, justifyContent: 'center' }}>
					<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
						<Text style={[sharedStyles.textRegular, { flex: 1, fontSize: 14, color: colors.fontHint }]} numberOfLines={1}>
							{I18n.t('No_match_found')} <Text style={sharedStyles.textSemibold}>{I18n.t('Check_canned_responses')}</Text>
						</Text>
						<CustomIcon name='chevron-right' size={24} color={colors.fontHint} />
					</View>
				</View>
			</>
		);
	}
	return (
		<>
			<View style={{ flex: 1, justifyContent: 'center' }}>
				<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
					<Text style={[sharedStyles.textBold, { fontSize: 14, color: colors.fontDefault }]} numberOfLines={1}>
						{item.title}
					</Text>
				</View>
				{item.subtitle ? (
					<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingTop: 2 }}>
						<Text style={[sharedStyles.textRegular, { fontSize: 14, color: colors.fontSecondaryInfo, flex: 1 }]}>
							{item.subtitle}
						</Text>
					</View>
				) : null}
			</View>
		</>
	);
};
