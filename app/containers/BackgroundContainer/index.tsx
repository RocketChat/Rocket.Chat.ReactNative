import React from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';
import sharedStyles from '../../views/Styles';
import { themes } from '../../lib/constants';

export interface IBackgroundContainer {
	text?: string;
	loading?: boolean;
}

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	image: {
		width: '100%',
		height: '100%',
		position: 'absolute'
	},
	text: {
		position: 'absolute',
		top: 60,
		left: 0,
		right: 0,
		fontSize: 16,
		paddingHorizontal: 24,
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter
	}
});

const BackgroundContainer = ({ text, loading }: IBackgroundContainer): React.ReactElement => {
	const { theme } = useTheme();
	return (
		<View style={styles.container}>
			<ImageBackground source={{ uri: `message_empty_${theme}` }} style={styles.image} />
			{text && !loading ? <Text style={[styles.text, { color: themes[theme].fontHint }]}>{text}</Text> : null}
			{loading ? <ActivityIndicator style={styles.text} color={themes[theme].fontHint} /> : null}
		</View>
	);
};

export default BackgroundContainer;
