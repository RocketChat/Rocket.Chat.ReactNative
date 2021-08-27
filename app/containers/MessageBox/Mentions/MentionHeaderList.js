import React from 'react';
import {
	View, Text, ActivityIndicator, TouchableOpacity
} from 'react-native';
import PropTypes from 'prop-types';
import { MENTIONS_TRACKING_TYPE_CANNED } from '../constants';

import styles from '../styles';
import i18n from '../../../i18n';
import { themes } from '../../../constants/colors';
import { CustomIcon } from '../../../lib/Icons';

const MentionHeaderList = ({
	trackingType, hasMentions, theme, mentionLoading
}) => {
	let content = (<></>);

	if (trackingType === MENTIONS_TRACKING_TYPE_CANNED) {
		if (hasMentions) {
			content = (
				<View style={styles.wrapMentionHeaderList}>
					<Text style={[styles.mentionHeaderList, { color: themes[theme].bodyText }]}>{i18n.t('CANNED_RESPONSE')}</Text>
				</View>
			);
		} else {
			content = (
				<TouchableOpacity style={[styles.wrapMentionHeaderListRow, styles.mentionNoMatchHeader]} onPress={() => { /** AJEITAR A FUNCTION PELO CONTEXT */ }}>
					<Text style={[styles.mentionHeaderList, { color: themes[theme].auxiliaryText }]}>
						{i18n.t('No_match_found', { action: i18n.t('Check_canned_responses') })}
					</Text>
					<CustomIcon name='chevron-right' size={20} style={styles.mentionChevronMargin} />
				</TouchableOpacity>
			);
		}
	}

	const searchingIndicator = (
		<View style={styles.wrapMentionHeaderListRow}>
			<ActivityIndicator style={styles.loadingPaddingHeader} size='small' color={themes[theme].actionTintColor} />
			<Text style={[styles.mentionHeaderList, { color: themes[theme].auxiliaryText }]}>{i18n.t('Searching')}</Text>
		</View>
	);

	return (
		<>
			{
				mentionLoading
					? searchingIndicator
					: content }
		</>
	);
};

MentionHeaderList.propTypes = {
	trackingType: PropTypes.string,
	hasMentions: PropTypes.bool,
	theme: PropTypes.string,
	mentionLoading: PropTypes.bool
};


export default MentionHeaderList;
