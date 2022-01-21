import React from 'react';
// @ts-ignore
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import Avatar from '../containers/Avatar';
import { CustomIcon } from '../lib/Icons';
import { STATUS_COLORS, themes } from '../constants/colors';
import Status from '../containers/Status/Status';
import sharedStyles from '../views/Styles';
import { isIOS } from '../utils/deviceInfo';

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
	nameContainer: {		
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center'
	},
	name: {
		fontSize: 17,
		...sharedStyles.textMedium
	},
	username: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	icon: {
		marginHorizontal: 15,
		alignSelf: 'center'
	},
	statusIcon: {
		marginRight:2
	}
});

interface IUserItem {
	name: string;
	username: string;
	onPress(): void;
	testID: string;
	onLongPress?: () => void;
	style?: StyleProp<ViewStyle>;
	status?: string;
	size?: number;
	icon?: string | null;
	theme: string;
}


const UserItem = ({ name, username, onPress, testID, onLongPress, style, status, size = 16, icon, theme }: IUserItem) => {
	const color = themes[theme!].titleText;
	const iconStyle = [styles.statusIcon, { color }, style];

	return (
		<Pressable
			onPress={onPress}
			onLongPress={onLongPress}
			testID={testID}
			android_ripple={{
				color: themes[theme].bannerBackground
			}}
			style={({ pressed }: any) => ({
				backgroundColor: isIOS && pressed ? themes[theme].bannerBackground : 'transparent'
			})}>
			<View style={[styles.container, styles.button, style]}>
				<Avatar text={username} size={30} style={styles.avatar} />
				<View style={styles.textContainer}>
					<View style={styles.nameContainer}>
						{status?<Status style={[iconStyle, { color: STATUS_COLORS[status!] ?? STATUS_COLORS.offline }]} size={size} status={status!} />:null}
						<Text style={[styles.name, { color: themes[theme].titleText }]} numberOfLines={1}>
							{name}
						</Text>
					</View>
					
					<Text style={[styles.username, { color: themes[theme].auxiliaryText }]} numberOfLines={1}>
						@{username}
					</Text>
				</View>
				{icon ? <CustomIcon name={icon} size={22} style={[styles.icon, { color: themes[theme].actionTintColor }]} /> : null}
			</View>
		</Pressable>);
}


export default UserItem;
