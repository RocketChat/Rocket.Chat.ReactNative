import React from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, Text, View } from 'react-native';

import { withTheme } from '../../theme';
import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';

interface IBackgroundContainer {
	text?: string;
	theme?: string;
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

const BackgroundContainer = ({ theme, text, loading }: IBackgroundContainer) => (
	<View style={styles.container}>
		<ImageBackground source={{ uri: `message_empty_${theme}` }} style={styles.image} />
		{text ? <Text style={[styles.text, { color: themes[theme!].auxiliaryTintColor }]}>{text}</Text> : null}
		{loading ? <ActivityIndicator style={styles.text} color={themes[theme!].auxiliaryTintColor} /> : null}
	</View>
);

export default withTheme(BackgroundContainer);
