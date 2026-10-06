import { Pressable, PixelRatio, type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import Avatar from './Avatar';
import { CustomIcon, type TIconsName } from './CustomIcon';
import sharedStyles from '../views/Styles';
import { isIOS } from '../lib/methods/helpers';
import { useTheme } from '../theme';
import { useResponsiveLayout } from '../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import i18n from '../i18n';

const ROW_HEIGHT = 54;

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row'
	},
	avatar: {
		marginHorizontal: 15,
		marginVertical: 12
	},
	textContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		marginRight: 15
	},
	name: {
		fontSize: 16,
		...sharedStyles.textMedium
	},
	icon: {
		marginHorizontal: 15,
		alignSelf: 'center'
	}
});

interface IUserItem {
	name: string;
	username: string;
	onPress(): void;
	testID: string;
	onLongPress?: () => void;
	style?: StyleProp<ViewStyle>;
	icon?: TIconsName | null;
	iconColor?: string;
	isChecked?: boolean;
}

const UserItem = ({ name, username, onPress, testID, onLongPress, style, icon, iconColor, isChecked }: IUserItem) => {
	const { colors } = useTheme();
	const { fontScale } = useResponsiveLayout();
	const height = PixelRatio.roundToNearestPixel(ROW_HEIGHT * fontScale);
	let label = `${name}`;
	if (icon) {
		label = `${name} ${isChecked ? i18n.t('Selected') : i18n.t('Unselected')}`;
	}
	return (
		<Pressable
			onPress={onPress}
			onLongPress={onLongPress}
			testID={testID}
			android_ripple={{
				color: colors.surfaceNeutral
			}}
			style={({ pressed }: any) => ({
				backgroundColor: isIOS && pressed ? colors.surfaceNeutral : 'transparent'
			})}
			accessibilityLabel={label}
			accessibilityRole='button'>
			<View style={[styles.container, { height }, style]}>
				<Avatar text={username} size={30} style={styles.avatar} />
				<View style={styles.textContainer}>
					<Text style={[styles.name, { color: colors.fontDefault }]} numberOfLines={1}>
						{name}
					</Text>
				</View>
				{icon ? <CustomIcon name={icon} size={22} color={iconColor || colors.fontHint} style={styles.icon} /> : null}
			</View>
		</Pressable>
	);
};

export default UserItem;
