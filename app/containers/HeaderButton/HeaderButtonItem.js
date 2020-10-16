import React from 'react';
import { Text, View, StyleSheet, Platform } from 'react-native';
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
	},
	title: {
		...Platform.select({
			android: {
				fontFamily: 'sans-serif-medium',
				fontSize: 14,
				// marginHorizontal: 11
			},
			default: {
				fontSize: 17,
				// marginHorizontal: 10,
			}
		})
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
	title, iconName, onPress, testID, theme, badgeText, badgeColor
}) => (
	<Touchable onPress={onPress} testID={testID} hitSlop={BUTTON_HIT_SLOP} style={styles.container}>
		<>
			{
				iconName
					? <CustomIcon name={iconName} size={24} color={themes[theme].headerTintColor} />
					: <Text style={[styles.title, { color: themes[theme].headerTintColor }]}>{title}</Text>
			}
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
	onPress: PropTypes.func.isRequired,
	title: PropTypes.string,
	iconName: PropTypes.string,
	testID: PropTypes.string,
	theme: PropTypes.string,
	badgeText: PropTypes.number,
	badgeColor: PropTypes.string
};

export default withTheme(HeaderButtonItem);
