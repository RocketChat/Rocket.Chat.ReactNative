import React, { useEffect, useCallback, useState } from 'react';
import { Text, StyleSheet, ActivityIndicator } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../../../constants/colors';
import { MESSAGE_TYPE_LOAD_NEXT_CHUNK, MESSAGE_TYPE_LOAD_PREVIOUS_CHUNK } from '../../../constants/messageTypeLoad';
import { useTheme } from '../../../theme';
import Touch from '../../../utils/touch';
import sharedStyles from '../../Styles';
import I18n from '../../../i18n';

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
	const [loading, setLoading] = useState(false);

	const handleLoad = useCallback(async() => {
		try {
			if (loading) {
				return;
			}
			setLoading(true);
			await load();
		} finally {
			setLoading(false);
		}
	}, [loading]);

	useEffect(() => {
		if (runOnRender) {
			handleLoad();
		}
	}, []);

	let text = 'Load_More';
	if (type === MESSAGE_TYPE_LOAD_NEXT_CHUNK) {
		text = 'Load_Newer';
	}
	if (type === MESSAGE_TYPE_LOAD_PREVIOUS_CHUNK) {
		text = 'Load_Older';
	}

	return (
		<Touch
			onPress={handleLoad}
			style={styles.button}
			theme={theme}
			enabled={!loading}
		>
			{
				loading
					? <ActivityIndicator color={themes[theme].auxiliaryText} />
					: <Text style={[styles.text, { color: themes[theme].titleText }]}>{I18n.t(text)}</Text>
			}
		</Touch>
	);
};

LoadMore.propTypes = {
	load: PropTypes.func,
	type: PropTypes.string,
	runOnRender: PropTypes.bool
};

export default LoadMore;
