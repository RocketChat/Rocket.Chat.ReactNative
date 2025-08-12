import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../theme';
import { CustomIcon, TIconsName } from '../../CustomIcon';
import i18n from '../../../i18n';
import sharedStyles from '../../../views/Styles';

interface ITipProps {
	iconType?: 'success' | 'error' | 'info';
	description: string;
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		gap: 4
	},
	text: {
		...sharedStyles.textRegular,
		lineHeight: 16,
		fontSize: 12
	}
});

const Tip = ({ iconType, description }: ITipProps) => {
	const { colors } = useTheme();

	let icon: TIconsName = 'info';
	let color = colors.fontDefault;
	let accessibilityLabel = '';
	if (iconType === 'success') {
		icon = 'success-circle';
		color = colors.statusFontSuccess;
		accessibilityLabel = `${i18n.t('Password_Tip_Success')}, `;
	}
	if (iconType === 'error') {
		icon = 'error-circle';
		color = colors.statusFontDanger;
		accessibilityLabel = `${i18n.t('Password_Tip_Error')}, `;
	}

	return (
		<View style={styles.container}>
			<CustomIcon color={color} name={icon} size={16} />
			<Text style={{ ...styles.text, color }} accessible accessibilityLabel={`${accessibilityLabel}${description}`}>
				{description}
			</Text>
		</View>
	);
};

export default Tip;
