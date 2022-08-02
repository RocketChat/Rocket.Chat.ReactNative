import React from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';

import { ISelectedUser } from '../reducers/selectedUsers';
import { useTheme } from '../theme';
import { CustomIcon } from './CustomIcon';
import sharedStyles from '../views/Styles';
import Avatar from './Avatar';

const styles = StyleSheet.create({
	pressable: {
		marginVertical: 16,
		paddingHorizontal: 8,
		marginRight: 8,
		borderRadius: 2
	},
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	avatar: {
		marginRight: 8,
		marginVertical: 8
	},
	textContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		marginRight: 8,
		maxWidth: 120
	},
	name: {
		fontSize: 16,
		...sharedStyles.textMedium
	}
});

const Chips = ({
	item,
	username,
	name,
	onPress,
	testID
}: {
	username: string;
	name: string;
	item: ISelectedUser;
	onPress: Function;
	testID?: string;
}) => {
	const { colors } = useTheme();

	return (
		<Pressable
			testID={testID}
			style={({ pressed }) => [
				styles.pressable,
				{
					backgroundColor: pressed ? colors.bannerBackground : colors.auxiliaryBackground
				}
			]}
			onPress={() => onPress(item)}
			android_ripple={{
				color: colors.bannerBackground
			}}>
			<View style={styles.container}>
				<Avatar text={username} size={28} style={styles.avatar} />
				<View style={styles.textContainer}>
					<Text style={[styles.name, { color: colors.bodyText }]} numberOfLines={1}>
						{name}
					</Text>
				</View>
				<CustomIcon name={'close'} size={16} color={colors.auxiliaryTintColor} />
			</View>
		</Pressable>
	);
};

export default Chips;
