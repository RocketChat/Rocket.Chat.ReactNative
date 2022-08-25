import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import Avatar from './Avatar';
import { CustomIcon, TIconsName } from './CustomIcon';
import sharedStyles from '../views/Styles';
import { isIOS } from '../lib/methods/helpers';
import { useTheme } from '../theme';

const styles = StyleSheet.create({
	button: {
		height: 54
	},
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
}

const UserItem = ({ name, username, onPress, testID, onLongPress, style, icon, iconColor }: IUserItem) => {
	const { colors } = useTheme();

	return (
		<Pressable
			onPress={onPress}
			onLongPress={onLongPress}
			testID={testID}
			android_ripple={{
				color: colors.bannerBackground
			}}
			style={({ pressed }: any) => ({
				backgroundColor: isIOS && pressed ? colors.bannerBackground : 'transparent'
			})}
		>
			<View style={[styles.container, styles.button, style]}>
				<Avatar text={username} size={30} style={styles.avatar} />
				<View style={styles.textContainer}>
					<Text style={[styles.name, { color: colors.bodyText }]} numberOfLines={1}>
						{name}
					</Text>
				</View>
				{icon ? <CustomIcon name={icon} size={22} color={iconColor || colors.actionTintColor} style={styles.icon} /> : null}
			</View>
		</Pressable>
	);
};

export default UserItem;
