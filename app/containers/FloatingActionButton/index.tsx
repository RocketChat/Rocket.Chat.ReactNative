import { Platform, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomIcon, type TIconsName } from '~/containers/CustomIcon';
import { useTheme } from '~/theme';

const SIZE = 56;
const MARGIN = 16;

export const FLOATING_ACTION_BUTTON_CLEARANCE = SIZE + MARGIN * 2;

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFill,
		alignItems: 'flex-end',
		justifyContent: 'flex-end',
		padding: MARGIN
	},
	button: {
		width: SIZE,
		height: SIZE,
		borderRadius: SIZE / 2,
		alignItems: 'center',
		justifyContent: 'center',
		...Platform.select({
			android: { overflow: 'hidden', elevation: 6 },
			default: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 4 }
		})
	}
});

interface IFloatingActionButton {
	icon: TIconsName;
	accessibilityLabel: string;
	testID: string;
	onPress: () => void;
}

const FloatingActionButton = ({ icon, accessibilityLabel, testID, onPress }: IFloatingActionButton) => {
	const { colors } = useTheme();
	return (
		<SafeAreaView edges={['bottom']} pointerEvents='box-none' style={styles.container}>
			<Pressable
				testID={testID}
				accessibilityRole='button'
				accessibilityLabel={accessibilityLabel}
				onPress={onPress}
				android_ripple={{ color: colors.buttonBackgroundPrimaryPress, foreground: true }}
				style={({ pressed }) => [
					styles.button,
					{ backgroundColor: pressed ? colors.buttonBackgroundPrimaryPress : colors.buttonBackgroundPrimaryDefault }
				]}>
				<CustomIcon name={icon} size={24} color={colors.fontWhite} />
			</Pressable>
		</SafeAreaView>
	);
};

export default FloatingActionButton;
