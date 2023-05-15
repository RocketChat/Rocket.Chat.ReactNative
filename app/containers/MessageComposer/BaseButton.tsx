import { BorderlessButton } from 'react-native-gesture-handler';
import React from 'react';
import { View, StyleSheet } from 'react-native';

import i18n from '../../i18n';
import { CustomIcon, TIconsName } from '../CustomIcon';
import { useTheme } from '../../theme';

const styles = StyleSheet.create({
	button: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 24,
		height: 24
	}
});

interface IBaseButton {
	onPress(): void;
	testID: string;
	accessibilityLabel: string;
	icon: TIconsName;
	color?: string;
}

export const BaseButton = ({ accessibilityLabel, icon, color, ...props }: IBaseButton) => {
	const { colors } = useTheme();
	return (
		<BorderlessButton {...props} style={styles.button}>
			<View
				accessible
				accessibilityLabel={accessibilityLabel ? i18n.t(accessibilityLabel) : accessibilityLabel}
				accessibilityRole='button'
			>
				<CustomIcon name={icon} size={24} color={color || colors.fontSecondaryInfo} />
			</View>
		</BorderlessButton>
	);
};
