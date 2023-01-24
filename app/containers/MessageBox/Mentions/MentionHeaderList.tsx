import React, { useContext } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { themes } from '../../../lib/constants';
import I18n from '../../../i18n';
import { CustomIcon } from '../../CustomIcon';
import { useTheme } from '../../../theme';
import sharedStyles from '../../../views/Styles';
import MessageboxContext from '../Context';
import styles from '../styles';
import { MENTIONS_TRACKING_TYPE_CANNED } from '../constants';

interface IMentionHeaderList {
	trackingType: string;
	hasMentions: boolean;
	loading: boolean;
}

const MentionHeaderList = ({ trackingType, hasMentions, loading }: IMentionHeaderList) => {
	const { theme } = useTheme();
	const context = useContext(MessageboxContext);
	const { onPressNoMatchCanned } = context;

	if (trackingType === MENTIONS_TRACKING_TYPE_CANNED) {
		if (loading) {
			return (
				<View style={styles.wrapMentionHeaderListRow}>
					<ActivityIndicator style={styles.loadingPaddingHeader} size='small' />
					<Text style={[styles.mentionHeaderList, { color: themes[theme].auxiliaryText }]}>{I18n.t('Searching')}</Text>
				</View>
			);
		}

		if (!hasMentions) {
			return (
				<TouchableOpacity style={[styles.wrapMentionHeaderListRow, styles.mentionNoMatchHeader]} onPress={onPressNoMatchCanned}>
					<Text style={[styles.mentionHeaderListNoMatchFound, { color: themes[theme].auxiliaryText }]}>
						{I18n.t('No_match_found')} <Text style={sharedStyles.textSemibold}>{I18n.t('Check_canned_responses')}</Text>
					</Text>
					<CustomIcon name='chevron-right' size={24} color={themes[theme].auxiliaryText} />
				</TouchableOpacity>
			);
		}
	}

	return null;
};

export default MentionHeaderList;
