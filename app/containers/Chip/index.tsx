import React from 'react';
import { Pressable, StyleSheet, View, Text, StyleProp, TextStyle, ViewStyle } from 'react-native';

import { ISelectedUser } from '../../reducers/selectedUsers';
import { useTheme } from '../../theme';
import { CustomIcon, TIconsName } from '../CustomIcon';
import sharedStyles from '../../views/Styles';
import Avatar from '../Avatar';

const styles = StyleSheet.create({
	pressable: {
		marginVertical: 16,
		paddingHorizontal: 8,
		marginRight: 8,
		borderRadius: 2,
		height: 40,
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
		marginRight: 8,
		maxWidth: 120
	},
	name: {
		fontSize: 16,
		...sharedStyles.textMedium
	}
});

const Chip = ({
	item,
	username,
	text,
	onPress = () => {},
	testID,
	iconName,
	style,
	textStyle
}: {
	username?: string;
	text?: string;
	item: ISelectedUser;
	onPress?: Function;
	testID?: string;
	iconName?: TIconsName;
	style?: StyleProp<ViewStyle>;
	textStyle?: StyleProp<TextStyle>;
}) => {
	const { colors } = useTheme();

	return (
		<Pressable
			testID={testID}
			style={({ pressed }) => [
				styles.pressable,
				{
					backgroundColor: pressed ? colors.bannerBackground : colors.auxiliaryBackground
				},
				style
			]}
			onPress={() => onPress(item)}
			android_ripple={{
				color: colors.bannerBackground
			}}>
			<View style={styles.container}>
				{username ? <Avatar text={username} size={28} style={styles.avatar} /> : null}
				{text ? (
					<View style={styles.textContainer}>
						<Text style={[styles.name, { color: colors.bodyText }, textStyle]} numberOfLines={1}>
							{text}
						</Text>
					</View>
				) : null}
				{iconName ? <CustomIcon name={iconName} size={16} color={colors.auxiliaryTintColor} /> : null}
			</View>
		</Pressable>
	);
};

export default Chip;
