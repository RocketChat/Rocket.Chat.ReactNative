import { StyleSheet, View } from 'react-native';
import React, { ReactElement } from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';

import { useTheme } from '../../../../theme';
import { CustomIcon } from '../../../CustomIcon';
import { hitSlop } from '../Buttons';

export const ReviewButton = ({ onPress }: { onPress: Function }): ReactElement => {
	const { colors } = useTheme();
	return (
		<BorderlessButton
			style={[
				styles.button,
				{
					backgroundColor: colors.buttonBackgroundPrimaryDefault
				}
			]}
			onPress={() => onPress()}
			hitSlop={hitSlop}>
			<View accessible accessibilityLabel={'Cancel_recording'} accessibilityRole='button'>
				<CustomIcon name={'arrow-right'} size={24} color={colors.fontWhite} />
			</View>
		</BorderlessButton>
	);
};

const styles = StyleSheet.create({
	button: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 32,
		height: 32,
		borderRadius: 16
	}
});
