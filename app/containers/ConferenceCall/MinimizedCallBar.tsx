import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import i18n from '../../i18n';
import { useTheme } from '../../theme';
import { MIN_HEIGHT as COMPOSER_MIN_HEIGHT } from '../MessageComposer/constants';
import { CustomIcon } from '../CustomIcon';

type IMinimizedCallBar = {
	onPress: () => void;
};

// Mounted at the root, so it cannot take part in any screen's layout: keep it a pill clear of
// RoomView's composer, on the left so it misses the list's jump-to-bottom FAB.
const COMPOSER_CLEARANCE = COMPOSER_MIN_HEIGHT + 12;

const MinimizedCallBar = ({ onPress }: IMinimizedCallBar) => {
	const { colors } = useTheme();
	const { bottom } = useSafeAreaInsets();

	return (
		<View style={[styles.container, { bottom: bottom + COMPOSER_CLEARANCE }]} pointerEvents='box-none'>
			<TouchableOpacity
				style={[styles.bar, { backgroundColor: colors.buttonBackgroundPrimaryDefault }]}
				onPress={onPress}
				accessibilityRole='button'
				accessibilityLabel={i18n.t('Return_to_call')}>
				<CustomIcon name='phone' size={20} color={colors.fontWhite} />
				<Text style={[styles.label, { color: colors.fontWhite }]} numberOfLines={1}>
					{i18n.t('Return_to_call')}
				</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		left: 0,
		right: 0,
		alignItems: 'flex-start',
		paddingHorizontal: 16
	},
	bar: {
		flexDirection: 'row',
		alignItems: 'center',
		maxWidth: '100%',
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 10
	},
	label: {
		marginLeft: 8,
		fontSize: 14,
		fontWeight: '600'
	}
});

export default MinimizedCallBar;
