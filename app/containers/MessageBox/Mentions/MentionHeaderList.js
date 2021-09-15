import React, { useContext } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';

import { MENTIONS_TRACKING_TYPE_CANNED } from '../constants';
import styles from '../styles';
import I18n from '../../../i18n';
import { themes } from '../../../constants/colors';
import { CustomIcon } from '../../../lib/Icons';
import MessageboxContext from '../Context';

const MentionHeaderList = ({ trackingType, hasMentions, theme, loading }) => {
	if (loading) {
		return (
			<View style={styles.wrapMentionHeaderListRow}>
				<ActivityIndicator style={styles.loadingPaddingHeader} size='small' color={themes[theme].actionTintColor} />
				<Text style={[styles.mentionHeaderList, { color: themes[theme].auxiliaryText }]}>{I18n.t('Searching')}</Text>
			</View>
		);
	}

	const context = useContext(MessageboxContext);
	const { onPressNoMatchCanned } = context;

	if (trackingType === MENTIONS_TRACKING_TYPE_CANNED) {
		if (hasMentions) {
			return (
				<View style={styles.wrapMentionHeaderList}>
					<Text style={[styles.mentionHeaderList, { color: themes[theme].bodyText }]}>{I18n.t('CANNED_RESPONSES')}</Text>
				</View>
			);
		} else {
			return (
				<TouchableOpacity style={[styles.wrapMentionHeaderListRow, styles.mentionNoMatchHeader]} onPress={onPressNoMatchCanned}>
					<Text style={[styles.mentionHeaderList, { color: themes[theme].auxiliaryText }]}>
						{I18n.t('No_match_found', { action: I18n.t('Check_canned_responses') })}
					</Text>
					<CustomIcon name='chevron-right' size={20} style={styles.mentionChevronMargin} />
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
