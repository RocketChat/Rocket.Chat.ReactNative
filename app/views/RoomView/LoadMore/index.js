import React, { useCallback, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';

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

const LoadMore = ({ load, item, auto }) => {
	const { theme } = useTheme();
	const handleLoad = useCallback(() => load(item));

	useEffect(() => {
		if (auto) {
			handleLoad();
		}
	}, []);

	let text = 'Load More';
	if (item.t === MESSAGE_TYPE_LOAD_NEXT_CHUNK) {
		text = 'Load Newer';
	}
	if (item.t === MESSAGE_TYPE_LOAD_PREVIOUS_CHUNK) {
		text = 'Load Older';
	}

	return (
		<Touch
			onPress={handleLoad}
			style={styles.button}
			theme={theme}
		>
			<Text style={[styles.text, { color: themes[theme].titleText }]}>{text}</Text>
		</Touch>
	);
};

export default LoadMore;
