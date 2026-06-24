import { View } from 'react-native';
import { type ReactElement } from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native-unistyles';

import i18n from '../../../../i18n';
import { useTheme } from '../../../../theme';
import { CustomIcon } from '../../../CustomIcon';
import { hitSlop } from '../Buttons';

export const ReviewButton = ({ onPress }: { onPress: Function }): ReactElement => {
	'use memo';

	const { colors } = useTheme();
	return (
		<BorderlessButton style={styles.button} onPress={() => onPress()} hitSlop={hitSlop}>
			<View accessible accessibilityLabel={i18n.t('Review_message')} accessibilityRole='button'>
				<CustomIcon name={'arrow-right'} size={24} color={colors.fontDefault} />
			</View>
		</BorderlessButton>
	);
};

const styles = StyleSheet.create(theme => ({
	button: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: theme.colors.buttonBackgroundPrimaryDefault
	}
}));
