import React from 'react';
import { FlatList, View } from 'react-native';
import PropTypes from 'prop-types';
import { dequal } from 'dequal';

import styles from '../styles';
import MentionItem from './MentionItem';
import MentionHeaderList from './MentionHeaderList';
import { themes } from '../../../constants/colors';

const Mentions = React.memo(({
	mentions, trackingType, theme, mentionLoading
}) => {
	if (!trackingType) {
		return null;
	}
	return (
		<View testID='messagebox-container'>
			<FlatList
				style={[styles.mentionList, { backgroundColor: themes[theme].auxiliaryBackground }]}
				ListHeaderComponent={() => <MentionHeaderList trackingType={trackingType} hasMentions={mentions.length > 0} theme={theme} mentionLoading={mentionLoading} />}
				data={mentions}
				extraData={mentions}
				renderItem={({ item }) => <MentionItem item={item} trackingType={trackingType} theme={theme} />}
				keyExtractor={item => item.rid || item.name || item.command || item.id || item}
				keyboardShouldPersistTaps='always'
			/>
		</View>
	);
}, (prevProps, nextProps) => {
	if (prevProps.mentionLoading !== nextProps.mentionLoading) {
		return false;
	}
	if (prevProps.theme !== nextProps.theme) {
		return false;
	}
	if (prevProps.trackingType !== nextProps.trackingType) {
		return false;
	}
	if (!dequal(prevProps.mentions, nextProps.mentions)) {
		return false;
	}
	return true;
});

Mentions.propTypes = {
	mentions: PropTypes.array,
	trackingType: PropTypes.string,
	theme: PropTypes.string,
	mentionLoading: PropTypes.bool
};

export default Mentions;
