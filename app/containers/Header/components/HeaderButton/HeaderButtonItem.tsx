import React, { memo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';

import { CustomIcon, type TIconsName } from '../../../CustomIcon';
import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import { useResponsiveLayout } from '../../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

export interface IHeaderButtonItem {
	title?: string;
	iconName?: TIconsName;
	onPress?: <T>(arg: T) => void;
	testID?: string;
	badge?(): React.ReactElement | null;
	color?: string;
	disabled?: boolean;
	accessibilityLabel?: string;
}

export const BUTTON_HIT_SLOP = {
	top: 5,
	right: 5,
	bottom: 5,
	left: 5
};

const styles = StyleSheet.create({
	container: {
		padding: 6
	},
	title: {
		...sharedStyles.textRegular
	}
});

const Item = memo(
	({
		title,
		iconName,
		onPress,
		testID,
		badge,
		color,
		disabled,
		accessibilityLabel,
		...props
	}: IHeaderButtonItem): React.ReactElement => {
		'use memo';

		const { colors } = useTheme();
		const { scaleFontSize } = useResponsiveLayout();
		const fontSize = Platform.select({
			android: scaleFontSize(14),
			default: scaleFontSize(17)
		});
		return (
			<BorderlessButton onPress={onPress} testID={testID} hitSlop={BUTTON_HIT_SLOP} enabled={!disabled} style={styles.container}>
				<View
					accessible
					accessibilityLabel={accessibilityLabel}
					style={{
						opacity: disabled ? 0.5 : 1
					}}>
					{iconName ? (
						<CustomIcon name={iconName} size={24} color={color} {...props} />
					) : (
						<Text style={[styles.title, { color: color || colors.fontDefault, fontSize }]} {...props}>
							{title}
						</Text>
					)}
					{badge ? badge() : null}
				</View>
			</BorderlessButton>
		);
	}
);

Item.displayName = 'HeaderButton.Item';

export default Item;
