import React from 'react';
import { FlatList } from 'react-native';
import PropTypes from 'prop-types';
import equal from 'deep-equal';

import Item from './Item';
import styles from '../styles';

const CommandsPreview = React.memo(({ commandPreview, showCommandPreview }) => {
	if (!showCommandPreview) {
		return null;
	}
	return (
		<FlatList
			testID='commandbox-container'
			style={styles.mentionList}
			data={commandPreview}
			renderItem={({ item }) => <Item item={item} />}
			keyExtractor={item => item.id}
			keyboardShouldPersistTaps='always'
			horizontal
			showsHorizontalScrollIndicator={false}
		/>
	);
}, (prevProps, nextProps) => {
	if (prevProps.showCommandPreview !== nextProps.showCommandPreview) {
		return false;
	}
	if (!equal(prevProps.commandPreview, nextProps.commandPreview)) {
		return false;
	}
	return true;
});

CommandsPreview.propTypes = {
	commandPreview: PropTypes.array,
	showCommandPreview: PropTypes.bool
};

export default CommandsPreview;
