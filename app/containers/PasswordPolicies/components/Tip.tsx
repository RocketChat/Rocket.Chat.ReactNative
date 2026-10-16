import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '~/theme';
import { CustomIcon, type TIconsName } from '~/containers/CustomIcon';
import I18n from '~/i18n';
import sharedStyles from '~/views/Styles';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';

interface ITipProps {
	iconType?: 'success' | 'error' | 'info';
	description: string;
}

const TEXT_LINE_HEIGHT = 16;

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		gap: 4
	},
	iconLine: {
		justifyContent: 'center'
	},
	text: {
		...sharedStyles.textRegular,
		lineHeight: TEXT_LINE_HEIGHT,
		fontSize: 12
	}
});

const Tip = ({ iconType, description }: ITipProps) => {
	const { colors } = useTheme();
	const { fontScale } = useResponsiveLayout();

	let icon: TIconsName = 'info';
	let color = colors.fontDefault;
	let accessibilityLabel = '';
	if (iconType === 'success') {
		icon = 'success-circle';
		color = colors.statusFontSuccess;
		accessibilityLabel = `${I18n.t('Password_Tip_Success')}, `;
	}
	if (iconType === 'error') {
		icon = 'error-circle';
		color = colors.statusFontDanger;
		accessibilityLabel = `${I18n.t('Password_Tip_Error')}, `;
	}

	return (
		<View accessible accessibilityLabel={`${accessibilityLabel}${description}`} style={styles.container}>
			<View style={[styles.iconLine, { height: TEXT_LINE_HEIGHT * fontScale }]}>
				<CustomIcon color={color} name={icon} size={16} />
			</View>
			<Text style={{ ...styles.text, color }}>{description}</Text>
		</View>
	);
};

export default Tip;
