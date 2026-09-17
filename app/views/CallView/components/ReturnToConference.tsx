import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CustomIcon } from '~/containers/CustomIcon';
import I18n from '~/i18n';
import Navigation from '~/lib/navigation/appNavigation';
import { useIsVideoConfMinimized } from '~/lib/services/videoConf/useVideoConfWindowStore';
import sharedStyles from '~/views/Styles';
import { useTheme } from '~/theme';

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 16,
		paddingTop: 12
	},
	pill: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 4
	},
	label: {
		...sharedStyles.textMedium,
		fontSize: 14,
		lineHeight: 20,
		marginLeft: 8
	}
});

/**
 * Shown while a conference is still running behind this screen. `JitsiMeetView` stays mounted in
 * the stack, so this navigates back to it instead of joining again.
 */
const ReturnToConference = () => {
	const { colors } = useTheme();
	const minimized = useIsVideoConfMinimized();

	if (!minimized) {
		return null;
	}

	return (
		<View style={styles.container}>
			<Pressable
				testID='call-view-return-to-conference'
				accessibilityLabel={I18n.t('Return_to_conference')}
				onPress={() => Navigation.navigate('JitsiMeetView')}
				style={[styles.pill, { backgroundColor: colors.buttonBackgroundPrimaryDefault }]}>
				<CustomIcon name='arrow-expand' size={20} color={colors.fontWhite} />
				<Text style={[styles.label, { color: colors.fontWhite }]}>{I18n.t('Return_to_conference')}</Text>
			</Pressable>
		</View>
	);
};

export default ReturnToConference;
