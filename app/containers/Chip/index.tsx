import { Pressable, View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import sharedStyles from '../../views/Styles';
import Avatar from '../Avatar';

const styles = StyleSheet.create(theme => ({
	pressable: {
		paddingHorizontal: 4,
		marginHorizontal: 4,
		borderRadius: 4,
		justifyContent: 'center',
		maxWidth: 192
	},
	container: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	avatar: {
		marginRight: 8,
		marginVertical: 8
	},
	textContainer: {
		flexShrink: 1,
		marginRight: 8,
		maxWidth: 110
	},
	name: {
		fontSize: 16,
		...sharedStyles.textMedium,
		color: theme.colors.fontDefault
	}
}));

export interface IChip {
	avatar?: string;
	text: string;
	onPress?: Function;
	testID?: string;
	style?: StyleProp<ViewStyle>;
	fullWidth?: boolean;
}

const Chip = ({ avatar, text, onPress, testID, style, fullWidth }: IChip) => {
	const { colors } = useTheme();

	return (
		<Pressable
			testID={testID}
			style={({ pressed }) => [
				styles.pressable,
				{
					backgroundColor: pressed ? colors.surfaceNeutral : colors.buttonBackgroundSecondaryDefault,
					maxWidth: fullWidth ? undefined : styles.pressable.maxWidth
				},
				style
			]}
			disabled={!onPress}
			onPress={() => onPress?.()}
			android_ripple={{
				color: colors.surfaceNeutral
			}}>
			<View style={styles.container}>
				{avatar ? <Avatar text={avatar} size={28} style={styles.avatar} /> : null}
				<View style={[styles.textContainer, fullWidth && { maxWidth: undefined }]}>
					<Text style={styles.name} numberOfLines={1}>
						{text}
					</Text>
				</View>
				{onPress ? <CustomIcon name='close' size={16} /> : null}
			</View>
		</Pressable>
	);
};

export default Chip;
