import React from 'react';
import {
	ImageBackground, StyleSheet, Text, View, ActivityIndicator
} from 'react-native';
import PropTypes from 'prop-types';

import { withTheme } from '../../theme';
import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';

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

const BackgroundContainer = ({ theme, text, loading }) => (
	<View style={styles.container}>
		<ImageBackground source={{ uri: `message_empty_${ theme }` }} style={styles.image} />
		{text ? <Text style={[styles.text, { color: themes[theme].auxiliaryTintColor }]}>{text}</Text> : null}
		{loading ? <ActivityIndicator style={[styles.text, { color: themes[theme].auxiliaryTintColor }]} /> : null}
	</View>
);

BackgroundContainer.propTypes = {
	text: PropTypes.string,
	theme: PropTypes.string,
	loading: PropTypes.bool
};
export default withTheme(BackgroundContainer);
