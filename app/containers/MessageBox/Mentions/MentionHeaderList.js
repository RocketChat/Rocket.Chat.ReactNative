import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import PropTypes from 'prop-types';
import { MENTIONS_TRACKING_TYPE_CANNED } from '../constants';

import styles from '../styles';
import i18n from '../../../i18n';
import { themes } from '../../../constants/colors';

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
			content = <Text style={[styles.mentionHeaderList, { color: themes[theme].bodyText }]}>NO MATCH</Text>;
		}
	}

	const searchingIndicator = (
		<View style={styles.loadingMentionHeader}>
			<ActivityIndicator size='small' color={themes[theme].actionTintColor} />
			<Text style={[styles.mentionHeaderList, { color: themes[theme].auxiliaryText }]}>Searching</Text>
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
