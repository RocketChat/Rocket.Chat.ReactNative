import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon } from '../../lib/Icons';
import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';

export const BUTTON_HIT_SLOP = {
	top: 5, right: 5, bottom: 5, left: 5
};

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 6
	},
	badgeContainer: {
		padding: 2,
		position: 'absolute',
		right: -3,
		top: -3,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center'
	},
	badgeText: {
		fontSize: 10,
		fontWeight: '600'
	}
});

const Badge = ({ text, backgroundColor, theme }) => {
	if (!text) {
		return null;
	}

	if (text > 99) {
		text = '+99';
	}

	const minWidth = 11 + text.length * 5;

	return (
		<View style={[styles.badgeContainer, { minWidth, backgroundColor }]}>
			<Text style={[styles.badgeText, { color: themes[theme].buttonText }]} numberOfLines={1}>{text}</Text>
		</View>
	);
};

const HeaderButtonItem = ({
	name, onPress, testID, theme, badgeText, badgeColor
}) => (
	<Touchable onPress={onPress} testID={testID} hitSlop={BUTTON_HIT_SLOP} style={styles.container}>
		<>
			<CustomIcon name={name} size={24} color={themes[theme].headerTintColor} />
			<Badge text={badgeText} backgroundColor={badgeColor} theme={theme} />
		</>
	</Touchable>
);

Badge.propTypes = {
	text: PropTypes.string,
	backgroundColor: PropTypes.string,
	theme: PropTypes.string
};

HeaderButtonItem.propTypes = {
	name: PropTypes.string.isRequired,
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string,
	theme: PropTypes.string,
	badgeText: PropTypes.number,
	badgeColor: PropTypes.string
};

export default withTheme(HeaderButtonItem);
