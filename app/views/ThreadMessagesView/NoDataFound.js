import React from 'react';
import {
	ImageBackground, StyleSheet, Text, View
} from 'react-native';
import PropTypes from 'prop-types';

import { withTheme } from '../../theme';
import sharedStyles from '../Styles';
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
		textAlign: 'center',
		fontSize: 16,
		paddingHorizontal: 24,
		...sharedStyles.textRegular
	}
});

const EmptyRoom = ({ theme, text }) => (
	<View style={styles.container}>
		<ImageBackground source={{ uri: `message_empty_${ theme }` }} style={styles.image} />
		<Text style={[styles.text, { color: themes[theme].auxiliaryTintColor }]}>{text}</Text>
	</View>
);

EmptyRoom.propTypes = {
	text: PropTypes.string,
	theme: PropTypes.string
};
export default withTheme(EmptyRoom);
