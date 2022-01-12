import React from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon } from '../../lib/Icons';
import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';
import sharedStyles from '../../views/Styles';

interface IHeaderButtonItem {
	title?: string;
	iconName?: string;
	onPress: <T>(arg: T) => void;
	testID?: string;
	theme?: string;
	badge?(): void;
}

export const BUTTON_HIT_SLOP = {
	top: 5,
	right: 5,
	bottom: 5,
	left: 5
};

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 6
	},
	title: {
		...Platform.select({
			android: {
				fontSize: 14
			},
			default: {
				fontSize: 17
			}
		}),
		...sharedStyles.textRegular
	}
});

const Item = ({ title, iconName, onPress, testID, theme, badge }: IHeaderButtonItem) => (
	<Touchable onPress={onPress} testID={testID} hitSlop={BUTTON_HIT_SLOP} style={styles.container}>
		<>
			{iconName ? (
				<CustomIcon name={iconName} size={24} color={themes[theme!].headerTintColor} />
			) : (
				<Text style={[styles.title, { color: themes[theme!].headerTintColor }]}>{title}</Text>
			)}
			{badge ? badge() : null}
		</>
	</Touchable>
);

Item.displayName = 'HeaderButton.Item';

export default withTheme(Item);
