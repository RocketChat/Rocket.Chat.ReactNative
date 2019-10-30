import React from 'react';
import { FlatList } from 'react-native';
import PropTypes from 'prop-types';
import equal from 'deep-equal';

import styles from '../styles';
import MentionItem from './MentionItem';

const Mentions = React.memo(({ mentions, trackingType }) => {
	if (!trackingType) {
		return null;
	}
	return (
		<FlatList
			testID='messagebox-container'
			style={styles.mentionList}
			data={mentions}
			extraData={mentions}
			renderItem={({ item }) => <MentionItem item={item} trackingType={trackingType} />}
			keyExtractor={item => item.id || item.username || item.command || item}
			keyboardShouldPersistTaps='always'
		/>
	);
}, (prevProps, nextProps) => {
	if (prevProps.trackingType !== nextProps.trackingType) {
		return false;
	}
	if (!equal(prevProps.mentions, nextProps.mentions)) {
		return false;
	}
	return true;
});

Mentions.propTypes = {
	mentions: PropTypes.array,
	trackingType: PropTypes.string
};

export default Mentions;
