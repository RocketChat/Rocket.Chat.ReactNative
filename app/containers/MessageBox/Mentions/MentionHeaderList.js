import React, { useContext } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';

import { MENTIONS_TRACKING_TYPE_CANNED } from '../constants';
import styles from '../styles';
import sharedStyles from '../../../views/Styles';
import I18n from '../../../i18n';
import { themes } from '../../../constants/colors';
import { CustomIcon } from '../../../lib/Icons';
import MessageboxContext from '../Context';

const MentionHeaderList = ({ trackingType, hasMentions, theme, loading }) => {
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

MentionHeaderList.propTypes = {
	trackingType: PropTypes.string,
	hasMentions: PropTypes.bool,
	theme: PropTypes.string,
	loading: PropTypes.bool
};

export default MentionHeaderList;
