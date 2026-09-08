import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import i18n from '../../i18n';
import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';

type IMinimizedCallBar = {
	onPress: () => void;
};

const MinimizedCallBar = ({ onPress }: IMinimizedCallBar) => {
	const { colors } = useTheme();
	const { bottom } = useSafeAreaInsets();

	return (
		<View style={[styles.container, { bottom }]} pointerEvents='box-none'>
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
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingBottom: 8
	},
	bar: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'stretch',
		borderRadius: 4,
		paddingHorizontal: 16,
		paddingVertical: 12
	},
	label: {
		flex: 1,
		marginLeft: 8,
		fontSize: 14,
		fontWeight: '600'
	}
});

export default MinimizedCallBar;
