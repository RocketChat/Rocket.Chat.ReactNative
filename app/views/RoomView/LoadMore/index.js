import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../../../constants/colors';
import { MESSAGE_TYPE_LOAD_NEXT_CHUNK, MESSAGE_TYPE_LOAD_PREVIOUS_CHUNK } from '../../../constants/messageTypeLoad';
import { useTheme } from '../../../theme';
import Touch from '../../../utils/touch';
import sharedStyles from '../../Styles';

const styles = StyleSheet.create({
	button: {
		paddingVertical: 16,
		alignItems: 'center',
		justifyContent: 'center'
	},
	text: {
		fontSize: 16,
		...sharedStyles.textMedium
	}
});

const LoadMore = ({ load, type, runOnRender }) => {
	const { theme } = useTheme();

	useEffect(() => {
		if (runOnRender) {
			load();
		}
	}, []);

	// I18n
	let text = 'Load More';
	if (type === MESSAGE_TYPE_LOAD_NEXT_CHUNK) {
		text = 'Load Newer';
	}
	if (type === MESSAGE_TYPE_LOAD_PREVIOUS_CHUNK) {
		text = 'Load Older';
	}

	return (
		<Touch
			onPress={load}
			style={styles.button}
			theme={theme}
		>
			<Text style={[styles.text, { color: themes[theme].titleText }]}>{text}</Text>
		</Touch>
	);
};

LoadMore.propTypes = {
	load: PropTypes.func,
	type: PropTypes.string,
	runOnRender: PropTypes.bool
};

export default LoadMore;
