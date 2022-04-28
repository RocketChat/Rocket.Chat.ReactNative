import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { MessageTypeLoad, themes } from '../../../lib/constants';
import { MessageType } from '../../../definitions';
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

const LoadMore = ({
	load,
	type,
	runOnRender
}: {
	load: Function;
	type: MessageType;
	runOnRender: boolean;
}): React.ReactElement => {
	const { theme } = useTheme();
	const [loading, setLoading] = useState(false);

	const handleLoad = useCallback(async () => {
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
	if (type === MessageTypeLoad.NEXT_CHUNK) {
		text = 'Load_Newer';
	}
	if (type === MessageTypeLoad.PREVIOUS_CHUNK) {
		text = 'Load_Older';
	}

	return (
		<Touch onPress={handleLoad} style={styles.button} theme={theme} enabled={!loading}>
			{loading ? (
				<ActivityIndicator color={themes[theme].auxiliaryText} />
			) : (
				<Text style={[styles.text, { color: themes[theme].titleText }]}>{I18n.t(text)}</Text>
			)}
		</Touch>
	);
};

export default LoadMore;
