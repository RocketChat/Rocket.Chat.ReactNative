import React from 'react';
import { FlatList } from 'react-native';
import PropTypes from 'prop-types';
import equal from 'deep-equal';

import Item from './Item';
import styles from '../styles';
import { themes } from '../../../constants/colors';
import { withTheme } from '../../../theme';

const CommandsPreview = React.memo(({ theme, commandPreview, showCommandPreview }) => {
	if (!showCommandPreview) {
		return null;
	}
	return (
		<FlatList
			testID='commandbox-container'
			style={[styles.mentionList, { backgroundColor: themes[theme].messageboxBackground }]}
			data={commandPreview}
			renderItem={({ item }) => <Item item={item} theme={theme} />}
			keyExtractor={item => item.id}
			keyboardShouldPersistTaps='always'
			horizontal
			showsHorizontalScrollIndicator={false}
		/>
	);
}, (prevProps, nextProps) => {
	if (prevProps.theme !== nextProps.theme) {
		return false;
	}
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
	showCommandPreview: PropTypes.bool,
	theme: PropTypes.string
};

export default withTheme(CommandsPreview);
