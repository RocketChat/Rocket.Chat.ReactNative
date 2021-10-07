import React from 'react';
import { FlatList, View } from 'react-native';
import PropTypes from 'prop-types';
import { dequal } from 'dequal';

import styles from '../styles';
import MentionItem from './MentionItem';
import { themes } from '../../../constants/colors';

const Mentions = React.memo(({ mentions, trackingType, theme }) => {
	if (!trackingType) {
		return null;
	}
	return (
		<View testID='messagebox-container'>
			<FlatList
				style={[styles.mentionList, { backgroundColor: themes[theme].auxiliaryBackground }]}
				data={mentions}
				extraData={mentions}
				renderItem={({ item }) => <MentionItem item={item} trackingType={trackingType} theme={theme} />}
				keyExtractor={item => item.rid || item.name || item.command || item}
				keyboardShouldPersistTaps='always'
			/>
		</View>
	);
}, (prevProps, nextProps) => {
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
	theme: PropTypes.string
};

export default Mentions;
