import { BorderlessButton } from 'react-native-gesture-handler';
import React from 'react';
import { View, StyleSheet, PixelRatio } from 'react-native';

import I18n from '../../../../i18n';
import { CustomIcon, TIconsName } from '../../../CustomIcon';

export interface IBaseButton {
	testID: string;
	accessibilityLabel: string;
	icon: TIconsName;
	color?: string;
	onPress(): void;
}

export const hitSlop = {
	top: 16,
	right: 16,
	bottom: 16,
	left: 16
};

export const BaseButton = ({ accessibilityLabel, icon, color, testID, onPress }: IBaseButton) => {
	const size = 24 * PixelRatio.getFontScale();

	return (
		<BorderlessButton
			style={[styles.button, { width: size, height: size }]}
			onPress={() => onPress()}
			testID={testID}
			hitSlop={hitSlop}>
			<View accessible accessibilityLabel={I18n.t(accessibilityLabel)} accessibilityRole='button'>
				<CustomIcon name={icon} size={24} color={color} />
			</View>
		</BorderlessButton>
	);
};

const styles = StyleSheet.create({
	button: {
		alignItems: 'center',
		justifyContent: 'center'
	}
});
