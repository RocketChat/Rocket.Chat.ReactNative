import { BorderlessButton } from 'react-native-gesture-handler';
import React from 'react';
import { View, StyleSheet } from 'react-native';

import I18n from '../../../i18n';
import { CustomIcon, TIconsName } from '../../CustomIcon';
import { useTheme } from '../../../theme';

const styles = StyleSheet.create({
	button: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 24,
		height: 24
	}
});

interface IBaseButton {
	testID: string;
	accessibilityLabel: string;
	icon: TIconsName;
	color?: string;
	onPress(): void;
}

export const BaseButton = ({ accessibilityLabel, icon, color, testID, onPress }: IBaseButton) => {
	const { colors } = useTheme();
	return (
		<BorderlessButton style={styles.button} onPress={onPress} testID={testID}>
			<View accessible accessibilityLabel={I18n.t(accessibilityLabel)} accessibilityRole='button'>
				<CustomIcon name={icon} size={24} color={color || colors.fontSecondaryInfo} />
			</View>
		</BorderlessButton>
	);
};
