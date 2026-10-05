import { Platform, Pressable, StyleSheet } from 'react-native';

import { CustomIcon } from '~/containers/CustomIcon';
import { useTheme } from '~/theme';
import { FLOATING_ACTION_BUTTON_SIZE } from './constants';
import { type IFloatingActionButton } from './interfaces';
import FloatingActionButtonContainer from './FloatingActionButtonContainer';

const styles = StyleSheet.create({
	button: {
		width: FLOATING_ACTION_BUTTON_SIZE,
		height: FLOATING_ACTION_BUTTON_SIZE,
		borderRadius: FLOATING_ACTION_BUTTON_SIZE / 2,
		alignItems: 'center',
		justifyContent: 'center',
		...Platform.select({
			android: { overflow: 'hidden', elevation: 6 },
			default: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 4 }
		})
	}
});

const PlainFloatingActionButton = ({ icon, accessibilityLabel, testID, onPress }: IFloatingActionButton) => {
	const { colors } = useTheme();
	return (
		<FloatingActionButtonContainer>
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
		</FloatingActionButtonContainer>
	);
};

export default PlainFloatingActionButton;
