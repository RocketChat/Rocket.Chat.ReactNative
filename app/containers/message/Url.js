import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import FastImage from 'react-native-fast-image';
import { RectButton } from 'react-native-gesture-handler';

import openLink from '../../utils/openLink';
import sharedStyles from '../../views/Styles';
import {
	COLOR_BACKGROUND_CONTAINER, COLOR_BORDER, COLOR_PRIMARY, COLOR_WHITE
} from '../../constants/colors';

const styles = StyleSheet.create({
	button: {
		marginTop: 6
	},
	container: {
		flex: 1,
		flexDirection: 'column',
		borderRadius: 4,
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		borderColor: COLOR_BORDER,
		borderWidth: 1
	},
	textContainer: {
		flex: 1,
		flexDirection: 'column',
		padding: 15,
		justifyContent: 'flex-start',
		alignItems: 'flex-start'
	},
	title: {
		color: COLOR_PRIMARY,
		fontSize: 16,
		...sharedStyles.textMedium
	},
	description: {
		fontSize: 16,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
	},
	marginTop: {
		marginTop: 4
	},
	image: {
		width: '100%',
		height: 150,
		borderTopLeftRadius: 4,
		borderTopRightRadius: 4
	}
});

const onPress = (url) => {
	openLink(url);
};
const Url = ({ url, index }) => {
	if (!url) {
		return null;
	}
	return (
		<RectButton
			onPress={() => onPress(url.url)}
			style={[styles.button, index > 0 && styles.marginTop, styles.container]}
			activeOpacity={0.5}
			underlayColor={COLOR_WHITE}
		>
			{url.image ? <FastImage source={{ uri: url.image }} style={styles.image} resizeMode={FastImage.resizeMode.cover} /> : null}
			<View style={styles.textContainer}>
				<Text style={styles.title} numberOfLines={2}>{url.title}</Text>
				<Text style={styles.description} numberOfLines={2}>{url.description}</Text>
			</View>
		</RectButton>
	);
};

Url.propTypes = {
	url: PropTypes.object.isRequired,
	index: PropTypes.number
};

export default Url;
