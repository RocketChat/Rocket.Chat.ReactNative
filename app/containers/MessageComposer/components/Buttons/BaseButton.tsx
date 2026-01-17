import { BorderlessButton } from 'react-native-gesture-handler';
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

import I18n from '../../../../i18n';
import { CustomIcon, type TIconsName } from '../../../CustomIcon';

export interface IBaseButton {
	testID: string;
	accessibilityLabel: string;
	icon: TIconsName;
	color?: string;
	onPress(): void;
}

export const hitSlop = {
	top: 10,
	right: 10,
	bottom: 10,
	left: 10
};

export const BaseButton = ({ accessibilityLabel, icon, color, testID, onPress }: IBaseButton) => {
	'use memo';

	const { fontScale } = useWindowDimensions();
	const size = 24 * fontScale;

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
